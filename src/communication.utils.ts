import http from "k6/http";
import { fail } from "k6";
import { getHeaders } from "./user.utils";

const rootUrl = __ENV.ROOT_URL;

export function addCommunicationBetweenGroups(
  groupIdFrom: string,
  groupIdTo: string,
) {
  const res = http.post(
    `${rootUrl}/communication/v2/group/${groupIdFrom}/communique/${groupIdTo}`,
    "{}",
    { headers: getHeaders() },
  );
  if (res.status !== 200) {
    console.error(
      `Error while adding communication between ${groupIdFrom} -> ${groupIdTo}`,
    );
    console.error(res);
    fail(`could not add communication between ${groupIdFrom} -> ${groupIdTo}`);
  }
  return res;
}
/**
 * Remove communication between groups
 * @param groupIdFrom Id of the group which can see the other group
 * @param groupIdTo Id of the group which can be seen by the other group
 * @returns The HTTP raw response
 */
export function removeCommunicationBetweenGroups(
  groupIdFrom: string,
  groupIdTo: string,
) {
  const res = http.del(
    `${rootUrl}/communication/group/${groupIdFrom}/relations/${groupIdTo}`,
    null,
    { headers: getHeaders() },
  );
  if (res.status !== 200) {
    console.error(
      `Error while removing communication between ${groupIdFrom} -> ${groupIdTo}`,
    );
    console.error(res);
    fail(
      `could not remove communication between ${groupIdFrom} -> ${groupIdTo}`,
    );
  }
  return res;
}
