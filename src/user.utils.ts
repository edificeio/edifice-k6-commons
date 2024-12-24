import http from "k6/http";
import { check, fail } from "k6";
import {
  Cookie,
  Identified,
  Session,
  SessionMode,
  UserCreationRequest,
  UserInfo,
  UserProfileType,
} from "./models";
import sessionHolder from "./session.utils";

const THIRTY_MINUTES_IN_SECONDS = 30 * 60;

const rootUrl = __ENV.ROOT_URL;

export const getHeaders = function (): {
  [name: string]: string;
} {
  let headers: any = {};
  const session = sessionHolder.session;
  if (session) {
    if (session.mode === SessionMode.COOKIE) {
      headers = { "x-xsrf-token": session.getCookie("XSRF-TOKEN") || "" };
    } else if (session.mode === SessionMode.OAUTH2) {
      headers = { Authorization: `Bearer ${session.token}` };
    } else {
      headers = {};
    }
  } else {
    headers = {};
  }
  if (__ENV.REQUEST_TIMEOUT) {
    headers.requestTimeout = __ENV.REQUEST_TIMEOUT;
    headers.timeout = __ENV.REQUEST_TIMEOUT;
  }
  return headers;
};

export const searchUser = function (q: string): string {
  const response = http.get(`${rootUrl}/conversation/visible?search=${q}`, {
    headers: getHeaders(),
  });
  check(response, {
    "should get an OK response": (r) => r.status == 200,
  });
  const users = <any>response.json("users");
  return users[0].id;
};

export const getConnectedUserId = function () {
  const response = http.get(`${rootUrl}/auth/oauth2/userinfo`, {
    headers: getHeaders(),
  });
  check(response, {
    "should get an OK response": (r) => r.status == 200,
    "should get a valid userId": (r) => !!r.json("userId"),
  });
  return response.json("userId");
};

export const authenticateWeb = function (login: string, pwd?: string) {
  const jar = http.cookieJar();
  jar.clear(rootUrl);
  let credentials = {
    email: login,
    password: pwd || __ENV.DEFAULT_PASSWORD || "password",
    callBack: "",
    detail: "",
  };

  const response = http.post(`${rootUrl}/auth/login`, credentials, {
    redirects: 0,
  });
  if (response.status !== 302) {
    fail("should redirect connected user to login page");
  }
  if (
    response.cookies["oneSessionId"] === null ||
    response.cookies["oneSessionId"] === undefined
  ) {
    fail("login process should have set an auth cookie");
  }
  let session: Session | null;
  if (response.cookies["oneSessionId"]) {
    jar.set(rootUrl, "oneSessionId", response.cookies["oneSessionId"][0].value);
    const cookies: Cookie[] = Object.keys(response.cookies).map(
      (cookieName) => {
        return {
          name: cookieName,
          value: response.cookies[cookieName][0].value,
        };
      },
    );
    session = new Session(
      response.cookies["oneSessionId"][0].value,
      SessionMode.COOKIE,
      THIRTY_MINUTES_IN_SECONDS,
      cookies,
    );
  } else {
    console.error(`Could not get oneSessionId for ${login}`);
    session = null;
  }
  sessionHolder.session = session;
  return session;
};

export const logout = function () {
  const res = http.get(`${rootUrl}/auth/logout?callback=/`, {
    headers: getHeaders(),
  });
  http.cookieJar().clear(rootUrl);
  sessionHolder.session = null;
  return res;
};

export const switchSession = function (
  session: Session | null,
): Session | null {
  const jar = http.cookieJar();
  if (session) {
    jar.set(rootUrl, "oneSessionId", session.token);
    jar.set(rootUrl, "XSRF-TOKEN", session.getCookie("XSRF-TOKEN") || "");
  } else {
    jar.delete(rootUrl, "oneSessionId");
    jar.delete(rootUrl, "XSRF-TOKEN");
  }
  sessionHolder.session = session || null;
  return session;
};

export const authenticateOAuth2 = function (
  login: string,
  pwd: string,
  clientId: string,
  clientSecret: string,
) {
  let credentials = {
    grant_type: "password",
    username: login,
    password: pwd,
    client_id: clientId,
    client_secret: clientSecret,
    scope:
      "timeline userbook blog lvs actualites pronote schoolbook support viescolaire zimbra conversation directory homeworks userinfo workspace portal cas sso presences incidents competences diary edt infra auth",
  };

  let response = http.post(`${rootUrl}/auth/oauth2/token`, credentials, {
    redirects: 0,
  });
  check(response, {
    "should get an OK response for authentication": (r) => r.status == 200,
    "should have set an access token": (r) => !!r.json("access_token"),
  });
  const accessToken = <string>response.json("access_token");
  const session = new Session(
    accessToken,
    SessionMode.OAUTH2,
    <number>response.json("expires_in"),
  );
  sessionHolder.session = session;
};

/**
 *
 * @param arrayOfUsers User array from which to pick the user to return
 * @param exceptUsers A list of users to avoid
 * @returns A randomly picked user from arrayOfUsers who is no in exceptUsers
 */
export function getRandomUser<T extends Identified>(
  arrayOfUsers: T[],
  exceptUsers: Identified[] = [],
): T {
  const idToAvoid = (exceptUsers || []).map((u) => u.id);
  for (let i = 0; i < 1000; i++) {
    const user = arrayOfUsers[Math.floor(Math.random() * arrayOfUsers.length)];
    if (idToAvoid.indexOf(user.id) < 0) {
      return user;
    }
  }

  throw "cannot.find.random.user";
}

/**
 *
 * @param arrayOfUsers User array from which to pick the user to return
 * @param exceptUsers A list of users to avoid
 * @param profileGroup Name of the profile of the user to pick
 * @returns A randomly picked user from arrayOfUsers who is no in exceptUsers
 */
export function getRandomUserWithProfile<
  T extends { id: string; type: UserProfileType },
>(
  arrayOfUsers: T[],
  profileGroup: UserProfileType,
  exceptUsers: Identified[] = [],
): T {
  const usersOfGroup = arrayOfUsers.filter((u) => u.type === profileGroup);
  return getRandomUser(usersOfGroup, exceptUsers);
}

export function checkStatus(
  res: any,
  checkName: string,
  expectedStatus: number,
): boolean {
  const checks: any = {};
  checks[checkName] = (r: any) => r.status === expectedStatus;
  const ok = check(res, checks);
  if (!ok) {
    console.error(checkName, res);
  }
  return ok;
}

export function getUserProfileOrFail(id: string): UserInfo {
  let res = http.get(`${rootUrl}/directory/user/${id}?manual-groups=true`, {
    headers: getHeaders(),
  });
  if (res.status !== 200) {
    console.error(res);
    fail(`Could not get user profile`);
  }
  return JSON.parse(<string>res.body);
}

export function createUser(userCreationRequest: UserCreationRequest) {
  const payload = <any>userCreationRequest;
  const headers = getHeaders();
  headers["content-type"] = "application/x-www-form-urlencoded;charset=UTF-8";
  return http.post(`${rootUrl}/directory/api/user`, payload, {
    headers,
  });
}

export function mergeUsers(userId1: string, userId2: string, keepRelations:boolean) {
  const payload = JSON.stringify({
    keepRelations: keepRelations
  });
  const headers = getHeaders();
  headers["content-type"] = "application/json";
  return http.post(`${rootUrl}/directory/duplicate/merge/${userId1}/${userId2}`, payload, {headers});
}
