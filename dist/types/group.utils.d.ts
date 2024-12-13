import { BroadcastGroup, ProfileGroup, Session, Structure, UserInfo } from '.';
export declare const ADML_FILTER = "AdminLocal";
export declare function createBroadcastGroup(broadcastListName: string, school: Structure, session: Session): BroadcastGroup;
export declare function addCommRuleToGroup(groupId: string, fromGroupIds: string[], session: Session): void;
export declare function getTeacherRole(structure: Structure, session: Session): import('./roles.utils').RoleOfStructure;
export declare function getStudentRole(structure: Structure, session: Session): import('./roles.utils').RoleOfStructure;
export declare function getParentRole(structure: Structure, session: Session): import('./roles.utils').RoleOfStructure;
export declare function getProfileGroupOfStructure(profileGroupName: string, structure: Structure, session: Session): import('./roles.utils').RoleOfStructure;
/**
 *
 * @param structureId Id of the structure whose profile groups we want to fetch
 * @param session Session of the user performing the action
 * @returns All the ProfileGroup of the structure
 */
export declare function getProfileGroupsOfStructure(structureId: string, session: Session): ProfileGroup[];
export declare function getBroadcastGroup(broadcastListName: string, school: Structure, session: Session): BroadcastGroup;
/**
 *
 * @param groupId Id of the group whose users we want
 * @param session Session of the requester
 * @returns List of the users belonging to the specified group
 */
export declare function getUsersOfGroup(groupId: string, session: Session): UserInfo[];
//# sourceMappingURL=group.utils.d.ts.map