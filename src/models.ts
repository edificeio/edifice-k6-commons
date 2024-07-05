import { bytes } from "k6";

export type Notification = {
  _id: string;
  type: string;
  "event-type": string;
  recipients: { userId: string; unread: number }[];
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
  parents: { name: string; id: string }[];
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

export const SessionMode = {
  COOKIE: 0,
  OAUTH2: 1,
};
export type Cookie = {
  name: string;
  value: string;
};

export class Session {
  expiresAt: number;
  token: string;
  mode: number;
  cookies?: Cookie[];
  constructor(
    token: string,
    mode: number,
    expiresIn: number,
    cookies?: Cookie[],
  ) {
    this.token = token;
    this.mode = mode;
    this.cookies = cookies;
    this.expiresAt = Date.now() + expiresIn * 1000 - 3000;
  }
  static from(json: any) {
    const session = new Session(json.token, json.mode, 0, json.cookies);
    session.expiresAt = json.expiresAt;
    return session;
  }
  isExpired() {
    return this.expiresAt <= Date.now();
  }
  getCookie(cookieName: string) {
    return this.cookies
      ? this.cookies
          .filter((cookie) => cookie.name === cookieName)
          .map((cookie) => cookie.value)[0]
      : null;
  }
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
};