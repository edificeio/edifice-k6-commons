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
    { headers: getHeaders() },
  );
  return res;
}