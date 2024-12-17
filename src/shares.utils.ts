import http, { RefinedResponse } from "k6/http";
import { getHeaders } from "./user.utils";
import { Shares } from "./models";

const rootUrl = __ENV.ROOT_URL;

export function shareFile(
  fileId: string,
  shares: Shares,
): RefinedResponse<any> {
  const headers = getHeaders();
  headers["content-type"] = "application/json";
  const payload = JSON.stringify(shares);
  return http.put(`${rootUrl}/workspace/share/resource/${fileId}`, payload, {
    headers,
  });
}
