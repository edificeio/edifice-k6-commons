import http from "k6/http";
import {
  authenticateWeb,
  getHeaders,
  getRandomUser,
  getRandomUserWithProfile,
  switchSession,
} from "./user.utils";
import {
  ADML_FILTER,
  Role,
  Session,
  assertOk,
  getRolesOfStructure,
  getUsersOfGroup,
} from ".";
import { check, bytes, fail } from "k6";
//@ts-ignore
import { FormData } from "https://jslib.k6.io/formdata/0.0.2/index.js";
import {
  ProfileGroup,
  Structure,
  StructureFlavour,
  StructureInitData,
  UserInfo,
  UserPosition,
} from "./models";
//@ts-ignore
import { URL } from "https://jslib.k6.io/url/1.0.0/index.js";
import { getProfileGroupsOfStructure } from "./group.utils";

const rootUrl = __ENV.ROOT_URL;
const host = new URL(rootUrl).hostname;
const password = __ENV.DEFAULT_PASSWORD || "password";

export function getSchoolByName(name: string, session: Session): Structure {
  let ecoles = http.get(`${rootUrl}/directory/structure/admin/list`, {
    headers: getHeaders(session),
  });
  return JSON.parse(<string>ecoles.body).filter(
    (structure: Structure) => structure.name === name,
  )[0];
}

export function getUsersOfSchool(school: Structure, session: Session) {
  let res = http.get(`${rootUrl}/directory/structure/${school.id}/users`, {
    headers: getHeaders(session),
  });
  if (res.status !== 200) {
    throw `Impossible to get users of ${school.id}`;
  }
  return JSON.parse(<string>res.body);
}

export function activateUsers(structure: Structure, session: Session) {
  let res = http.get(`${rootUrl}/directory/structure/${structure.id}/users`, {
    headers: getHeaders(session),
  });
  if (res.status != 200) {
    fail(`Cannot fetch users of structure ${structure.id} : ${res}`);
  }
  const users = JSON.parse(<string>res.body);
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    activateUser(user);
  }
}

export function activateUser(user: any) {
  if (user.code) {
    const fd: any = {};
    fd["login"] = user.login;
    fd["activationCode"] = user.code;
    fd["password"] = password;
    fd["confirmPassword"] = password;
    fd["acceptCGU"] = "true";
    const res = http.post(`${rootUrl}/auth/activation`, fd, {
      redirects: 0,
      headers: { Host: host },
    });
    if (res.status !== 302) {
      console.error(res);
      fail(
        `Could not activate user ${user.login} : ${res.status} - ${res.body}`,
      );
    }
  }
}

export function linkRoleToUsers(
  structure: Structure,
  role: Role,
  groupNames: string[],
  session: Session,
) {
  const roles = getRolesOfStructure(structure.id, session);
  const teacherRoless = roles.filter(
    (role) => groupNames.indexOf(role.name) >= 0,
  );
  for (let teacherRoles of teacherRoless) {
    if (teacherRoles.roles.indexOf(role.name) >= 0) {
      console.log("Role already attributed to teachers");
    } else {
      const headers = getHeaders(session);
      headers["content-type"] = "application/json";
      const params = { headers };
      const payload = JSON.stringify({
        groupId: teacherRoles.id,
        roleIds: (teacherRoles.roles || []).concat([role.id]),
      });
      const res = http.post(
        `${rootUrl}/appregistry/authorize/group?schoolId=${structure.id}`,
        payload,
        params,
      );
      check(res, {
        "link role to structure": (r) => r.status == 200,
      });
    }
  }
}
/**
 * Creates a structure with no students, teachers or parents.
 * @param structureName Name of the structure
 * @param hasApp true if the structure can have the mobile app
 * @param session Session of the user doing the creation
 * @returns The created structure
 */
export function createEmptyStructure(
  structureName: string,
  hasApp: boolean,
  session: Session,
): Structure {
  let structure = getSchoolByName(structureName, session);
  if (structure) {
    console.log(`Structure ${structureName} already exists`);
  } else {
    const headers = getHeaders(session);
    headers["content-type"] = "application/json";
    const payload = JSON.stringify({
      hasApp,
      name: structureName,
    });
    let res = http.post(`${rootUrl}/directory/school`, payload, headers);
    if (res.status !== 201) {
      console.error(res.body);
      fail(`Could not create structure ${structureName}`);
    }
    structure = getSchoolByName(structureName, session);
  }
  return structure;
}

export function createEmptyStructureNoCheck(
  structureName: string,
  hasApp: boolean,
  session: Session,
): any {
  const headers = getHeaders(session);
  headers["content-type"] = "application/json";
  const payload = JSON.stringify({
    hasApp,
    name: structureName,
  });
  let res = http.post(`${rootUrl}/directory/school`, payload, headers);
  if (res.status !== 201) {
    console.error(res.body);
    fail(`Could not create structure ${structureName}`);
  }
  return res;
}

/**
 * Create a structure with a default set of teachers, parents and students
 * and activate the users.
 * @param structureName Name of the structure to create
 * @returns The created structure
 */
export function initStructure(
  structureName: string,
  flavour: StructureFlavour = "default",
) {
  const session = authenticateWeb(__ENV.ADMC_LOGIN, __ENV.ADMC_PASSWORD)!;
  const structure: Structure = createDefaultStructure(structureName, flavour);
  activateUsers(structure, session);
  return structure;
}

export function createDefaultStructure(
  structureName: string,
  flavour: StructureFlavour = "default",
) {
  const name = structureName || "General";
  const session = authenticateWeb(__ENV.ADMC_LOGIN, __ENV.ADMC_PASSWORD);
  const baseUrl = `https://raw.githubusercontent.com/edificeio/edifice-k6-commons/develop/data/structure`;
  const teachersData: bytes = <bytes>(
    http.get(`${baseUrl}/enseignants.${flavour}.csv`).body
  );
  const studentsData: bytes = <bytes>(
    http.get(`${baseUrl}/eleves.${flavour}.csv`).body
  );
  const responsablesData: bytes = <bytes>(
    http.get(`${baseUrl}/responsables.${flavour}.csv`).body
  );
  return createStructure(
    name,
    {
      teachers: teachersData,
      students: studentsData,
      responsables: responsablesData,
    },
    <Session>session,
  );
}

export function createStructure(
  schoolName: string,
  users: bytes | StructureInitData,
  session: Session,
) {
  let ecoleAudience = getSchoolByName(schoolName, session);
  if (ecoleAudience) {
    console.log("School already exists");
  } else {
    const fd = new FormData();
    fd.append("type", "CSV");
    fd.append("structureName", schoolName);
    //@ts-ignore
    let teachers: bytes;
    let students: bytes | undefined;
    let responsables: bytes | undefined;
    if ("teachers" in users) {
      teachers = (<StructureInitData>users).teachers;
      students = (<StructureInitData>users).students;
      responsables = (<StructureInitData>users).responsables;
    } else {
      teachers = <bytes>users;
    }
    fd.append("Teacher", http.file(teachers, "enseignants.csv"));
    if (students) {
      fd.append("Student", http.file(students, "eleves.csv"));
    }
    if (responsables) {
      fd.append("Relative", http.file(responsables, "responsables.csv"));
    }
    const headers = getHeaders(session);
    //@ts-ignore
    headers["Content-Type"] = "multipart/form-data; boundary=" + fd.boundary;
    const params = { headers };
    //@ts-ignore
    const res = http.post(
      `${rootUrl}/directory/wizard/import`,
      fd.body(),
      params,
    );
    if (res.status != 200) {
      fail(`Could not create structure ${schoolName}`);
    }
    ecoleAudience = getSchoolByName(schoolName, session);
  }
  return ecoleAudience;
}

export function attachStructureAsChild(
  parentStructure: Structure,
  childStructure: Structure,
  session: Session,
): boolean {
  let added: boolean;
  const parentIds = (childStructure.parents || []).map((p) => p.id);
  if (parentIds.indexOf(parentStructure.id) >= 0) {
    console.log(
      `${childStructure.name} is already a child of ${parentStructure.name}`,
    );
    added = false;
  } else {
    const headers = getHeaders(session);
    headers["content-type"] = "application/json";
    let res = http.put(
      `${rootUrl}/directory/structure/${childStructure.id}/parent/${parentStructure.id}`,
      "{}",
    );
    if (res.status !== 200) {
      fail(
        `Could not attach structure ${childStructure.name} as a child of ${parentStructure.name}`,
      );
    }
    added = true;
  }
  return added;
}

export function importUsers(
  structure: Structure,
  users: bytes | StructureInitData,
  session: Session,
) {
  const fd = new FormData();
  fd.append("type", "CSV");
  fd.append("structureName", structure.name);
  fd.append("structureId", structure.id);
  fd.append("structureExternalId", structure.externalId);
  //@ts-ignore
  let teachers: bytes;
  let students: bytes | undefined;
  let responsables: bytes | undefined;
  if ("teachers" in users) {
    teachers = (<StructureInitData>users).teachers;
    students = (<StructureInitData>users).students;
    responsables = (<StructureInitData>users).responsables;
  } else {
    teachers = <bytes>users;
  }
  fd.append("Teacher", http.file(teachers, "enseignants.csv"));
  if (students) {
    fd.append("Student", http.file(students, "eleves.csv"));
  }
  if (responsables) {
    fd.append("Relative", http.file(responsables, "responsables.csv"));
  }
  const headers = getHeaders(session);
  //@ts-ignore
  headers["Content-Type"] = "multipart/form-data; boundary=" + fd.boundary;
  const params = { headers };
  //@ts-ignore
  const res = http.post(
    `${rootUrl}/directory/wizard/import`,
    fd.body(),
    params,
  );
  return res;
}

export function triggerImport(session: Session) {
  const headers = getHeaders(session);
  headers["content-type"] = "application/json";
  return http.post(`${rootUrl}/directory/import`, "{}", { headers });
}

export function createPosition(
  positionName: string,
  structure: Structure,
  session?: Session,
) {
  const headers = getHeaders(session);
  headers["content-type"] = "application/json";
  const payload = JSON.stringify({
    name: positionName,
    structureId: structure.id,
  });
  let res = http.post(`${rootUrl}/directory/positions`, payload, {
    redirects: 0,
    headers,
  });
  return res;
}

export function updatePosition(position: UserPosition, session?: Session) {
  const headers = getHeaders(session);
  headers["content-type"] = "application/json";
  const payload = JSON.stringify(position);
  let res = http.put(`${rootUrl}/directory/positions/${position.id}`, payload, {
    redirects: 0,
    headers,
  });
  return res;
}
export function getOrCreatePosition(
  positionName: string,
  structure: Structure,
  session?: Session,
): UserPosition {
  let res = createPosition(positionName, structure, session);
  if (res.status === 409) {
    const existingPositionId: string = JSON.parse(
      <string>res.body,
    ).existingPositionId;
    return getPositionByIdOrFail(existingPositionId, session);
  } else {
    return JSON.parse(<string>res.body);
  }
}

export function attributePositions(
  user: { id: string },
  positions: UserPosition[],
  session?: Session,
) {
  const headers = getHeaders(session);
  headers["content-type"] = "application/json";
  const payload: { positionIds?: string[] } = {};
  if (positions !== null && positions !== undefined) {
    payload.positionIds = positions.map((p) => p.id);
  }
  let res = http.put(
    `${rootUrl}/directory/user/${user.id}`,
    JSON.stringify(payload),
    {
      headers,
    },
  );
  return res;
}

export function deletePosition(positionId: string, session?: Session) {
  const headers = getHeaders(session);
  headers["content-type"] = "application/json";
  let res = http.del(`${rootUrl}/directory/positions/${positionId}`, null, {
    redirects: 0,
    headers,
  });
  return res;
}

export function getPositionByIdOrFail(
  positionId: string,
  session?: Session,
): UserPosition {
  let position = http.get(`${rootUrl}/directory/positions/${positionId}`, {
    headers: getHeaders(session),
  });
  return JSON.parse(<string>position.body);
}

export function createPositionOrFail(
  positionName: string,
  structure: Structure,
  session: Session,
): UserPosition {
  const res = createPosition(positionName, structure, session);
  if (res.status !== 201) {
    console.error(res);
    fail(
      `Could not create position ${positionName} on structure ${structure.name}`,
    );
  }
  return JSON.parse(<string>res.body);
}

export function searchPositions(content: string, session: Session) {
  const headers = getHeaders(session);
  const url = new URL(`${rootUrl}/directory/positions`);
  url.searchParams.append("content", content);
  return http.get(url.toString(), { headers });
}

export function getPositionsOfStructure(
  structure: Structure,
  session: Session,
) {
  const headers = getHeaders(session);
  const res = http.get(
    `${rootUrl}/directory/positions?structureId=${structure.id}`,
    { headers },
  );
  return JSON.parse(<string>res.body);
}

export function makeAdml(user: any, structure: Structure, session: Session) {
  const headers = getHeaders(session);
  headers["content-type"] = "application/json";
  const payload = JSON.stringify({
    functionCode: "ADMIN_LOCAL",
    inherit: "s",
    scope: [structure.id],
  });
  let res = http.post(
    `${rootUrl}/directory/user/function/${user.id}`,
    payload,
    { headers },
  );
  assertOk(res, "user should be made ADML");
  return res;
}

/**
 * Search nbAdmls ADML of the structure. If less than nbAdmls ADML are
 * found, the remainder is created from existing users of the structure
 * who have the specified profile (if one is specified, otherwise we just
 * use any users).
 * @param structure Structure to attach the ADML to
 * @param profile Profile of the users that should be ADML or undefined if every profile types is ok
 * @param nbAdmls The number of ADML we want
 * @param excludedUsers List of users that should not be in the list of ADMLsreturned by this function
 * @param session Session of the requester
 * @returns A list o nbAdmls users of the structure
 */
export function getAdmlsOrMakThem(
  structure: Structure,
  profile: string,
  nbAdmls: number,
  excludedUsers: { id: string }[],
  session: Session,
) {
  const profileGroups: ProfileGroup[] = getProfileGroupsOfStructure(
    structure.id,
    session,
  );
  const admlGroup: ProfileGroup = profileGroups.filter(
    (pg) => pg.filter === ADML_FILTER,
  )[0];
  let admlUsers: UserInfo[];
  if (admlGroup) {
    const existingAdmlUsers: UserInfo[] = getUsersOfGroup(
      admlGroup.id,
      session,
    );
    admlUsers = profile
      ? existingAdmlUsers.filter((u) => u.type === profile)
      : existingAdmlUsers;
  } else {
    admlUsers = [];
  }
  if (excludedUsers && excludedUsers.length > 0) {
    const excludedIds = excludedUsers.map((u) => u.id);
    admlUsers = admlUsers.filter((u) => excludedIds.indexOf(u.id) < 0);
  }
  if (admlUsers.length < nbAdmls) {
    const usersOfStructure = getUsersOfSchool(structure, session);
    for (let i = admlUsers.length; i < nbAdmls; i++) {
      let userToMake: UserInfo;
      if (profile) {
        userToMake = <UserInfo>(
          getRandomUserWithProfile(usersOfStructure, profile, admlUsers)
        );
      } else {
        userToMake = <UserInfo>getRandomUser(usersOfStructure, admlUsers);
      }
      console.log(
        `Turning ${userToMake.login} into an ADML of ${structure.id} - ${structure.name}`,
      );
      makeAdml(userToMake, structure, session);
      admlUsers.push(userToMake);
    }
  }
  return admlUsers.slice(0, nbAdmls);
}

export function attachUserToStructures(
  user: UserInfo,
  structures: Structure | Structure[],
  session?: Session,
) {
  try {
    const _session = authenticateWeb(__ENV.ADMC_LOGIN, __ENV.ADMC_PASSWORD)!;
    const _structures = Array.isArray(structures) ? structures : [structures];
    for (let structure of _structures) {
      http.put(
        `${rootUrl}/directory/structure/${structure.id}/link/${user.id}`,
        null,
        { headers: getHeaders(_session) },
      );
    }
  } finally {
    switchSession(session);
  }
}
