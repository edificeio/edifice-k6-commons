import http from "k6/http";
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
