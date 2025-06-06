import http from "k6/http";
import { check } from "k6";
import { getHeaders } from "./user.utils";

const rootUrl = __ENV.ROOT_URL;

export type Role = {
  name: string;
  id: string;
};
export type RoleOfStructure = {
  name: string;
  id: string;
  groupDisplayName: string;
  roles: string[];
};

export function getRoleByName(name: string): Role {
  let roles = http.get(`${rootUrl}/appregistry/roles`, {
    headers: getHeaders(),
  });
  const result = JSON.parse(<string>roles.body);
  return result.filter((role: { name: string }) => role.name === name)[0];
}
/**
 *
 * @param applicationName Name of the application for which to create a role
 * @param session Session of the user creating the role
 * @returns Created role
 */
export function createAndSetRole(applicationName: string): Role {
  const roleName = `${applicationName} - All - Stress Test`;
  let role = getRoleByName(roleName);
  if (role) {
    console.log(`Role ${roleName} already existed`);
  } else {
    let res = http.get(
      `${rootUrl}/appregistry/applications/actions?actionType=WORKFLOW`,
      { headers: getHeaders() },
    );
    check(res, { "get workflow actions": (r) => r.status == 200 });
    const application = JSON.parse(<string>res.body).filter(
      (entry: { name: string }) => entry.name === applicationName,
    )[0];
    const actions = application.actions.map((entries: any) => entries[0]);
    const headers = getHeaders();
    headers["content-type"] = "application/json";
    const payload = {
      role: roleName,
      actions,
    };
    res = http.post(`${rootUrl}/appregistry/role`, JSON.stringify(payload), {
      headers,
    });
    console.log(res);
    check(res, { "save role ok": (r) => r.status == 201 });
    role = getRoleByName(roleName);
  }
  return role;
}

export function getRolesOfStructure(structureId: string): RoleOfStructure[] {
  const headers = getHeaders();
  headers["Accept-Language"] = "en";
  let res = http.get(
    `${rootUrl}/appregistry/groups/roles?structureId=${structureId}&translate=false`,
    { headers },
  );
  check(res, {
    "get structure roles should be ok": (r) => r.status == 200,
  });
  return JSON.parse(<string>res.body);
}
