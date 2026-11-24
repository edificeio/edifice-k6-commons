import http, { RefinedResponse } from "k6/http";
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
  assertOk,
  getRolesOfStructure,
  getStructureProfileGroups,
  getUsersOfGroup,
  profileOfGroupName,
} from ".";
import { check, bytes, fail, sleep } from "k6";
//@ts-ignore
import { FormData } from "https://jslib.k6.io/formdata/0.0.2/index.js";
import {
  AAFFilesUploadRequest,
  ProfileGroup,
  Structure,
  StructureFlavour,
  StructureImportParameters,
  StructureInitData,
  UserInfo,
  UserPosition,
  UserProfileType,
} from "./models";
//@ts-ignore
import { URL } from "https://jslib.k6.io/url/1.0.0/index.js";
import { getProfileGroupsOfStructure } from "./group.utils";
import sessionHolder from "./session.utils";

const rootUrl = __ENV.ROOT_URL;
const host = new URL(rootUrl).hostname;
const password = __ENV.DEFAULT_PASSWORD || "password";
/** Seconds to wait after asking for the refresh of the logins, so that every feeder instance has done it. */
const delayWaitReinitLogin = parseFloat(__ENV.DELAY_WAIT_REINIT_LOGIN || "1");
/** Number of attempts to import a structure (an import can fail if the logins cache of the feeder is not up to date). */
const maxStructureImportAttempts = Math.max(
  1,
  parseInt(__ENV.STRUCTURE_IMPORT_ATTEMPTS || "3"),
);

/**
 * Asks every feeder instance to reload the logins of the platform, then waits DELAY_WAIT_REINIT_LOGIN seconds (1 by
 * default). Each instance generates the logins of the imported users from its own cache : without this refresh, an
 * instance which did not see the users created by another one gives an existing login, and the import fails.
 * The refresh is broadcast without any acknowledgement, hence the wait.
 */
export function reinitLogins() {
  const res = http.post(`${rootUrl}/directory/reinitLogins`, null, {
    headers: getHeaders(),
  });
  if (!check(res, { "reinit logins should be ok": (r) => r.status === 200 })) {
    console.error(
      `Reinit logins : ${res.status} ${res.error || ""} ${res.body}`,
    );
  }
  if (delayWaitReinitLogin > 0) {
    sleep(delayWaitReinitLogin);
  }
}

export function getAllStructures(): Structure[] {
  let ecoles = http.get(`${rootUrl}/directory/structure/admin/list`, {
    headers: getHeaders(),
  });
  return JSON.parse(<string>ecoles.body) as Structure[];
}

export function getSchoolByName(name: string): Structure {
  let ecoles = http.get(`${rootUrl}/directory/structure/admin/list`, {
    headers: getHeaders(),
  });
  return JSON.parse(<string>ecoles.body).filter(
    (structure: Structure) => structure.name === name,
  )[0];
}

export function getUsersOfSchool(school: Structure): UserInfo[] {
  let res = http.get(`${rootUrl}/directory/structure/${school.id}/users`, {
    headers: getHeaders(),
  });
  if (res.status !== 200) {
    throw `Impossible to get users of ${school.id}`;
  }
  return JSON.parse(<string>res.body);
}

export function activateUsers(structure: Structure) {
  let res = http.get(`${rootUrl}/directory/structure/${structure.id}/users`, {
    headers: getHeaders(),
  });
  if (res.status != 200) {
    fail(`Cannot fetch users of structure ${structure.id} : ${res}`);
  }
  const users = JSON.parse(<string>res.body);
  const chunkSize = parseInt(__ENV.ACTIVATE_USERS_CHUNK_SIZE || "20");
  const usersToActivate = users.filter((user: any) => user.code);
  const oldSession = sessionHolder.session;
  try {
    for (let i = 0; i < usersToActivate.length; i += chunkSize) {
      const chunk = usersToActivate.slice(i, i + chunkSize);
      const batch = chunk.map((user: any) => {
        const fd: any = {};
        fd["login"] = user.login;
        fd["activationCode"] = user.code;
        fd["password"] = password;
        fd["confirmPassword"] = password;
        fd["acceptCGU"] = "true";
        return [
          "POST",
          `${rootUrl}/auth/activation`,
          fd,
          { redirects: 0, headers: { Host: host } },
        ];
      });
      const responses = http.batch(batch) as unknown as {
        status: number;
        body: string;
      }[];
      for (let j = 0; j < responses.length; j++) {
        if (responses[j].status !== 302) {
          fail(
            `Could not activate user ${chunk[j].login} : ${responses[j].status} - ${responses[j].body}`,
          );
        }
      }
    }
  } finally {
    switchSession(oldSession);
  }
}

export function activateUser(user: any) {
  if (user.code) {
    const oldSession = sessionHolder.session;
    try {
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
    } finally {
      switchSession(oldSession);
    }
  }
}

export function linkRoleToUsers(
  structure: Structure,
  role: Role,
  groupNames: string[],
) {
  const roles = getRolesOfStructure(structure.id);
  // The names the tests give ("Teachers from group X.") are not the ones every platform uses ("X group teachers."):
  // a name which designates a profile of this structure designates its profile group whatever its wording.
  const profiles = groupNames
    .filter((name) => name.indexOf(structure.name) >= 0)
    .map(profileOfGroupName)
    .filter((profile) => !!profile);
  const profileGroupIds =
    profiles.length > 0
      ? getStructureProfileGroups(structure.id)
          .filter((g) => profiles.indexOf(g.filter) >= 0)
          .map((g) => g.id)
      : [];
  const teacherRoless = roles.filter(
    (role) =>
      groupNames.indexOf(role.name) >= 0 ||
      profileGroupIds.indexOf(role.id) >= 0,
  );
  for (let teacherRoles of teacherRoless) {
    if (teacherRoles.roles.indexOf(role.name) >= 0) {
      console.log("Role already attributed to teachers");
    } else {
      const headers = getHeaders();
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
): Structure {
  let structure = getSchoolByName(structureName);
  if (structure) {
    console.log(`Structure ${structureName} already exists`);
  } else {
    const headers = getHeaders("application/json");
    const payload = JSON.stringify({
      hasApp,
      name: structureName,
    });
    let res = http.post(`${rootUrl}/directory/school`, payload, { headers });
    if (res.status !== 201) {
      console.error(res.body);
      fail(`Could not create structure ${structureName}`);
    }
    structure = getSchoolByName(structureName);
  }
  return structure;
}

export function createEmptyStructureNoCheck(
  structureName: string,
  hasApp: boolean,
): any {
  const headers = getHeaders();
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
  authenticateWeb(__ENV.ADMC_LOGIN, __ENV.ADMC_PASSWORD)!;
  const structure: Structure = createDefaultStructure(structureName, flavour);
  if (__ENV.SKIP_USERS_ACTIVATION !== "true") {
    activateUsers(structure);
  }
  return structure;
}
/**
 * Creates a structure with teachers, students and relatives in it.
 * @param structureName Name of the structure to create (leave blank to use the default name)
 * @param flavour The type of structure to create (the main/only difference being the number of users in it)
 * @returns the created structure
 */

export function createDefaultStructure(
  structureName: string,
  flavour: StructureFlavour = "default",
): Structure {
  const name = structureName || "General";
  authenticateWeb(__ENV.ADMC_LOGIN, __ENV.ADMC_PASSWORD);
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
  return createStructure(name, {
    teachers: teachersData,
    students: studentsData,
    responsables: responsablesData,
  });
}

export function createStructure(
  schoolName: string,
  users: bytes | StructureInitData,
): Structure {
  let ecoleAudience = getSchoolByName(schoolName);
  if (ecoleAudience) {
    console.log("School already exists");
    return ecoleAudience;
  }
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
  for (let attempt = 1; attempt <= maxStructureImportAttempts; attempt++) {
    reinitLogins();
    if (attempt > 1) {
      // Extra wait so that the (asynchronous) reload of the logins has time to complete on every feeder
      sleep(delayWaitReinitLogin * Math.pow(2, attempt - 1));
    }
    const res = importStructureFiles(schoolName, teachers, students, responsables);
    if (res.status === 200) {
      ecoleAudience = getSchoolByName(schoolName);
      if (!ecoleAudience) {
        fail(
          `Structure ${schoolName} has been imported but is not in the structures list`,
        );
      }
      return ecoleAudience;
    }
    console.error(
      `Structure ${schoolName} (attempt ${attempt}/${maxStructureImportAttempts}) : ${res.status} ${res.error || ""} ${res.body}`,
    );
    // The import runs in a single Neo4j transaction so a failure should leave nothing behind. Check it anyway
    // so that we never silently return a structure with an incomplete set of users.
    ecoleAudience = getSchoolByName(schoolName);
    if (ecoleAudience) {
      const expected = countCsvRows(teachers) + countCsvRows(students);
      const actual = getUsersOfSchool(ecoleAudience).length;
      if (actual < expected) {
        fail(
          `Structure ${schoolName} exists after a failed import but only has ${actual} users (at least ${expected} expected)`,
        );
      }
      return ecoleAudience;
    }
  }
  fail(`Could not create structure ${schoolName}`);
}

/**
 * Sends the CSV files to the import wizard.
 */
function importStructureFiles(
  schoolName: string,
  teachers: bytes,
  students: bytes | undefined,
  responsables: bytes | undefined,
): RefinedResponse<any> {
  const fd = new FormData();
  fd.append("type", "CSV");
  fd.append("structureName", schoolName);
  fd.append("Teacher", http.file(teachers, "enseignants.csv"));
  if (students) {
    fd.append("Student", http.file(students, "eleves.csv"));
  }
  if (responsables) {
    fd.append("Relative", http.file(responsables, "responsables.csv"));
  }
  const headers = getHeaders();
  //@ts-ignore
  headers["Content-Type"] = "multipart/form-data; boundary=" + fd.boundary;
  return http.post(`${rootUrl}/directory/wizard/import`, fd.body(), {
    headers,
  });
}

/**
 * @returns the number of data rows (header excluded) of a CSV file
 */
function countCsvRows(data: bytes | undefined): number {
  if (!data) {
    return 0;
  }
  const content =
    typeof data === "string"
      ? data
      : String.fromCharCode(...new Uint8Array(<any>data));
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  return Math.max(0, lines.length - 1);
}

export function attachStructureAsChild(
  parentStructure: Structure,
  childStructure: Structure,
  nbRetry: number = 0,
): boolean {
  let added: boolean;
  const parentIds = (childStructure.parents || []).map((p) => p.id);
  if (parentIds.indexOf(parentStructure.id) >= 0) {
    console.log(
      `${childStructure.name} is already a child of ${parentStructure.name}`,
    );
    added = false;
  } else {
    let res = http.put(
      `${rootUrl}/directory/structure/${childStructure.id}/parent/${parentStructure.id}`,
      "{}",
      { headers: getHeaders("application/json") },
    );
    if (res.status !== 200) {
      if (nbRetry > 0) {
        console.log(
          "Retrying to attach structure as a child because we got ",
          res.status,
          res.body,
        );
        attachStructureAsChild(parentStructure, childStructure, nbRetry - 1);
      } else {
        fail(
          `Could not attach structure ${childStructure.name} as a child of ${parentStructure.name}`,
        );
      }
    }
    added = true;
  }
  return added;
}

export function importUsers(
  structure: Structure,
  users: bytes | StructureInitData,
) {
  reinitLogins();
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
  const headers = getHeaders();
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

export function triggerImport() {
  const headers = getHeaders();
  headers["content-type"] = "application/json";
  return http.post(`${rootUrl}/directory/import`, "{}", { headers });
}

export function createPosition(positionName: string, structure: Structure) {
  const headers = getHeaders();
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

export function updatePosition(position: UserPosition) {
  const headers = getHeaders();
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
): UserPosition {
  let res = createPosition(positionName, structure);
  if (res.status === 409) {
    const existingPositionId: string = JSON.parse(
      <string>res.body,
    ).existingPositionId;
    return getPositionByIdOrFail(existingPositionId);
  } else {
    return JSON.parse(<string>res.body);
  }
}

export function attributePositions(
  user: { id: string },
  positions: UserPosition[],
) {
  const headers = getHeaders();
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

export function deletePosition(positionId: string) {
  const headers = getHeaders();
  headers["content-type"] = "application/json";
  let res = http.del(`${rootUrl}/directory/positions/${positionId}`, null, {
    redirects: 0,
    headers,
  });
  return res;
}

export function getPositionByIdOrFail(positionId: string): UserPosition {
  let position = http.get(`${rootUrl}/directory/positions/${positionId}`, {
    headers: getHeaders(),
  });
  return JSON.parse(<string>position.body);
}

export function createPositionOrFail(
  positionName: string,
  structure: Structure,
): UserPosition {
  const res = createPosition(positionName, structure);
  if (res.status !== 201) {
    console.error(res);
    fail(
      `Could not create position ${positionName} on structure ${structure.name}`,
    );
  }
  return JSON.parse(<string>res.body);
}

export function searchPositions(content: string) {
  const headers = getHeaders();
  const url = new URL(`${rootUrl}/directory/positions`);
  url.searchParams.append("content", content);
  return http.get(url.toString(), { headers });
}

export function getPositionsOfStructure(structure: Structure): UserPosition[] {
  const headers = getHeaders();
  const res = http.get(
    `${rootUrl}/directory/positions?structureId=${structure.id}`,
    { headers },
  );
  return JSON.parse(<string>res.body);
}

export function makeAdml(user: any, structure: Structure) {
  const headers = getHeaders();
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

export function makeAdmlOfStructures(user: any, structureIds: string[]) {
  const headers = getHeaders();
  headers["content-type"] = "application/json";
  const payload = JSON.stringify({
    functionCode: "ADMIN_LOCAL",
    inherit: "s",
    scope: structureIds,
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
  profile: UserProfileType,
  nbAdmls: number,
  excludedUsers: { id: string }[],
) {
  const profileGroups: ProfileGroup[] = getProfileGroupsOfStructure(
    structure.id,
  );
  const admlGroup: ProfileGroup = profileGroups.filter(
    (pg) => pg.filter === ADML_FILTER,
  )[0];
  let admlUsers: UserInfo[];
  if (admlGroup) {
    const existingAdmlUsers: UserInfo[] = getUsersOfGroup(admlGroup.id);
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
    const usersOfStructure = getUsersOfSchool(structure);
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
      makeAdml(userToMake, structure);
      admlUsers.push(userToMake);
    }
  }
  return admlUsers.slice(0, nbAdmls);
}

export function makeEverybodyAdml(
  fromStructure: Structure,
  structureIds: string[],
) {
  const usersOfStructure = getUsersOfSchool(fromStructure);
  console.log(`ADMLization of ${usersOfStructure.length} users...`);
  let i = 0;
  for (let userToMake of usersOfStructure) {
    makeAdmlOfStructures(userToMake, structureIds);
    i++;
    console.log(`${i} users adml-ized`);
  }
  console.log(`....ADMLization of ${usersOfStructure.length} users done`);
}

export function attachUserToStructures(
  user: UserInfo,
  structures: Structure | Structure[],
) {
  const oldSession = sessionHolder.session;
  try {
    const userStructures = new Set(user.structures.map((s) => s.id));
    authenticateWeb(__ENV.ADMC_LOGIN, __ENV.ADMC_PASSWORD)!;
    const _structures = Array.isArray(structures) ? structures : [structures];
    for (let structure of _structures) {
      if (!userStructures.has(structure.id)) {
        http.put(
          `${rootUrl}/directory/structure/${structure.id}/link/${user.id}`,
          null,
          { headers: getHeaders() },
        );
      }
    }
  } finally {
    switchSession(oldSession);
  }
}

export function importCSVToStructure(
  structure: Structure,
  users: bytes | StructureInitData,
  importParameters: StructureImportParameters,
) {
  reinitLogins();
  const fd = new FormData();
  fd.append("type", "CSV");
  fd.append("structureName", structure.name);
  fd.append("structureId", structure.id);
  fd.append("structureExternalId", structure.externalId);
  fd.append("valid", "true");
  if (importParameters.predelete !== undefined) {
    fd.append("predelete", String(importParameters.predelete));
  }
  if (importParameters.transition !== undefined) {
    fd.append("transition", String(importParameters.transition));
  }
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
  const headers = getHeaders();
  //@ts-ignore
  headers["Content-Type"] = "multipart/form-data; boundary=" + fd.boundary;
  const params = { headers };
  //@ts-ignore
  return http.post(`${rootUrl}/directory/wizard/import`, fd.body(), params);
}

export function applyCommRules(structures: Structure[]) {
  const headers = getHeaders();
  headers["content-type"] = "application/json";
  console.log("initializing communication rules...");
  let res = http.put(
    `${rootUrl}/communication/init/rules`,
    JSON.stringify({ structures: structures.map((s) => s.id) }),
    { headers },
  );
  if (res.status === 200) {
    console.log(`Initializing ${structures.length} structures....`);
    let i = 0;
    for (let structure of structures) {
      let res = http.put(
        `${rootUrl}/communication/rules/${structure.id}`,
        JSON.stringify({ structures: structures.map((s) => s.id) }),
        { headers },
      );
      if (res.status !== 200) {
        console.log(
          `... initialization failed for structure ${structure.id} - ${structure.name}`,
        );
      }
      i++;
      if (i % 20 === 0) {
        console.log(`${i} structures initialized...`);
      }
    }
  } else {
    console.log("... initialization failed");
  }
}

export function importAAFStructure(
  files: Record<string, string>,
): RefinedResponse<any> {
  const request: AAFFilesUploadRequest = {
    subPath: "test",
    files: files,
  };
  const headers = getHeaders("application/json");
  const res = http.post(
    `${rootUrl}/directory/api/internal/upload-aaf`,
    JSON.stringify(request),
    { headers },
  );
  return res;
}

export function importAAFStructureOrFail(files: Record<string, string>) {
  const res = importAAFStructure(files);
  assertOk(res, "AAF structure should be imported");
}
