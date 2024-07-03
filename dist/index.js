var U = Object.defineProperty;
var D = (o, e, r) => e in o ? U(o, e, { enumerable: !0, configurable: !0, writable: !0, value: r }) : o[e] = r;
var m = (o, e, r) => (D(o, typeof e != "symbol" ? e + "" : e, r), r);
import c from "k6/http";
import { check as u, fail as g } from "k6";
import { FormData as O } from "https://jslib.k6.io/formdata/0.0.2/index.js";
import { URL as E } from "https://jslib.k6.io/url/1.0.0/index.js";
const h = {
  COOKIE: 0,
  OAUTH2: 1
};
class C {
  constructor(e, r, t, s) {
    m(this, "expiresAt");
    m(this, "token");
    m(this, "mode");
    m(this, "cookies");
    this.token = e, this.mode = r, this.cookies = s, this.expiresAt = Date.now() + t * 1e3 - 3e3;
  }
  static from(e) {
    const r = new C(e.token, e.mode, 0, e.cookies);
    return r.expiresAt = e.expiresAt, r;
  }
  isExpired() {
    return this.expiresAt <= Date.now();
  }
  getCookie(e) {
    return this.cookies ? this.cookies.filter((r) => r.name === e).map((r) => r.value)[0] : null;
  }
}
const I = __ENV.BASE_URL, A = 30 * 60, k = __ENV.ROOT_URL, l = function(o) {
  let e;
  return o ? o.mode === h.COOKIE ? e = { "x-xsrf-token": o.getCookie("XSRF-TOKEN") || "" } : o.mode === h.OAUTH2 ? e = { Authorization: `Bearer ${o.token}` } : e = {} : e = {}, e;
}, q = function(o, e) {
  const r = c.get(`${k}/conversation/visible?search=${o}`, {
    headers: l(e)
  });
  return u(r, {
    "should get an OK response": (s) => s.status == 200
  }), r.json("users")[0].id;
}, Y = function(o) {
  const e = c.get(`${k}/auth/oauth2/userinfo`, {
    headers: l(o)
  });
  return u(e, {
    "should get an OK response": (r) => r.status == 200,
    "should get a valid userId": (r) => !!r.json("userId")
  }), e.json("userId");
}, N = function(o, e) {
  const r = c.cookieJar();
  r.clear(k);
  let t = {
    email: o,
    password: e,
    callBack: "",
    detail: ""
  };
  const s = c.post(`${k}/auth/login`, t, {
    redirects: 0
  });
  if (u(s, {
    "should redirect connected user to login page": (a) => a.status === 302,
    "should have set an auth cookie": (a) => a.cookies.oneSessionId !== null && a.cookies.oneSessionId !== void 0
  }), !s.cookies.oneSessionId)
    return console.error(`Could not get oneSessionId for ${o}`), null;
  r.set(k, "oneSessionId", s.cookies.oneSessionId[0].value);
  const n = Object.keys(s.cookies).map((a) => ({ name: a, value: s.cookies[a][0].value }));
  return new C(
    s.cookies.oneSessionId[0].value,
    h.COOKIE,
    A,
    n
  );
}, Q = function(o) {
  const e = c.cookieJar();
  return e.set(k, "oneSessionId", o.token), e.set(k, "XSRF-TOKEN", o.getCookie("XSRF-TOKEN") || ""), o;
}, Z = function(o, e, r, t) {
  let s = {
    grant_type: "password",
    username: o,
    password: e,
    client_id: r,
    client_secret: t,
    scope: "timeline userbook blog lvs actualites pronote schoolbook support viescolaire zimbra conversation directory homeworks userinfo workspace portal cas sso presences incidents competences diary edt infra auth"
  }, n = c.post(`${k}/auth/oauth2/token`, s, {
    redirects: 0
  });
  u(n, {
    "should get an OK response for authentication": (i) => i.status == 200,
    "should have set an access token": (i) => !!i.json("access_token")
  });
  const a = n.json("access_token");
  return new C(
    a,
    h.OAUTH2,
    n.json("expires_in")
  );
};
function x(o, e) {
  const r = (e || []).map((t) => t.id);
  for (let t = 0; t < 1e3; t++) {
    const s = o[Math.floor(Math.random() * o.length)];
    if (r.indexOf(s.id) < 0)
      return s;
  }
  throw "cannot.find.random.user";
}
function ee(o, e, r) {
  const t = o.filter((s) => s.type === e);
  return x(t, r);
}
function oe(o, e, r) {
  const t = {};
  t[e] = (n) => n.status === r;
  const s = u(o, t);
  return s || console.error(e, o), s;
}
const re = function(o, e) {
  const r = c.get(`${I}/metrics`, {
    headers: l(e)
  });
  u(r, {
    "should get an OK response": (s) => s.status == 200
  });
  const t = r.body.split(`
`);
  for (let s of t)
    if (s.indexOf(`${o} `) === 0)
      return parseFloat(s.substring(o.length + 1).trim());
  return console.error("Metric", o, "not found"), null;
}, d = __ENV.ROOT_URL, J = new E(d).hostname, v = __ENV.DEFAULT_PASSWORD || "password";
function y(o, e) {
  let r = c.get(`${d}/directory/structure/admin/list`, {
    headers: l(e)
  });
  return JSON.parse(r.body).filter(
    (t) => t.name === o
  )[0];
}
function te(o, e) {
  let r = c.get(`${d}/directory/structure/${o.id}/users`, {
    headers: l(e)
  });
  if (r.status !== 200)
    throw `Impossible to get users of ${o.id}`;
  return JSON.parse(r.body);
}
function se(o, e) {
  let r = c.get(`${d}/directory/structure/${o.id}/users`, {
    headers: l(e)
  });
  r.status != 200 && g(`Cannot fetch users of structure ${o.id} : ${r}`);
  const t = JSON.parse(r.body);
  for (let s = 0; s < t.length; s++) {
    const n = t[s];
    F(n);
  }
}
function F(o) {
  if (o.code) {
    const e = {};
    e.login = o.login, e.activationCode = o.code, e.password = v, e.confirmPassword = v, e.acceptCGU = "true";
    const r = c.post(`${d}/auth/activation`, e, {
      redirects: 0,
      headers: { Host: J }
    });
    r.status !== 302 && (console.error(r), g(
      `Could not activate user ${o.login} : ${r.status} - ${r.body}`
    ));
  }
}
function ne(o, e, r, t) {
  const n = _(o.id, t).filter(
    (a) => r.indexOf(a.name) >= 0
  );
  for (let a of n)
    if (a.roles.indexOf(e.name) >= 0)
      console.log("Role already attributed to teachers");
    else {
      const i = l(t);
      i["content-type"] = "application/json";
      const f = { headers: i }, p = JSON.stringify({
        groupId: a.id,
        roleIds: (a.roles || []).concat([e.id])
      }), b = c.post(
        `${d}/appregistry/authorize/group?schoolId=${o.id}`,
        p,
        f
      );
      u(b, {
        "link role to structure": (T) => T.status == 200
      });
    }
}
function ce(o, e, r) {
  let t = y(o, r);
  if (t)
    console.log(`Structure ${o} already exists`);
  else {
    const s = l(r);
    s["content-type"] = "application/json";
    const n = JSON.stringify({
      hasApp: e,
      name: o
    });
    let a = c.post(`${d}/directory/school`, n, s);
    a.status !== 201 && (console.error(a.body), g(`Could not create structure ${o}`)), t = y(o, r);
  }
  return t;
}
function ae() {
  const o = N(__ENV.ADMC_LOGIN, __ENV.ADMC_PASSWORD), e = "https://raw.githubusercontent.com/edificeio/edifice-k6-commons/main/data/structure", r = c.get(`${e}/enseignants.csv`).body, t = c.get(`${e}/eleves.csv`).body, s = c.get(`${e}/responsables.csv`).body;
  return j(
    "General",
    {
      teachers: r,
      students: t,
      responsables: s
    },
    o
  );
}
function j(o, e, r) {
  let t = y(o, r);
  if (t)
    console.log("School already exists");
  else {
    const s = new O();
    s.append("type", "CSV"), s.append("structureName", o);
    let n, a, i;
    "teachers" in e ? (n = e.teachers, a = e.students, i = e.responsables) : n = e, s.append("Teacher", c.file(n, "enseignants.csv")), a && s.append("Student", c.file(a, "eleves.csv")), i && s.append("Relative", c.file(i, "responsables.csv"));
    const f = l(r);
    f["Content-Type"] = "multipart/form-data; boundary=" + s.boundary;
    const p = { headers: f };
    c.post(
      `${d}/directory/wizard/import`,
      s.body(),
      p
    ).status != 200 && g(`Could not create structure ${o}`), t = y(o, r);
  }
  return t;
}
function le(o, e, r) {
  let t;
  if ((e.parents || []).map((n) => n.id).indexOf(o.id) >= 0)
    console.log(
      `${e.name} is already a child of ${o.name}`
    ), t = !1;
  else {
    const n = l(r);
    n["content-type"] = "application/json", c.put(
      `${d}/directory/structure/${e.id}/parent/${o.id}`,
      "{}"
    ).status !== 200 && g(
      `Could not attach structure ${e.name} as a child of ${o.name}`
    ), t = !0;
  }
  return t;
}
function ie(o, e, r) {
  const t = new O();
  t.append("type", "CSV"), t.append("structureName", o.name), t.append("structureId", o.id), t.append("structureExternalId", o.externalId);
  let s, n, a;
  "teachers" in e ? (s = e.teachers, n = e.students, a = e.responsables) : s = e, t.append("Teacher", c.file(s, "enseignants.csv")), n && t.append("Student", c.file(n, "eleves.csv")), a && t.append("Relative", c.file(a, "responsables.csv"));
  const i = l(r);
  i["Content-Type"] = "multipart/form-data; boundary=" + t.boundary;
  const f = { headers: i };
  return c.post(
    `${d}/directory/wizard/import`,
    t.body(),
    f
  );
}
function pe(o) {
  const e = l(o);
  return e["content-type"] = "application/json", c.post(`${d}/directory/import`, "{}", { headers: e });
}
const w = __ENV.ROOT_URL;
function R(o, e) {
  let r = c.get(`${w}/appregistry/roles`, {
    headers: l(e)
  });
  return JSON.parse(r.body).filter((s) => s.name === o)[0];
}
function ue(o, e) {
  const r = `${o} - All - Stress Test`;
  let t = R(r, e);
  if (t)
    console.log(`Role ${r} already existed`);
  else {
    let s = c.get(
      `${w}/appregistry/applications/actions?actionType=WORKFLOW`,
      { headers: l(e) }
    );
    u(s, { "get workflow actions": (p) => p.status == 200 });
    const a = JSON.parse(s.body).filter(
      (p) => p.name === o
    )[0].actions.map((p) => p[0]), i = l(e);
    i["content-type"] = "application/json";
    const f = {
      role: r,
      actions: a
    };
    s = c.post(`${w}/appregistry/role`, JSON.stringify(f), {
      headers: i
    }), console.log(s), u(s, { "save role ok": (p) => p.status == 201 }), t = R(r, e);
  }
  return t;
}
function _(o, e) {
  const r = l(e);
  r["Accept-Language"] = "en";
  let t = c.get(
    `${w}/appregistry/groups/roles?structureId=${o}&translate=false`,
    { headers: r }
  );
  return u(t, {
    "get structure roles should be ok": (s) => s.status == 200
  }), JSON.parse(t.body);
}
const G = __ENV.ROOT_URL, de = [
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
], fe = [
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
function ge(o, e) {
  let r = l(e);
  const t = new O();
  t.append("file", c.file(o, "file.txt")), r["Content-Type"] = "multipart/form-data; boundary=" + t.boundary;
  let s = c.post(`${G}/workspace/document`, t.body(), { headers: r });
  return u(s, {
    "upload doc ok": (n) => n.status === 201
  }), JSON.parse(s.body);
}
const B = __ENV.ROOT_URL;
function ke(o, e, r) {
  const t = l(r);
  t["content-type"] = "application/json";
  const s = JSON.stringify(e);
  return c.put(`${B}/workspace/share/resource/${o}`, s, {
    headers: t
  });
}
const L = __ENV.ROOT_URL;
function me(o, e, r) {
  const t = c.post(
    `${L}/communication/v2/group/${o}/communique/${e}`,
    "{}",
    { headers: l(r) }
  );
  return t.status !== 200 && (console.error(
    `Error while adding communication between ${o} -> ${e}`
  ), console.error(t), g(`could not add communication between ${o} -> ${e}`)), t;
}
const $ = __ENV.ROOT_URL;
function he(o, e, r) {
  let t = W(o, e, r);
  if (t)
    console.log("Broadcast group already existed");
  else {
    console.log("Creating broadcast group");
    const s = l(r);
    s["content-type"] = "application/json";
    let n = JSON.stringify({
      name: o,
      structureId: e.id,
      subType: "BroadcastGroup"
    }), a = c.post(`${$}/directory/group`, n, { headers: s });
    u(a, {
      "create broadcast group": (p) => p.status === 201
    });
    const i = JSON.parse(a.body).id;
    n = JSON.stringify({
      name: o,
      autolinkTargetAllStructs: !0,
      autolinkTargetStructs: [],
      autolinkUsersFromGroups: ["Teacher"]
    }), a = c.put(`${$}/directory/group/${i}`, n, { headers: s }), u(a, {
      "set broadcast group for teachers": (p) => p.status === 200
    });
    const f = K(e, r).id;
    V(i, [f], r), t = W(o, e, r);
  }
  return t;
}
function V(o, e, r) {
  const t = l(r);
  t["content-type"] = "application/json";
  for (let s of e) {
    let n = c.post(
      `${$}/communication/v2/group/${s}/communique/${o}`,
      "{}",
      { headers: t }
    );
    n.status !== 200 && (console.error(n), g(`Cannot open comm rule from ${s} to ${o}`));
  }
}
function K(o, e) {
  return S("teachers", o, e);
}
function ye(o, e) {
  return S("students", o, e);
}
function we(o, e) {
  return S("relatives", o, e);
}
function S(o, e, r) {
  return _(e.id, r).filter((s) => {
    const n = s.name.toLowerCase();
    return n === `${e.name} group ${o}.`.toLowerCase() || n === `${o} from group ${e.name}.`.toLowerCase();
  })[0];
}
function W(o, e, r) {
  const t = l(r);
  t["content-type"] = "application/json";
  let s = c.get(
    `${$}/directory/group/admin/list?translate=false&structureId=${e.id}`,
    { headers: t }
  );
  return JSON.parse(s.body).filter(
    (n) => n.subType === "BroadcastGroup" && n.name === o
  )[0];
}
function $e(o, e, r = 200) {
  const t = r || 200;
  o.status != t && (console.error(`ko - ${e}. Expecting ${t} but got ${o.status}`), console.error(o), g(e + " ko"));
}
function Ce(o, e) {
  const r = {};
  r[e] = () => o, u({}, r) || g(e);
}
export {
  I as BASE_URL,
  C as Session,
  h as SessionMode,
  de as WS_MANAGER_SHARE,
  fe as WS_READER_SHARE,
  F as activateUser,
  se as activateUsers,
  V as addCommRuleToGroup,
  me as addCommunicationBetweenGroups,
  Ce as assertCondition,
  $e as assertOk,
  le as attachStructureAsChild,
  Z as authenticateOAuth2,
  N as authenticateWeb,
  oe as checkStatus,
  ue as createAndSetRole,
  he as createBroadcastGroup,
  ae as createDefaultStructure,
  ce as createEmptyStructure,
  j as createStructure,
  W as getBroadcastGroup,
  Y as getConnectedUserId,
  l as getHeaders,
  re as getMetricValue,
  we as getParentRole,
  S as getProfileGroupOfStructure,
  x as getRandomUser,
  ee as getRandomUserWithProfile,
  R as getRoleByName,
  _ as getRolesOfStructure,
  y as getSchoolByName,
  ye as getStudentRole,
  K as getTeacherRole,
  te as getUsersOfSchool,
  ie as importUsers,
  ne as linkRoleToUsers,
  q as searchUser,
  ke as shareFile,
  Q as switchSession,
  pe as triggerImport,
  ge as uploadFile
};
