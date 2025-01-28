import http, { RefinedResponse } from "k6/http";
import { getHeaders } from "./user.utils";
import { Shares } from "./models";

const rootUrl = __ENV.ROOT_URL;

/**
 * Method applying share rights to a file in workspace
 * @param fileId the id of the file to apply share rights to
 * @param shares the share rights
 * @returns the http response to the endpoint request
 */
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

/**
 * Method returning the share rights of a file stored in workspace
 * @param fileId the id of the file whose share rights must be fetched
 * @returns the share rights of a file in workspace
 */
export function getShares(fileId: string): Shares {
  const headers = getHeaders();
  // the empty 'search' query param is mandatory to retrieve the actual share rights of the file.
  let res = http.get(`${rootUrl}/workspace/share/json/${fileId}?search=`, {
    headers,
  });
  return JSON.parse(<string>res.body);
}
