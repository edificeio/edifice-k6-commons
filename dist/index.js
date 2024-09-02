var I = Object.defineProperty;
var U = (o, e, t) => e in o ? I(o, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : o[e] = t;
var y = (o, e, t) => (U(o, typeof e != "symbol" ? e + "" : e, t), t);
import c from "k6/http";
import { check as f, fail as g } from "k6";
import { FormData as S } from "https://jslib.k6.io/formdata/0.0.2/index.js";
import { URL as v } from "https://jslib.k6.io/url/1.0.0/index.js";
const $ = {
  COOKIE: 0,
  OAUTH2: 1
};
class O {
  constructor(e, t, r, s) {
    y(this, "expiresAt");
    y(this, "token");
    y(this, "mode");
    y(this, "cookies");
    this.token = e, this.mode = t, this.cookies = s, this.expiresAt = Date.now() + r * 1e3 - 3e3;
  }
  static from(e) {
    const t = new O(e.token, e.mode, 0, e.cookies);
    return t.expiresAt = e.expiresAt, t;
  }
  isExpired() {
    return this.expiresAt <= Date.now();
  }
  getCookie(e) {
    return this.cookies ? this.cookies.filter((t) => t.name === e).map((t) => t.value)[0] : null;
  }
}
const N = __ENV.BASE_URL, J = 30 * 60, k = __ENV.ROOT_URL, i = function(o) {
  let e;
  return o ? o.mode === $.COOKIE ? e = { "x-xsrf-token": o.getCookie("XSRF-TOKEN") || "" } : o.mode === $.OAUTH2 ? e = { Authorization: `Bearer ${o.token}` } : e = {} : e = {}, e;
}, le = function(o, e) {
  const t = c.get(`${k}/conversation/visible?search=${o}`, {
    headers: i(e)
  });
  return f(t, {
    "should get an OK response": (s) => s.status == 200
  }), t.json("users")[0].id;
}, ie = function(o) {
  const e = c.get(`${k}/auth/oauth2/userinfo`, {
    headers: i(o)
  });
  return f(e, {
    "should get an OK response": (t) => t.status == 200,
    "should get a valid userId": (t) => !!t.json("userId")
  }), e.json("userId");
}, A = function(o, e) {
  const t = c.cookieJar();
  t.clear(k);
  let r = {
    email: o,
    password: e || __ENV.DEFAULT_PASSWORD,
    callBack: "",
    detail: ""
  };
  const s = c.post(`${k}/auth/login`, r, {
    redirects: 0
  });
  if (s.status !== 302 && g("should redirect connected user to login page"), (s.cookies.oneSessionId === null || s.cookies.oneSessionId === void 0) && g("login process should have set an auth cookie"), !s.cookies.oneSessionId)
    return console.error(`Could not get oneSessionId for ${o}`), null;
  t.set(k, "oneSessionId", s.cookies.oneSessionId[0].value);
  const n = Object.keys(s.cookies).map((a) => ({ name: a, value: s.cookies[a][0].value }));
  return new O(
    s.cookies.oneSessionId[0].value,
    $.COOKIE,
    J,
    n
  );
}, ue = function(o) {
  const e = c.get(`${k}/auth/logout?callback=/`, {
    headers: i(o)
  });
  return c.cookieJar().clear(k), e;
}, pe = function(o) {
  const e = c.cookieJar();
  return e.set(k, "oneSessionId", o.token), e.set(k, "XSRF-TOKEN", o.getCookie("XSRF-TOKEN") || ""), o;
}, de = function(o, e, t, r) {
  let s = {
    grant_type: "password",
    username: o,
    password: e,
    client_id: t,
    client_secret: r,
    scope: "timeline userbook blog lvs actualites pronote schoolbook support viescolaire zimbra conversation directory homeworks userinfo workspace portal cas sso presences incidents competences diary edt infra auth"
  }, n = c.post(`${k}/auth/oauth2/token`, s, {
    redirects: 0
  });
  f(n, {
    "should get an OK response for authentication": (l) => l.status == 200,
    "should have set an access token": (l) => !!l.json("access_token")
  });
  const a = n.json("access_token");
  return new O(
    a,
    $.OAUTH2,
    n.json("expires_in")
  );
};
function D(o, e) {
  const t = (e || []).map((r) => r.id);
  for (let r = 0; r < 1e3; r++) {
    const s = o[Math.floor(Math.random() * o.length)];
    if (t.indexOf(s.id) < 0)
      return s;
  }
  throw "cannot.find.random.user";
}
function x(o, e, t) {
  const r = o.filter((s) => s.type === e);
  return D(r, t);
}
function fe(o, e, t) {
  const r = {};
  r[e] = (n) => n.status === t;
  const s = f(o, r);
  return s || console.error(e, o), s;
}
function ge(o, e) {
  let t = c.get(`${k}/directory/user/${o}?manual-groups=true`, {
    headers: i(e)
  });
  return t.status !== 200 && (console.error(t), g("Could not get user profile")), JSON.parse(t.body);
}
const ke = function(o, e) {
  const t = c.get(`${N}/metrics`, {
    headers: i(e)
  });
  f(t, {
    "should get an OK response": (s) => s.status == 200
  });
  const r = t.body.split(`
`);
  for (let s of r)
    if (s.indexOf(`${o} `) === 0)
      return parseFloat(s.substring(o.length + 1).trim());
  return console.error("Metric", o, "not found"), null;
}, h = __ENV.ROOT_URL, L = "AdminLocal";
function me(o, e, t) {
  let r = _(o, e, t);
  if (r)
    console.log("Broadcast group already existed");
  else {
    console.log("Creating broadcast group");
    const s = i(t);
    s["content-type"] = "application/json";
    let n = JSON.stringify({
      name: o,
      structureId: e.id,
      subType: "BroadcastGroup"
    }), a = c.post(`${h}/directory/group`, n, { headers: s });
    f(a, {
      "create broadcast group": (u) => u.status === 201
    });
    const l = JSON.parse(a.body).id;
    n = JSON.stringify({
      name: o,
      autolinkTargetAllStructs: !0,
      autolinkTargetStructs: [],
      autolinkUsersFromGroups: ["Teacher"]
    }), a = c.put(`${h}/directory/group/${l}`, n, { headers: s }), f(a, {
      "set broadcast group for teachers": (u) => u.status === 200
    });
    const p = G(e, t).id;
    F(l, [p], t), r = _(o, e, t);
  }
  return r;
}
function F(o, e, t) {
  const r = i(t);
  r["content-type"] = "application/json";
  for (let s of e) {
    let n = c.post(
      `${h}/communication/v2/group/${s}/communique/${o}`,
      "{}",
      { headers: r }
    );
    n.status !== 200 && (console.error(n), g(`Cannot open comm rule from ${s} to ${o}`));
  }
}
function G(o, e) {
  return b("teachers", o, e);
}
function he(o, e) {
  return b("students", o, e);
}
function ye(o, e) {
  return b("relatives", o, e);
}
function b(o, e, t) {
  return T(e.id, t).filter((s) => {
    const n = s.name.toLowerCase();
    return n === `${e.name} group ${o}.`.toLowerCase() || n === `${o} from group ${e.name}.`.toLowerCase();
  })[0];
}
function P(o, e) {
  const t = i(e);
  t["Accept-Language"] = "en";
  let r = c.get(
    `${h}/directory/group/admin/list?structureId=${o}&translate=false`,
    { headers: t }
  );
  return f(r, {
    "get structure profile groups should be ok": (s) => s.status == 200
  }), JSON.parse(r.body);
}
function _(o, e, t) {
  const r = i(t);
  r["content-type"] = "application/json";
  let s = c.get(
    `${h}/directory/group/admin/list?translate=false&structureId=${e.id}`,
    { headers: r }
  );
  return JSON.parse(s.body).filter(
    (n) => n.subType === "BroadcastGroup" && n.name === o
  )[0];
}
function j(o, e) {
  const t = i(e);
  t["content-type"] = "application/json";
  let r = c.get(
    `${h}/directory/user/admin/list?groupId=${o}`,
    { headers: t }
  );
  return JSON.parse(r.body);
}
const d = __ENV.ROOT_URL, V = new v(d).hostname, R = __ENV.DEFAULT_PASSWORD || "password";
function w(o, e) {
  let t = c.get(`${d}/directory/structure/admin/list`, {
    headers: i(e)
  });
  return JSON.parse(t.body).filter(
    (r) => r.name === o
  )[0];
}
function M(o, e) {
  let t = c.get(`${d}/directory/structure/${o.id}/users`, {
    headers: i(e)
  });
  if (t.status !== 200)
    throw `Impossible to get users of ${o.id}`;
  return JSON.parse(t.body);
}
function B(o, e) {
  let t = c.get(`${d}/directory/structure/${o.id}/users`, {
    headers: i(e)
  });
  t.status != 200 && g(`Cannot fetch users of structure ${o.id} : ${t}`);
  const r = JSON.parse(t.body);
  for (let s = 0; s < r.length; s++) {
    const n = r[s];
    K(n);
  }
}
function K(o) {
  if (o.code) {
    const e = {};
    e.login = o.login, e.activationCode = o.code, e.password = R, e.confirmPassword = R, e.acceptCGU = "true";
    const t = c.post(`${d}/auth/activation`, e, {
      redirects: 0,
      headers: { Host: V }
    });
    t.status !== 302 && (console.error(t), g(
      `Could not activate user ${o.login} : ${t.status} - ${t.body}`
    ));
  }
}
function $e(o, e, t, r) {
  const n = T(o.id, r).filter(
    (a) => t.indexOf(a.name) >= 0
  );
  for (let a of n)
    if (a.roles.indexOf(e.name) >= 0)
      console.log("Role already attributed to teachers");
    else {
      const l = i(r);
      l["content-type"] = "application/json";
      const p = { headers: l }, u = JSON.stringify({
        groupId: a.id,
        roleIds: (a.roles || []).concat([e.id])
      }), m = c.post(
        `${d}/appregistry/authorize/group?schoolId=${o.id}`,
        u,
        p
      );
      f(m, {
        "link role to structure": (E) => E.status == 200
      });
    }
}
function we(o, e, t) {
  let r = w(o, t);
  if (r)
    console.log(`Structure ${o} already exists`);
  else {
    const s = i(t);
    s["content-type"] = "application/json";
    const n = JSON.stringify({
      hasApp: e,
      name: o
    });
    let a = c.post(`${d}/directory/school`, n, s);
    a.status !== 201 && (console.error(a.body), g(`Could not create structure ${o}`)), r = w(o, t);
  }
  return r;
}
function Ce(o, e = "default") {
  const t = A(__ENV.ADMC_LOGIN, __ENV.ADMC_PASSWORD), r = H(o, e);
  return B(r, t), r;
}
function H(o, e = "default") {
  const t = o || "General", r = A(__ENV.ADMC_LOGIN, __ENV.ADMC_PASSWORD), s = "https://raw.githubusercontent.com/edificeio/edifice-k6-commons/develop/data/structure", n = c.get(`${s}/enseignants.${e}.csv`).body, a = c.get(`${s}/eleves.${e}.csv`).body, l = c.get(`${s}/responsables.${e}.csv`).body;
  return z(
    t,
    {
      teachers: n,
      students: a,
      responsables: l
    },
    r
  );
}
function z(o, e, t) {
  let r = w(o, t);
  if (r)
    console.log("School already exists");
  else {
    const s = new S();
    s.append("type", "CSV"), s.append("structureName", o);
    let n, a, l;
    "teachers" in e ? (n = e.teachers, a = e.students, l = e.responsables) : n = e, s.append("Teacher", c.file(n, "enseignants.csv")), a && s.append("Student", c.file(a, "eleves.csv")), l && s.append("Relative", c.file(l, "responsables.csv"));
    const p = i(t);
    p["Content-Type"] = "multipart/form-data; boundary=" + s.boundary;
    const u = { headers: p };
    c.post(
      `${d}/directory/wizard/import`,
      s.body(),
      u
    ).status != 200 && g(`Could not create structure ${o}`), r = w(o, t);
  }
  return r;
}
function Oe(o, e, t) {
  let r;
  if ((e.parents || []).map((n) => n.id).indexOf(o.id) >= 0)
    console.log(
      `${e.name} is already a child of ${o.name}`
    ), r = !1;
  else {
    const n = i(t);
    n["content-type"] = "application/json", c.put(
      `${d}/directory/structure/${e.id}/parent/${o.id}`,
      "{}"
    ).status !== 200 && g(
      `Could not attach structure ${e.name} as a child of ${o.name}`
    ), r = !0;
  }
  return r;
}
function Se(o, e, t) {
  const r = new S();
  r.append("type", "CSV"), r.append("structureName", o.name), r.append("structureId", o.id), r.append("structureExternalId", o.externalId);
  let s, n, a;
  "teachers" in e ? (s = e.teachers, n = e.students, a = e.responsables) : s = e, r.append("Teacher", c.file(s, "enseignants.csv")), n && r.append("Student", c.file(n, "eleves.csv")), a && r.append("Relative", c.file(a, "responsables.csv"));
  const l = i(t);
  l["Content-Type"] = "multipart/form-data; boundary=" + r.boundary;
  const p = { headers: l };
  return c.post(
    `${d}/directory/wizard/import`,
    r.body(),
    p
  );
}
function be(o) {
  const e = i(o);
  return e["content-type"] = "application/json", c.post(`${d}/directory/import`, "{}", { headers: e });
}
function q(o, e, t) {
  const r = i(t);
  r["content-type"] = "application/json";
  const s = JSON.stringify({
    name: o,
    structureId: e.id
  });
  return c.post(`${d}/directory/positions`, s, {
    redirects: 0,
    headers: r
  });
}
function _e(o, e, t) {
  const r = i(t);
  r["content-type"] = "application/json";
  const s = {};
  return e != null && (s.positionIds = e.map((a) => a.id)), c.put(
    `${d}/directory/user/${o.id}`,
    JSON.stringify(s),
    {
      headers: r
    }
  );
}
function Re(o, e) {
  const t = i(e);
  return t["content-type"] = "application/json", c.del(`${d}/directory/positions/${o}`, null, {
    redirects: 0,
    headers: t
  });
}
function We(o, e, t) {
  const r = q(o, e, t);
  return r.status !== 201 && (console.error(r), g(
    `Could not create position ${o} on structure ${e.name}`
  )), JSON.parse(r.body);
}
function ve(o, e) {
  const t = i(e), r = new v(`${d}/directory/positions`);
  return r.searchParams.append("prefix", o), c.get(r.toString(), { headers: t });
}
function X(o, e, t) {
  const r = i(t);
  r["content-type"] = "application/json";
  const s = JSON.stringify({
    functionCode: "ADMIN_LOCAL",
    inherit: "s",
    scope: [e.id]
  });
  let n = c.post(
    `${d}/directory/user/function/${o.id}`,
    s,
    { headers: r }
  );
  return ee(n, "user should be made ADML"), n;
}
function Ae(o, e, t, r, s) {
  const a = P(
    o.id,
    s
  ).filter(
    (p) => p.filter === L
  )[0];
  let l;
  if (a) {
    const p = j(
      a.id,
      s
    );
    l = e ? p.filter((u) => u.type === e) : p;
  } else
    l = [];
  if (r && r.length > 0) {
    const p = r.map((u) => u.id);
    l = l.filter((u) => p.indexOf(u.id) < 0);
  }
  if (l.length < t) {
    const p = M(o, s);
    for (let u = l.length; u < t; u++) {
      let m;
      e ? m = x(p, e, l) : m = D(p, l), console.log(
        `Turning ${m.login} into an ADML of ${o.id} - ${o.name}`
      ), X(m, o, s), l.push(m);
    }
  }
  return l.slice(0, t);
}
const C = __ENV.ROOT_URL;
function W(o, e) {
  let t = c.get(`${C}/appregistry/roles`, {
    headers: i(e)
  });
  return JSON.parse(t.body).filter((s) => s.name === o)[0];
}
function De(o, e) {
  const t = `${o} - All - Stress Test`;
  let r = W(t, e);
  if (r)
    console.log(`Role ${t} already existed`);
  else {
    let s = c.get(
      `${C}/appregistry/applications/actions?actionType=WORKFLOW`,
      { headers: i(e) }
    );
    f(s, { "get workflow actions": (u) => u.status == 200 });
    const a = JSON.parse(s.body).filter(
      (u) => u.name === o
    )[0].actions.map((u) => u[0]), l = i(e);
    l["content-type"] = "application/json";
    const p = {
      role: t,
      actions: a
    };
    s = c.post(`${C}/appregistry/role`, JSON.stringify(p), {
      headers: l
    }), console.log(s), f(s, { "save role ok": (u) => u.status == 201 }), r = W(t, e);
  }
  return r;
}
function T(o, e) {
  const t = i(e);
  t["Accept-Language"] = "en";
  let r = c.get(
    `${C}/appregistry/groups/roles?structureId=${o}&translate=false`,
    { headers: t }
  );
  return f(r, {
    "get structure roles should be ok": (s) => s.status == 200
  }), JSON.parse(r.body);
}
const Y = __ENV.ROOT_URL, Te = [
  "org-entcore-workspace-controllers-WorkspaceController|getDocument",
  "org-entcore-workspace-controllers-WorkspaceController|copyDocuments",
  "org-entcore-workspace-controllers-WorkspaceController|getDocumentProperties",
  "org-entcore-workspace-controllers-WorkspaceController|getRevision",
  "org-entcore-workspace-controllers-WorkspaceController|copyFolder",
  "org-entcore-workspace-controllers-WorkspaceController|getPreview",
  "org-entcore-workspace-controllers-WorkspaceController|copyDocument",
  "org-entcore-workspace-controllers-WorkspaceController|getDocumentBase64",
  "org-entcore-workspace-controllers-WorkspaceController|listRevisions",
  "org-entcore-workspace-controllers-WorkspaceController|commentFolder",
  "org-entcore-workspace-controllers-WorkspaceController|commentDocument",
  "org-entcore-workspace-controllers-WorkspaceController|shareJson",
  "org-entcore-workspace-controllers-WorkspaceController|deleteFolder",
  "org-entcore-workspace-controllers-WorkspaceController|restoreFolder",
  "org-entcore-workspace-controllers-WorkspaceController|removeShare",
  "org-entcore-workspace-controllers-WorkspaceController|moveFolder",
  "org-entcore-workspace-controllers-WorkspaceController|moveTrash",
  "org-entcore-workspace-controllers-WorkspaceController|restoreTrash",
  "org-entcore-workspace-controllers-WorkspaceController|bulkDelete",
  "org-entcore-workspace-controllers-WorkspaceController|shareResource",
  "org-entcore-workspace-controllers-WorkspaceController|deleteRevision",
  "org-entcore-workspace-controllers-WorkspaceController|shareJsonSubmit",
  "org-entcore-workspace-controllers-WorkspaceController|moveDocument",
  "org-entcore-workspace-controllers-WorkspaceController|renameFolder",
  "org-entcore-workspace-controllers-WorkspaceController|moveTrashFolder",
  "org-entcore-workspace-controllers-WorkspaceController|deleteComment",
  "org-entcore-workspace-controllers-WorkspaceController|getParentInfos",
  "org-entcore-workspace-controllers-WorkspaceController|deleteDocument",
  "org-entcore-workspace-controllers-WorkspaceController|renameDocument",
  "org-entcore-workspace-controllers-WorkspaceController|moveDocuments",
  "org-entcore-workspace-controllers-WorkspaceController|updateDocument"
], Ee = [
  "org-entcore-workspace-controllers-WorkspaceController|getDocument",
  "org-entcore-workspace-controllers-WorkspaceController|copyDocuments",
  "org-entcore-workspace-controllers-WorkspaceController|getDocumentProperties",
  "org-entcore-workspace-controllers-WorkspaceController|getRevision",
  "org-entcore-workspace-controllers-WorkspaceController|copyFolder",
  "org-entcore-workspace-controllers-WorkspaceController|getPreview",
  "org-entcore-workspace-controllers-WorkspaceController|copyDocument",
  "org-entcore-workspace-controllers-WorkspaceController|getDocumentBase64",
  "org-entcore-workspace-controllers-WorkspaceController|listRevisions",
  "org-entcore-workspace-controllers-WorkspaceController|commentFolder",
  "org-entcore-workspace-controllers-WorkspaceController|commentDocument"
];
function Ie(o, e) {
  let t = i(e);
  const r = new S();
  r.append("file", c.file(o, "file.txt")), t["Content-Type"] = "multipart/form-data; boundary=" + r.boundary;
  let s = c.post(`${Y}/workspace/document`, r.body(), { headers: t });
  return f(s, {
    "upload doc ok": (n) => n.status === 201
  }), JSON.parse(s.body);
}
const Q = __ENV.ROOT_URL;
function Ue(o, e, t) {
  const r = i(t);
  r["content-type"] = "application/json";
  const s = JSON.stringify(e);
  return c.put(`${Q}/workspace/share/resource/${o}`, s, {
    headers: r
  });
}
const Z = __ENV.ROOT_URL;
function Ne(o, e, t) {
  const r = c.post(
    `${Z}/communication/v2/group/${o}/communique/${e}`,
    "{}",
    { headers: i(t) }
  );
  return r.status !== 200 && (console.error(
    `Error while adding communication between ${o} -> ${e}`
  ), console.error(r), g(`could not add communication between ${o} -> ${e}`)), r;
}
function ee(o, e, t = 200) {
  const r = t || 200;
  o.status != r && (console.error(`ko - ${e}. Expecting ${r} but got ${o.status}`), console.error(o), g(e + " ko"));
}
function Je(o, e, t = 500) {
  oe(
    () => o && o.code === t,
    `[${o.request.method}]${o.url} returns code ${t}: ${e} `
  );
}
function xe(o, e, t = 500) {
  const r = {};
  return r[`${e} (expects ${t})`] = () => {
    const s = o && o.status === t;
    return s || (console.warn("Expected ", t, " but got ", o.status), console.warn(o)), s;
  }, f({}, r);
}
function oe(o, e) {
  const t = {};
  t[e] = () => o, f({}, t) || g(e);
}
const te = __ENV.ROOT_URL;
function Le(o) {
  let e = c.get(`${te}/userbook/search/criteria`, {
    headers: i(o)
  });
  return JSON.parse(e.body);
}
export {
  L as ADML_FILTER,
  N as BASE_URL,
  O as Session,
  $ as SessionMode,
  Te as WS_MANAGER_SHARE,
  Ee as WS_READER_SHARE,
  K as activateUser,
  B as activateUsers,
  F as addCommRuleToGroup,
  Ne as addCommunicationBetweenGroups,
  oe as assertCondition,
  Je as assertKo,
  ee as assertOk,
  Oe as attachStructureAsChild,
  _e as attributePositions,
  de as authenticateOAuth2,
  A as authenticateWeb,
  xe as checkReturnCode,
  fe as checkStatus,
  De as createAndSetRole,
  me as createBroadcastGroup,
  H as createDefaultStructure,
  we as createEmptyStructure,
  q as createPosition,
  We as createPositionOrFail,
  z as createStructure,
  Re as deletePosition,
  Ae as getAdmlsOrMakThem,
  _ as getBroadcastGroup,
  ie as getConnectedUserId,
  i as getHeaders,
  ke as getMetricValue,
  ye as getParentRole,
  b as getProfileGroupOfStructure,
  P as getProfileGroupsOfStructure,
  D as getRandomUser,
  x as getRandomUserWithProfile,
  W as getRoleByName,
  T as getRolesOfStructure,
  w as getSchoolByName,
  Le as getSearchCriteria,
  he as getStudentRole,
  G as getTeacherRole,
  ge as getUserProfileOrFail,
  j as getUsersOfGroup,
  M as getUsersOfSchool,
  Se as importUsers,
  Ce as initStructure,
  $e as linkRoleToUsers,
  ue as logout,
  X as makeAdml,
  ve as searchPositions,
  le as searchUser,
  Ue as shareFile,
  pe as switchSession,
  be as triggerImport,
  Ie as uploadFile
};
