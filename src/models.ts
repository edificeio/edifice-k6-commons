import { bytes } from "k6";
export type IdAndName = {
  id: string;
  name: string;
};
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
  type: UserProfileType;
  firstName: string;
  lastName: string;
  source: string;
  userPositions: string[];
  structures: IdAndName[];
  classes: StructureClass[];
};

export type StructureClass = {
  id: string;
  externalId: string;
  name: string;
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

export type GroupCommunicationRelation = "incoming" | "outgoing";

export type Group = {
  id: string;
  name: string;
  filter: string;
  internalCommunicationRule: string;
  structures: IdAndName[];
};
export type Identified = {
  id: string;
};

export type UserProfileType = "Teacher" | "Relative" | "Guest" | "Student";

export type ShareBookMarkCreationRequest = {
  members: string[];
  name: string;
};

export type ShareBookMark = {
  id: string;
  name: string;
  groups: string[];
  users: {
    displayName: string;
    profile: UserProfileType;
    id: string;
    activationCode: boolean;
  };
};

export type DraftMessage = {
  to: string[];
  cc: string[];
  cci: string[];
  subject: string;
  body: string;
};

export type SentMessage = {
  id: string;
  subject: string;
  body: string;
  thread_id: string;
  inactive: string[];
  undelivered: string[];
  sent: number;
};

export type UserLight = {
  id: string;
  displayName: string;
};

// It can be a group or a user or a share bookmark
export type Visible = {
  id: string;
  displayName: string;
  nbUsers?: number;
  profile?: string;
  children?: UserLight[];
  relatives?: UserLight[];
  type: string;
  groupType?: string;
  usedIn: string[];
};
