import { Session } from '.';
import { bytes } from 'k6';
import { WorkspaceFile } from './models';
export declare const WS_MANAGER_SHARE: string[];
export declare const WS_READER_SHARE: string[];
export declare function uploadFile(fileData: bytes, session: Session): WorkspaceFile;
//# sourceMappingURL=ws.utils.d.ts.map