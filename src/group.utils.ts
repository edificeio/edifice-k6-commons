import http, { RefinedResponse } from "k6/http";
import { getHeaders } from "./user.utils";
import {
  BroadcastGroup,
  ProfileGroup,
  RoleOfStructure,
  ShareBookMark,
  ShareBookMarkCreationRequest,
  Structure,
  UserInfo,
  UserProfileType,
  getRolesOfStructure,
  GroupCommunicationRelation,
  Group,
} from ".";
import { check, fail } from "k6";

const rootUrl = __ENV.ROOT_URL;

export const ADML_FILTER = "AdminLocal";

export function createBroadcastGroup(
  broadcastListName: string,
  school: Structure,
): BroadcastGroup {
  let broadcastGroup = getBroadcastGroup(broadcastListName, school);
  if (broadcastGroup) {
    console.log("Broadcast group already existed");
  } else {
    console.log("Creating broadcast group");
    const headers = getHeaders();
    headers["content-type"] = "application/json";
    let payload = JSON.stringify({
      name: broadcastListName,
      structureId: school.id,
      subType: "BroadcastGroup",
    });
    let res = http.post(`${rootUrl}/directory/group`, payload, { headers });
    check(res, {
      "create broadcast group": (r) => r.status === 201,
    });
    const blId = JSON.parse(<string>res.body).id;
    payload = JSON.stringify({
      name: broadcastListName,
      autolinkTargetAllStructs: true,
      autolinkTargetStructs: [],
      autolinkUsersFromGroups: ["Teacher"],
    });
    res = http.put(`${rootUrl}/directory/group/${blId}`, payload, { headers });
    check(res, {
      "set broadcast group for teachers": (r) => r.status === 200,
    });
    const teacherGroupId = getTeacherRole(school).id;
    addCommRuleToGroup(blId, [teacherGroupId]);
    broadcastGroup = getBroadcastGroup(broadcastListName, school);
  }
  return broadcastGroup;
}

export function createGroup(groupName: string, school: Structure): Group {
  let group = getGroup(groupName, school);
  if (group) {
    console.debug("Group already existed");
  } else {
    console.debug("Creating group");
    const headers = getHeaders();
    headers["content-type"] = "application/json";
    let payload = JSON.stringify({
      name: groupName,
      structureId: school.id,
    });
    let res = http.post(`${rootUrl}/directory/group`, payload, { headers });
    check(res, {
      "create group": (r) => r.status === 201,
    });
    group = getGroup(groupName, school);
  }
  return group;
}

export function modifyCommunicationRelationOrFail(
  group: Group,
  communicationRelation: GroupCommunicationRelation,
) {
  const headers = getHeaders();
  switch (communicationRelation) {
    case "both":
      let res = http.post(
        `${rootUrl}/communication/group/${group.id}/users`,
        null,
        { headers },
      );
      check(res, {
        "Change group communication relation to BOTH": (r) => r.status === 200,
      });
      break;
    case "none":
      let resDel = http.del(
        `${rootUrl}/communication/group/${group.id}/users`,
        null,
        { headers },
      );
      check(resDel, {
        "Change group communication relation to NONE": (r) => r.status === 200,
      });
      break;
      break;
  }
}

/**
 * Create a manual group on a given structure and return the created group
 * @param groupName
 * @param school
 */
export function createGroupOrFail(groupName: string, school: Structure): Group {
  let group = getGroup(groupName, school);
  if (group) {
    console.debug("Group already existed");
  } else {
    console.debug("Creating group");
    const headers = getHeaders();
    headers["content-type"] = "application/json";
    let payload = JSON.stringify({
      name: groupName,
      structureId: school.id,
    });
    let res = http.post(`${rootUrl}/directory/group`, payload, { headers });
    check(res, {
      "create group": (r) => r.status === 201,
    });
    group = getGroup(groupName, school);
  }
  return group;
}

/**
 * Add an array of user to a group
 * @param userIds ids of user to add
 * @param group target group
 */
export function addUsersToGroup(
  userIds: string[],
  group: Group,
): RefinedResponse<any> {
  const headers = getHeaders();
  headers["content-type"] = "application/json";
  let payload = JSON.stringify({
    userIds: userIds,
  });
  return http.put(`${rootUrl}/directory/group/${group.id}/users/add`, payload, {
    headers,
  });
}

export function createShareBookMarkOrFail(
  request: ShareBookMarkCreationRequest,
) {
  let res = http.post(
    `${rootUrl}/directory/sharebookmark`,
    JSON.stringify(request),
    { headers: getHeaders() },
  );
  if (res.status !== 201) {
    console.error(res);
    fail(`Cannot create share bookmark`);
  }
  const id = JSON.parse(<string>res.body).id;
  return getShareBookMarkOrFail(id);
}

export function getShareBookMarkOrFail(id: string): ShareBookMark {
  let res = http.get(`${rootUrl}/directory/sharebookmark/${id}`, {
    headers: getHeaders(),
  });
  if (res.status !== 200) {
    console.error(res);
    fail(`Cannot get share bookmark ${id}`);
  }
  return JSON.parse(<string>res.body);
}

export function addCommRuleToGroup(groupId: string, fromGroupIds: string[]) {
  const headers = getHeaders();
  headers["content-type"] = "application/json";
  for (let fromGroupId of fromGroupIds) {
    let res = http.post(
      `${rootUrl}/communication/v2/group/${fromGroupId}/communique/${groupId}`,
      "{}",
      { headers },
    );
    if (res.status !== 200) {
      console.error(res);
      fail(`Cannot open comm rule from ${fromGroupId} to ${groupId}`);
    }
  }
}

/** Name used by the callers of {@link getProfileGroupOfStructure} -> profile of the group (`filter` of its node). */
const PROFILE_OF_GROUP: Record<string, string> = {
  teachers: "Teacher",
  students: "Student",
  relatives: "Relative",
  guests: "Guest",
  personnel: "Personnel",
};

/**
 * @param structureId Id of the structure
 * @returns The profile groups attached to the structure itself (not the ones of its classes), with their profile
 * (`filter`, ex: "Teacher"). Empty when they cannot be fetched.
 */
export function getStructureProfileGroups(
  structureId: string,
): { id: string; filter: string }[] {
  const res = http.get(
    `${rootUrl}/directory/group/admin/list?structureId=${structureId}&type=ProfileGroup`,
    { headers: getHeaders() },
  );
  if (res.status !== 200) {
    return [];
  }
  return (<any[]>JSON.parse(<string>res.body)).filter(
    (g) => g.subType === "StructureGroup",
  );
}

/**
 * @param groupName Name of a profile group as the tests write it in any language ("Teachers from group X.", "Parents du groupe X."...)
 * @returns The profile this name designates, undefined when it does not designate one
 */
export function profileOfGroupName(groupName: string): string | undefined {
  const name = groupName.toLowerCase();
  if (/teacher|enseignant/.test(name)) return "Teacher";
  if (/student|pupil|élève|eleve/.test(name)) return "Student";
  if (/relative|parent/.test(name)) return "Relative";
  if (/staff|personnel/.test(name)) return "Personnel";
  if (/guest|invité/.test(name)) return "Guest";
  return undefined;
}

export function getTeacherRole(structure: Structure) {
  return getProfileGroupOfStructure("teachers", structure);
}

export function getStudentRole(structure: Structure) {
  return getProfileGroupOfStructure("students", structure);
}

export function getParentRole(structure: Structure) {
  return getProfileGroupOfStructure("relatives", structure);
}

export function getGuestRole(structure: Structure) {
  let role = getProfileGroupOfStructure("guests", structure);
  if (!role) {
    role = getProfileGroupWithName(
      `Tous les invités du groupe ${structure.name}.`,
      structure,
    );
  }
  return role;
}

/**
 * @param profileGroupName Name of the profile group to find
 * @param structure Structure from which we wan to extract the profile group
 * @returns The profile group whose name matches the supplied name
 */
export function getProfileGroupOfStructure(
  profileGroupName: string,
  structure: Structure,
): RoleOfStructure {
  const roles = getRolesOfStructure(structure.id);
  // The wording of the name of a profile group depends on the platform ("X group teachers.", "Teachers from group X."...,
  // and "parents" where the tests say "relatives") : the profile (filter) of the group does not.
  const profile = PROFILE_OF_GROUP[profileGroupName];
  if (profile) {
    const ids = getStructureProfileGroups(structure.id)
      .filter((g) => g.filter === profile)
      .map((g) => g.id);
    const found = roles.filter((role) => ids.indexOf(role.id) >= 0);
    if (found.length > 0) {
      return found[0];
    }
  }
  return roles.filter((role) => {
    const lowerName = role.name.toLowerCase();
    return (
      lowerName ===
        `${structure.name} group ${profileGroupName}.`.toLowerCase() ||
      lowerName ===
        `${profileGroupName} from group ${structure.name}.`.toLowerCase()
    );
  })[0];
}
/**
 * @param name Name of the group to find
 * @param structure Structure from which we wan to extract the profile group
 * @returns The profile group whose name matches the supplied name
 */
export function getProfileGroupWithName(
  name: string,
  structure: Structure,
): RoleOfStructure {
  const roles = getRolesOfStructure(structure.id);
  return roles.filter((role) => role.name === name)[0];
}

/**
 *
 * @param structureId Id of the structure whose profile groups we want to fetch
 * @param session Session of the user performing the action
 * @returns All the ProfileGroup of the structure
 */
export function getProfileGroupsOfStructure(
  structureId: string,
): ProfileGroup[] {
  const headers = getHeaders();
  headers["Accept-Language"] = "en";
  let res = http.get(
    `${rootUrl}/directory/group/admin/list?structureId=${structureId}&translate=false`,
    { headers },
  );
  check(res, {
    "get structure profile groups should be ok": (r) => r.status == 200,
  });
  return JSON.parse(<string>res.body);
}

/**
 * Gets the group of all `profileType` of a structure.
 * @param profileType Type of profile whose group we want.
 * @param structure Structure from which we should filter the groups
 * @returns The found ProfileGroup
 */
export function getProfileGroupsOfStructureByType(
  profileType: UserProfileType,
  structure: Structure,
): ProfileGroup[] {
  const groups = getProfileGroupsOfStructure(structure.id);
  return groups.filter((g) => g.filter === profileType);
}
/**
 * Gets the group of all `profileType` of a structure.
 * @param profileType Type of profile whose group we want.
 * @param structure Structure from which we should filter the groups
 * @returns The found ProfileGroup
 */
export function getProfileGroupOfStructureByType(
  profileType: UserProfileType,
  structure: Structure,
): ProfileGroup {
  const groups = getProfileGroupsOfStructure(structure.id);
  return groups.filter((g) => g.filter === profileType)[0];
}

export function getBroadcastGroup(
  broadcastListName: string,
  school: Structure,
): BroadcastGroup {
  const headers = getHeaders();
  headers["content-type"] = "application/json";
  let res = http.get(
    `${rootUrl}/directory/group/admin/list?translate=false&structureId=${school.id}`,
    { headers },
  );
  return JSON.parse(<string>res.body).filter(
    (e: any) => e.subType === "BroadcastGroup" && e.name === broadcastListName,
  )[0];
}

export function getGroup(groupName: string, school: Structure): Group {
  const headers = getHeaders();
  headers["content-type"] = "application/json";
  let res = http.get(
    `${rootUrl}/directory/group/admin/list?translate=false&structureId=${school.id}`,
    { headers },
  );
  return JSON.parse(<string>res.body).filter(
    (e: any) => e.name === groupName,
  )[0];
}

/**
 * @param group Group to delete
 */

export function deleteGroupOrFail(group: Group) {
  let res = http.del(`${rootUrl}/directory/group/${group.id}`, null, {
    headers: getHeaders(),
  });
  if (res.status !== 204) {
    console.error(res);
    fail(`Cannot delete group`);
  }
}

/**
 *
 * @param groupId Id of the group whose users we want
 * @param session Session of the requester
 * @returns List of the users belonging to the specified group
 */
export function getUsersOfGroup(groupId: string): UserInfo[] {
  const headers = getHeaders();
  headers["content-type"] = "application/json";
  let res = http.get(
    `${rootUrl}/directory/user/admin/list?groupId=${groupId}`,
    { headers },
  );
  return JSON.parse(<string>res.body);
}

/**
 *
 * @param groupId Id of the group whose group related we want
 * @param relation type of relation to the group
 * @returns List of group profile that have a relation with the specified group
 */
export function getProfileGroupsRelatedToGroup(
  groupId: string,
  relation: GroupCommunicationRelation,
): ProfileGroup[] {
  const headers = getHeaders();
  headers["content-type"] = "application/json";
  let res = http.get(`${rootUrl}/communication/group/${groupId}/${relation}`, {
    headers,
  });
  return JSON.parse(<string>res.body);
}

/**
 * Reset all communication rules on a structure and apply default rules
 * @param school structure to reset
 */
export function resetRulesAndCheck(school: Structure): void {
  const headers = getHeaders();
  headers["content-type"] = "application/json";
  let res = http.post(
    `${rootUrl}/communication/rules/${school.id}/reset`,
    null,
    {
      headers,
    },
  );
  check(res, {
    "reset communication rules should be ok": (r) => r.status == 200,
  });
}
