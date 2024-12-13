import { Role, Session } from '.';
import { bytes } from 'k6';
import { Structure, StructureFlavour, StructureImportParameters, StructureInitData, UserInfo, UserPosition } from './models';
export declare function getSchoolByName(name: string, session: Session): Structure;
export declare function getUsersOfSchool(school: Structure, session: Session): any;
export declare function activateUsers(structure: Structure, session: Session): void;
export declare function activateUser(user: any): void;
export declare function linkRoleToUsers(structure: Structure, role: Role, groupNames: string[], session: Session): void;
/**
 * Creates a structure with no students, teachers or parents.
 * @param structureName Name of the structure
 * @param hasApp true if the structure can have the mobile app
 * @param session Session of the user doing the creation
 * @returns The created structure
 */
export declare function createEmptyStructure(structureName: string, hasApp: boolean, session: Session): Structure;
export declare function createEmptyStructureNoCheck(structureName: string, hasApp: boolean, session: Session): any;
/**
 * Create a structure with a default set of teachers, parents and students
 * and activate the users.
 * @param structureName Name of the structure to create
 * @returns The created structure
 */
export declare function initStructure(structureName: string, flavour?: StructureFlavour): Structure;
export declare function createDefaultStructure(structureName: string, flavour?: StructureFlavour): Structure;
export declare function createStructure(schoolName: string, users: bytes | StructureInitData, session: Session): Structure;
export declare function attachStructureAsChild(parentStructure: Structure, childStructure: Structure, session: Session, nbRetry?: number): boolean;
export declare function importUsers(structure: Structure, users: bytes | StructureInitData, session: Session): import('k6/http').RefinedResponse<import('k6/http').ResponseType | undefined>;
export declare function triggerImport(session: Session): import('k6/http').RefinedResponse<import('k6/http').ResponseType | undefined>;
export declare function createPosition(positionName: string, structure: Structure, session?: Session): import('k6/http').RefinedResponse<import('k6/http').ResponseType | undefined>;
export declare function updatePosition(position: UserPosition, session?: Session): import('k6/http').RefinedResponse<import('k6/http').ResponseType | undefined>;
export declare function getOrCreatePosition(positionName: string, structure: Structure, session?: Session): UserPosition;
export declare function attributePositions(user: {
    id: string;
}, positions: UserPosition[], session?: Session): import('k6/http').RefinedResponse<import('k6/http').ResponseType | undefined>;
export declare function deletePosition(positionId: string, session?: Session): import('k6/http').RefinedResponse<import('k6/http').ResponseType | undefined>;
export declare function getPositionByIdOrFail(positionId: string, session?: Session): UserPosition;
export declare function createPositionOrFail(positionName: string, structure: Structure, session: Session): UserPosition;
export declare function searchPositions(content: string, session: Session): import('k6/http').RefinedResponse<import('k6/http').ResponseType | undefined>;
export declare function getPositionsOfStructure(structure: Structure, session: Session): any;
export declare function makeAdml(user: any, structure: Structure, session: Session): import('k6/http').RefinedResponse<import('k6/http').ResponseType | undefined>;
export declare function makeAdmlOfStructures(user: any, structureIds: string[], session: Session): import('k6/http').RefinedResponse<import('k6/http').ResponseType | undefined>;
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
export declare function getAdmlsOrMakThem(structure: Structure, profile: string, nbAdmls: number, excludedUsers: {
    id: string;
}[], session: Session): UserInfo[];
export declare function makeEverybodyAdml(fromStructure: Structure, structureIds: string[], session: Session): void;
export declare function attachUserToStructures(user: UserInfo, structures: Structure | Structure[], session?: Session): void;
export declare function importCSVToStructure(structure: Structure, users: bytes | StructureInitData, importParameters: StructureImportParameters, session: Session): import('k6/http').RefinedResponse<import('k6/http').ResponseType | undefined>;
export declare function applyCommRules(structures: Structure[], session: Session): void;
//# sourceMappingURL=structure.utils.d.ts.map