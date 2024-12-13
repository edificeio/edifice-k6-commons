import { Session, UserCreationRequest, UserInfo } from './models';
export declare const getHeaders: (session?: Session) => {
    [name: string]: string;
};
export declare const searchUser: (q: string, session: Session) => string;
export declare const getConnectedUserId: (session: Session) => import('k6').JSONValue;
export declare const authenticateWeb: (login: string, pwd?: string) => Session | null;
export declare const logout: (session: Session) => import('k6/http').RefinedResponse<import('k6/http').ResponseType | undefined>;
export declare const switchSession: (session?: Session) => Session | undefined;
export declare const authenticateOAuth2: (login: string, pwd: string, clientId: string, clientSecret: string) => Session;
export declare function getRandomUser(arrayOfUsers: {
    id: string;
}[], exceptUsers: {
    id: string;
}[]): {
    id: string;
};
export declare function getRandomUserWithProfile(arrayOfUsers: {
    id: string;
    type: string;
}[], profileGroup: string, exceptUsers: {
    id: string;
}[]): {
    id: string;
};
export declare function checkStatus(res: any, checkName: string, expectedStatus: number): boolean;
export declare function getUserProfileOrFail(id: string, session: Session): UserInfo;
export declare function createUser(userCreationRequest: UserCreationRequest, session: Session): import('k6/http').RefinedResponse<import('k6/http').ResponseType | undefined>;
//# sourceMappingURL=user.utils.d.ts.map