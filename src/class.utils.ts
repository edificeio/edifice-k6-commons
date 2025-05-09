import http from "k6/http";
import { getHeaders } from "./user.utils";
import { fail } from "k6";
import { StructureClass } from "./models";
const rootUrl = __ENV.ROOT_URL;

export function createClass(structureId: string, className: string) {
  const res = http.post(
    `${rootUrl}/directory/class/${structureId}?setDefaultRoles=true`,
    JSON.stringify({
      name: className
    }),
    {
      headers: getHeaders(),
    },
  );
  return res;
}
export function createClassAndGetIdOrFail(structureId: string, className: string): string {
  const res = createClass(structureId, className);
    if (res.status !== 201) {
        console.error(
            `Error while creating class ${className} in structure ${structureId}`,
        );
        fail(`could not create class ${className} in structure ${structureId}`);
    }
  return JSON.parse(<string>res.body).id;
}

export function getClassesOfStructureOrFail(structureId: string): StructureClass[] {
  const res = http.get(`${rootUrl}/directory/class/admin/list?structureId=${structureId}`, {
    headers: getHeaders(),
  });
  if (res.status !== 200) {
    console.error(
      `Error while getting classes of structure ${structureId}`,
    );
    fail(`could not get classes of structure ${structureId}`);
  }
  return JSON.parse(<string>res.body);
}

export function assignClassToUser(classId: string, userId: string) {
  const res = http.put(
    `${rootUrl}/directory/class/${classId}/link/${userId}`,
    null,
    { headers: getHeaders() },
  );
  return res;
}
export function assignClassToUserOrFail(classId: string, userId: string) {
  const res = assignClassToUser(classId, userId);
  if (res.status !== 200) {
    console.error(
      `Error while assigning class ${classId} to user ${userId}`,
    );
    console.error(res);
    fail(`could not assign class ${classId} to user ${userId}`);
  }
}
