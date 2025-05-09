import { LoadStructure } from "./load.model";
import { Structure } from "./models.js";
import { activateUsers, attachStructureAsChild, createEmptyStructure, makeAdml } from "./structure.utils.js";
import { authenticateWeb, createUser } from "./user.utils.js";
  
export function loadENTReferential(structures: LoadStructure[]) { 
    authenticateWeb(__ENV.ADMC_LOGIN, __ENV.ADMC_PASSWORD);
    const nbStructs = structures.length;
    const structByName = new Map();
    let i = 0;
    for(const structure of structures) {
        const structureModel: Structure = createEmptyStructure(structure.name, true)
        structByName.set(structureModel.name, structureModel);
        for(let user of structure.users) {
            const userModel = createUser({
                firstName: user.firstName,
                lastName: user.lastName,
                type: user.profile,
                structureId: structureModel.id,
                birthDate: user.birthDate || "01/01/2010",
                positionIds: []
            });
            if(user.adml) {
                makeAdml(userModel, structureModel)
            }
        }
        activateUsers(structureModel);
        i++;
        if(i % 50 === 0) {
            console.log("Created ", i, " structures out of ", nbStructs, " - progress : ", Math.floor((i * 100) / nbStructs), "%")
        }
    }
    console.log("Creating structure tree")
    for(const structure of structures) {
        const child = structByName.get(structure.name)
        const parentNames = structure.parents || [];
        for(let parentName of parentNames) {
            attachStructureAsChild(structByName.get(parentName), child)
        }
    }
}