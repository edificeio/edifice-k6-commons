import http from "k6/http";
import {check, fail} from "k6";
import { getHeaders } from "./user.utils";
import {Group, GroupCommunicationRelation} from "./models";

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

/**
 * Set direct communication between users : INCOMING A <= B
 *
 * @param userIdFrom Id of the user from
 * @param userIdTo Id of the group which can be seen by the other group
 * @param communicationRelation
 * @returns The HTTP raw response
 */
export function setDirectCommunicationOrFail(
  userIdFrom: string,
  userIdTo: string,
  communicationRelation: GroupCommunicationRelation,
) {
  const res = http.put(
    `${rootUrl}/communication/api/admin/users/${userIdFrom}/communiqueDirect/${userIdTo}?direction=${communicationRelation}`,
    null,
    { headers: getHeaders() },
  );
  if (res.status >= 300) {
    console.error(`Error while setting direct communication`);
    console.error(res);
    fail(`Error while setting direct communication`);
  }
  return res;
}

/**
 * Search visibles
 * @returns The HTTP raw response
 */
export function searchVisiblesOrFail() {
  const headers = getHeaders();
  const res = http.get(`${rootUrl}/communication/visible/search`, {
    headers,
  });
  if (res.status !== 200) {
    console.error(`Error while searching visibles`);
    console.error(res);
    fail(`Error while searching visibles`);
  }
  return res;
}


/**
 * Delete communication on group with the given communication direction.
 * @group
 * @param communicationRelation
 */
export function removeCommunicationOrFail(
    group: Group,
    communicationRelation: GroupCommunicationRelation,
) {
  const headers = getHeaders();
  let resDel = http.del(
      `${rootUrl}/communication/group/${group.id}?direction=${communicationRelation}`,
      null,
      { headers },
  );
  check(resDel, {
    "Change group communication relation": (r) => r.status === 200,
  });
}

/**
 * Modify a communication group to both and update communication
 * @param group
 */
export function safelyModifyCommunicationToBothOrFail(
    group: Group
) {
  const headers = getHeaders();
  let resDel = http.post(
      `${rootUrl}/communication/group/${group.id}/users`,
      null,
      { headers },
  );
  check(resDel, {
    "Safely modify group communication to BOTH": (r) => r.status === 200,
  });
}

/**
 * Modify a communication group remove both and calculate new state
 * @param group
 */
export function safelyRemoveCommunicationFromBothOrFail(
    group: Group
) {
  const headers = getHeaders();
  let resDel = http.del(
      `${rootUrl}/communication/group/${group.id}/users`,
      null,
      { headers },
  );
  check(resDel, {
    "Safely remove both of group communication": (r) => r.status === 200,
  });
}

/**
 * Modify a communication group with the given communication direction. Doesn't delete existing communication
 * @param group
 * @param communicationRelation
 */
export function modifyCommunicationRelationOrFail(
    group: Group,
    communicationRelation: GroupCommunicationRelation,
) {
  const headers = getHeaders();
  let resDel = http.post(
      `${rootUrl}/communication/group/${group.id}?direction=${communicationRelation}`,
      null,
      { headers },
  );
  check(resDel, {
    "Change group communication relation": (r) => r.status === 200,
  });
}

/**
 * Search visibles
 * @returns The HTTP raw response
 */
export function searchVisibles() {
  const headers = getHeaders();
  return http.get(`${rootUrl}/communication/visible/search`, {
    headers,
  });
}
