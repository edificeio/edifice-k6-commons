import http, { RefinedResponse, ResponseType } from "k6/http";
import { getHeaders } from "./user.utils";
import { check, fail } from "k6";
//@ts-ignore
import { FormData } from "https://jslib.k6.io/formdata/0.0.2/index.js";

const rootUrl = __ENV.ROOT_URL;

export function launchExport(apps: string[]): RefinedResponse<ResponseType | undefined> {
  const payload = JSON.stringify({ apps });
  const res = http.post(
    `${rootUrl}/archive/export`,
    payload,
    { headers: getHeaders("application/json") },
  );
  return res;
}

export function launchExportOrFail(apps: string[]): string {
  const res = launchExport(apps);
  const ok = check(res, {
    "should have exportId in response": (r) => r.json("exportId") !== undefined,
    "should have message in response": (r) => r.json("message") === "export.in.progress",
  });
  if (!ok) {
    fail(`Failed to launch export for apps ${apps.join(", ")}. Response: ${res.status} - ${res.body}`);
  }
  return res.json("exportId") as string;
}


export function verifyExportFiles(exportId: string): RefinedResponse<ResponseType | undefined> {
  const res = http.get(
    `${rootUrl}/archive/export/verify/${exportId}`,
    { headers: getHeaders() },
  );
  return res;
}

export function downloadExportFile(exportId: string): RefinedResponse<ResponseType | undefined> {
  const res = http.get(
    `${rootUrl}/archive/export/${exportId}`,
    { 
      headers: getHeaders(),
      responseType: 'binary', // Ensure we get binary data
    },
  );
  return res;
}

/**
 * Represents a file entry in a ZIP archive
 */
export interface ZipEntry {
  /** Full path of the file in the archive */
  filename: string;
  /** Uncompressed size in bytes */
  uncompressedSize: number;
  /** Compressed size in bytes */
  compressedSize: number;
  /** Whether this entry is a directory */
  isDirectory: boolean;
  /** File data (only if extracted) */
  data?: Uint8Array;
  /** Compression method (0 = no compression, 8 = deflate) */
  compressionMethod: number;
}

/**
 * Represents a parsed ZIP archive
 */
export interface ZipArchive {
  /** Map of filename to entry */
  entries: Map<string, ZipEntry>;
  /** Total number of files (excluding directories) */
  fileCount: number;
  /** Total number of directories */
  directoryCount: number;
}

/**
 * Read a little-endian 16-bit integer from a byte array
 */
function readUInt16LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

/**
 * Read a little-endian 32-bit integer from a byte array
 */
function readUInt32LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24);
}

/**
 * Convert bytes to string (ASCII/UTF-8)
 */
function bytesToString(bytes: Uint8Array, offset: number, length: number): string {
  let str = '';
  for (let i = 0; i < length; i++) {
    str += String.fromCharCode(bytes[offset + i]);
  }
  return str;
}

/**
 * Convert response body to Uint8Array
 */
function toUint8Array(body: any): Uint8Array {
  // k6 binary responses can be ArrayBuffer, Uint8Array, or bytes
  if (body instanceof Uint8Array) {
    return body;
  }
  if (body instanceof ArrayBuffer) {
    return new Uint8Array(body);
  }
  // Check if it's an array-like object with numeric indices
  if (typeof body === 'object' && body.length !== undefined && typeof body[0] === 'number') {
    const bytes = new Uint8Array(body.length);
    for (let i = 0; i < body.length; i++) {
      bytes[i] = body[i];
    }
    return bytes;
  }
  // Last resort: treat as string (binary string where each char is a byte)
  // In k6, binary data is often returned as a string with charCodes representing bytes
  const str = String(body);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i) & 0xff;
  }
  return bytes;
}

/**
 * Find the End of Central Directory record in a ZIP file
 * Returns the offset of the EOCD record, or -1 if not found
 */
function findEndOfCentralDirectory(bytes: Uint8Array): number {
  // EOCD signature: 0x06054b50
  // Search from the end of the file (EOCD is at the end)
  const maxSearchLength = Math.min(bytes.length, 65536 + 22); // Maximum comment length + EOCD size
  const searchStart = Math.max(0, bytes.length - maxSearchLength);
  
  for (let i = bytes.length - 22; i >= searchStart; i--) {
    if (bytes[i] === 0x50 && bytes[i + 1] === 0x4b && bytes[i + 2] === 0x05 && bytes[i + 3] === 0x06) {
      return i;
    }
  }
  return -1;
}

/**
 * Parse a ZIP archive from binary data
 * @param data - Binary data of the ZIP file (from HTTP response body or file)
 * @returns Parsed ZIP archive with all entries
 */
export function parseZip(data: any): ZipArchive {
  const bytes = toUint8Array(data);
  const entries = new Map<string, ZipEntry>();
  let fileCount = 0;
  let directoryCount = 0;

  // Find End of Central Directory record
  const eocdOffset = findEndOfCentralDirectory(bytes);
  if (eocdOffset === -1) {
    throw new Error("Invalid ZIP file: End of Central Directory record not found");
  }

  // Parse EOCD
  const totalEntries = readUInt16LE(bytes, eocdOffset + 10);
  // const centralDirSize = readUInt32LE(bytes, eocdOffset + 12); // Not used
  const centralDirOffset = readUInt32LE(bytes, eocdOffset + 16);

  // Validate offsets
  if (centralDirOffset >= bytes.length) {
    throw new Error(`Invalid ZIP: Central Directory offset (${centralDirOffset}) exceeds file size (${bytes.length})`);
  }

  // Parse Central Directory entries
  let offset = centralDirOffset;
  for (let i = 0; i < totalEntries; i++) {
    // Check if we have enough bytes to read the signature
    if (offset + 4 > bytes.length) {
      throw new Error(`Invalid ZIP: Not enough data for Central Directory entry ${i} at offset ${offset} (file size: ${bytes.length})`);
    }
    
    // Central Directory File Header signature: 0x02014b50
    const signature = readUInt32LE(bytes, offset);
    if (signature !== 0x02014b50) {
      throw new Error(`Invalid Central Directory entry ${i} at offset ${offset}: expected signature 0x02014b50, got 0x${signature.toString(16).padStart(8, '0')}`);
    }

    const compressionMethod = readUInt16LE(bytes, offset + 10);
    const compressedSize = readUInt32LE(bytes, offset + 20);
    const uncompressedSize = readUInt32LE(bytes, offset + 24);
    const filenameLength = readUInt16LE(bytes, offset + 28);
    const extraFieldLength = readUInt16LE(bytes, offset + 30);
    const fileCommentLength = readUInt16LE(bytes, offset + 32);

    const filename = bytesToString(bytes, offset + 46, filenameLength);
    const isDirectory = filename.endsWith('/');

    if (isDirectory) {
      directoryCount++;
    } else {
      fileCount++;
    }

    entries.set(filename, {
      filename,
      uncompressedSize,
      compressedSize,
      isDirectory,
      compressionMethod,
    });

    offset += 46 + filenameLength + extraFieldLength + fileCommentLength;
  }

  return {
    entries,
    fileCount,
    directoryCount,
  };
}

/**
 * Extract a specific file from a ZIP archive
 * @param data - Binary data of the ZIP file
 * @param filename - Name of the file to extract
 * @returns The file data as Uint8Array, or null if not found
 */
export function extractFileFromZip(data: any, filename: string): Uint8Array | null {
  const bytes = toUint8Array(data);
  const archive = parseZip(data);
  const entry = archive.entries.get(filename);
  
  if (!entry || entry.isDirectory) {
    return null;
  }

  // Find the local file header by searching for the filename
  // Local file header signature: 0x04034b50
  for (let i = 0; i < bytes.length - 30; i++) {
    if (readUInt32LE(bytes, i) === 0x04034b50) {
      const filenameLength = readUInt16LE(bytes, i + 26);
      const extraFieldLength = readUInt16LE(bytes, i + 28);
      const localFilename = bytesToString(bytes, i + 30, filenameLength);
      
      if (localFilename === filename) {
        const compressionMethod = readUInt16LE(bytes, i + 8);
        const compressedSize = readUInt32LE(bytes, i + 18);
        const dataOffset = i + 30 + filenameLength + extraFieldLength;
        
        if (compressionMethod === 0) {
          // No compression - return data as-is
          return bytes.slice(dataOffset, dataOffset + compressedSize);
        } else {
          // Compressed data - k6 doesn't have built-in decompression
          throw new Error(`File "${filename}" uses compression method ${compressionMethod}. Decompression is not supported in k6. Use stored (uncompressed) files only.`);
        }
      }
    }
  }
  
  return null;
}

/**
 * Get a tree-like representation of the ZIP archive structure
 * @param archive - Parsed ZIP archive
 * @returns Array of path strings representing the directory structure
 */
export function getZipTree(archive: ZipArchive): string[] {
  const paths: string[] = [];
  for (const [filename, entry] of archive.entries) {
    paths.push(entry.isDirectory ? `${filename}` : filename);
  }
  return paths.sort();
}

/**
 * Validate ZIP archive structure against expected files and directories
 * @param archive - Parsed ZIP archive
 * @param expectedFiles - Array of expected file paths
 * @param expectedDirs - Array of expected directory paths (optional)
 * @returns Object with validation results
 */
export function validateZipStructure(
  archive: ZipArchive,
  expectedFiles: string[],
  expectedDirs?: string[]
): { valid: boolean; missing: string[]; unexpected: string[] } {
  const missing: string[] = [];
  const unexpected: string[] = [];
  const allExpected = new Set([...expectedFiles, ...(expectedDirs || [])]);
  
  // Check for missing files
  for (const expected of allExpected) {
    if (!archive.entries.has(expected)) {
      missing.push(expected);
    }
  }
  
  // Check for unexpected files (optional - you can skip this if you want)
  for (const [filename] of archive.entries) {
    if (!allExpected.has(filename)) {
      unexpected.push(filename);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing,
    unexpected,
  };
}