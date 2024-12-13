import { Session } from './models';
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
export declare function getRoleByName(name: string, session: Session): Role;
export declare function createAndSetRole(applicationName: string, session: Session): Role;
export declare function getRolesOfStructure(structureId: string, session: Session): RoleOfStructure[];
//# sourceMappingURL=roles.utils.d.ts.map