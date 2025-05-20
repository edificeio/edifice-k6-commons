import { fail } from "k6";
import {
  assignClassToUserOrFail,
  createClassAndGetIdOrFail,
} from "./class.utils.js";
import { LoadStructure, LoadUser } from "./load.model";
import { Structure, UserInfo } from "./models.js";
import {
  activateUsers,
  attachStructureAsChild,
  createEmptyStructure,
  makeAdml,
} from "./structure.utils.js";
import { authenticateWeb, createUserAndGetData } from "./user.utils.js";

export function loadENTReferential(structures: LoadStructure[]) {
  authenticateWeb(__ENV.ADMC_LOGIN, __ENV.ADMC_PASSWORD);
  const nbStructs = structures.length;
  const structByName = new Map();
  let i = 0;
  for (const structure of structures) {
    const structureModel: Structure = createEmptyStructure(
      structure.name,
      true,
    );
    structByName.set(structureModel.name, structureModel);
    const classes = new Set<string>();
    const userModelBySpecId: Map<number, UserInfo> = new Map();
    for (let user of structure.users) {
      const userModel = createUserAndGetData({
        firstName: user.firstName,
        lastName: user.lastName,
        type: user.profile,
        structureId: structureModel.id,
        birthDate: user.birthDate || "2010-01-01",
        positionIds: [],
      });
      userModelBySpecId.set(user.id, userModel);
      if (user.adml) {
        makeAdml(userModel, structureModel);
      }
      if (user.class) {
        for (let className of user.class) {
          classes.add(className);
        }
      }
    }
    activateUsers(structureModel);
    createClasses(structureModel, classes, userModelBySpecId, structure.users);
    i++;
    if (i % 50 === 0) {
      console.log(
        "Created ",
        i,
        " structures out of ",
        nbStructs,
        " - progress : ",
        Math.floor((i * 100) / nbStructs),
        "%",
      );
    }
  }
  console.log("Creating structure tree");
  for (const structure of structures) {
    const child = structByName.get(structure.name);
    const parentNames = structure.parents || [];
    for (let parentName of parentNames) {
      attachStructureAsChild(structByName.get(parentName), child);
    }
  }
}

function createClasses(
  structureModel: Structure,
  classes: Set<string>,
  userModelBySpecId: Map<number, UserInfo>,
  users: LoadUser[],
) {
  const classByName: Map<string, string> = new Map();
  classes.forEach((className) => {
    const id = createClassAndGetIdOrFail(structureModel.id, className);
    classByName.set(className, id);
  });
  for (let user of users) {
    if (user.class) {
      for (let className of user.class) {
        const classId = classByName.get(className);
        if (!classId) {
          fail(
            "Class " +
              className +
              " not found for user " +
              user.firstName +
              " " +
              user.lastName,
          );
        }
        const userModel = userModelBySpecId.get(user.id);
        if (!userModel) {
          throw new Error(
            "User " + user.firstName + " " + user.lastName + " not found",
          );
        }
        assignClassToUserOrFail(classId, userModel.id);
      }
    }
  }
}
