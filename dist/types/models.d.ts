import { bytes } from 'k6';
export type IdAndName = {
    id: string;
    name: string;
};
export type Notification = {
    _id: string;
    type: string;
    "event-type": string;
    recipients: {
        userId: string;
        unread: number;
    }[];
    resource: string;
    sender: string;
    params: object;
    message: "string";
    preview: [images: string[], text: string, images: object];
};
export type Shares = {
    bookmarks: object;
    groups: object;
    users: object;
};
export type Structure = {
    id: string;
    name: string;
    externalId: string;
    feederName: string;
    source: string;
    parents: {
        name: string;
        id: string;
    }[];
};
export type StructureInitData = {
    teachers: bytes;
    students: bytes;
    responsables: bytes;
};
export type BroadcastGroup = {
    id: string;
    name: string;
    displayName: string;
    labels: string[];
    autolinkTargetAllStructs: boolean;
    autolinkTargetStructs: string[];
    autolinkUsersFromGroups: string[];
    type: string;
    structures: Structure[];
};
export declare const SessionMode: {
    COOKIE: number;
    OAUTH2: number;
};
export type Cookie = {
    name: string;
    value: string;
};
export declare class Session {
    expiresAt: number;
    token: string;
    mode: number;
    cookies?: Cookie[];
    constructor(token: string, mode: number, expiresIn: number, cookies?: Cookie[]);
    static from(json: any): Session;
    isExpired(): boolean;
    getCookie(cookieName: string): string | null;
}
export type WorkspaceFile = {
    name: string;
    metadata: {
        name: string;
        filename: string;
        "content-type": string;
    };
    file: string;
    shared: any[];
    inheritedShares: any[];
    isShared: boolean;
    owner: string;
    _id: string;
};
export type UserPosition = {
    id: string;
    name: string;
    structureId: string;
    source: string;
};
export type UserbookSearchCriteria = {
    structures: IdAndName[];
    classes: IdAndName[];
    functions: string[];
    profiles: string[];
    groupTypes: string[];
    positions: UserPosition[];
};
export type ProfileGroup = {
    id: string;
    name: string;
    filter: string;
    type: string;
    subType: string;
    nbUsers: number;
    classes: IdAndName[];
    structures: IdAndName[];
};
export type UserInfo = {
    id: string;
    externalId: string;
    login: string;
    type: string;
    firstName: string;
    lastName: string;
    source: string;
    userPositions: string[];
    structures: IdAndName[];
};
export type StructureFlavour = "default" | "tiny";
export type UserCreationRequest = {
    firstName: string;
    lastName: string;
    type: string;
    structureId: string;
    birthDate: string;
    positionIds: string[];
};
export type StructureImportParameters = {
    predelete?: boolean;
    transition?: boolean;
};
export type Group = {
    id: string;
    name: string;
    filter: string;
    internalCommunicationRule: string;
    structures: IdAndName[];
};
//# sourceMappingURL=models.d.ts.map