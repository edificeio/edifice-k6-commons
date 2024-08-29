var T = Object.defineProperty;
var I = (o, e, t) => e in o ? T(o, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : o[e] = t;
var m = (o, e, t) => (I(o, typeof e != "symbol" ? e + "" : e, t), t);
import c from "k6/http";
import { check as d, fail as g } from "k6";
import { FormData as O } from "https://jslib.k6.io/formdata/0.0.2/index.js";
import { URL as W } from "https://jslib.k6.io/url/1.0.0/index.js";
const h = {
  COOKIE: 0,
  OAUTH2: 1
};
class C {
  constructor(e, t, r, s) {
    m(this, "expiresAt");
    m(this, "token");
    m(this, "mode");
    m(this, "cookies");
    this.token = e, this.mode = t, this.cookies = s, this.expiresAt = Date.now() + r * 1e3 - 3e3;
  }
  static from(e) {
    const t = new C(e.token, e.mode, 0, e.cookies);
    return t.expiresAt = e.expiresAt, t;
  }
  isExpired() {
    return this.expiresAt <= Date.now();
  }
  getCookie(e) {
    return this.cookies ? this.cookies.filter((t) => t.name === e).map((t) => t.value)[0] : null;
  }
}
const U = __ENV.BASE_URL, N = 30 * 60, k = __ENV.ROOT_URL, l = function(o) {
  let e;
  return o ? o.mode === h.COOKIE ? e = { "x-xsrf-token": o.getCookie("XSRF-TOKEN") || "" } : o.mode === h.OAUTH2 ? e = { Authorization: `Bearer ${o.token}` } : e = {} : e = {}, e;
}, ee = function(o, e) {
  const t = c.get(`${k}/conversation/visible?search=${o}`, {
    headers: l(e)
  });
  return d(t, {
    "should get an OK response": (s) => s.status == 200
  }), t.json("users")[0].id;
}, oe = function(o) {
  const e = c.get(`${k}/auth/oauth2/userinfo`, {
    headers: l(o)
  });
  return d(e, {
    "should get an OK response": (t) => t.status == 200,
    "should get a valid userId": (t) => !!t.json("userId")
  }), e.json("userId");
}, D = function(o, e) {
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
  if (d(s, {
    "should redirect connected user to login page": (a) => a.status === 302,
    "should have set an auth cookie": (a) => a.cookies.oneSessionId !== null && a.cookies.oneSessionId !== void 0
  }), !s.cookies.oneSessionId)
    return console.error(`Could not get oneSessionId for ${o}`), null;
  t.set(k, "oneSessionId", s.cookies.oneSessionId[0].value);
  const n = Object.keys(s.cookies).map((a) => ({ name: a, value: s.cookies[a][0].value }));
  return new C(
    s.cookies.oneSessionId[0].value,
    h.COOKIE,
    N,
    n
  );
}, te = function(o) {
  console.log("Removing session", o), c.cookieJar().clear(k);
}, re = function(o) {
  const e = c.cookieJar();
  return e.set(k, "oneSessionId", o.token), e.set(k, "XSRF-TOKEN", o.getCookie("XSRF-TOKEN") || ""), o;
}, se = function(o, e, t, r) {
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
  d(n, {
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
  const t = (e || []).map((r) => r.id);
  for (let r = 0; r < 1e3; r++) {
    const s = o[Math.floor(Math.random() * o.length)];
    if (t.indexOf(s.id) < 0)
      return s;
  }
  throw "cannot.find.random.user";
}
function ne(o, e, t) {
  const r = o.filter((s) => s.type === e);
  return x(r, t);
}
function ce(o, e, t) {
  const r = {};
  r[e] = (n) => n.status === t;
  const s = d(o, r);
  return s || console.error(e, o), s;
}
const ae = function(o, e) {
  const t = c.get(`${U}/metrics`, {
    headers: l(e)
  });
  d(t, {
    "should get an OK response": (s) => s.status == 200
  });
  const r = t.body.split(`
`);
  for (let s of r)
    if (s.indexOf(`${o} `) === 0)
      return parseFloat(s.substring(o.length + 1).trim());
  return console.error("Metric", o, "not found"), null;
}, u = __ENV.ROOT_URL, J = new W(u).hostname, b = __ENV.DEFAULT_PASSWORD || "password";
function y(o, e) {
  let t = c.get(`${u}/directory/structure/admin/list`, {
    headers: l(e)
  });
  return JSON.parse(t.body).filter(
    (r) => r.name === o
  )[0];
}
function le(o, e) {
  let t = c.get(`${u}/directory/structure/${o.id}/users`, {
    headers: l(e)
  });
  if (t.status !== 200)
    throw `Impossible to get users of ${o.id}`;
  return JSON.parse(t.body);
}
function F(o, e) {
  let t = c.get(`${u}/directory/structure/${o.id}/users`, {
    headers: l(e)
  });
  t.status != 200 && g(`Cannot fetch users of structure ${o.id} : ${t}`);
  const r = JSON.parse(t.body);
  for (let s = 0; s < r.length; s++) {
    const n = r[s];
    L(n);
  }
}
function L(o) {
  if (o.code) {
    const e = {};
    e.login = o.login, e.activationCode = o.code, e.password = b, e.confirmPassword = b, e.acceptCGU = "true";
    const t = c.post(`${u}/auth/activation`, e, {
      redirects: 0,
      headers: { Host: J }
    });
    t.status !== 302 && (console.error(t), g(
      `Could not activate user ${o.login} : ${t.status} - ${t.body}`
    ));
  }
}
function ie(o, e, t, r) {
  const n = A(o.id, r).filter(
    (a) => t.indexOf(a.name) >= 0
  );
  for (let a of n)
    if (a.roles.indexOf(e.name) >= 0)
      console.log("Role already attributed to teachers");
    else {
      const i = l(r);
      i["content-type"] = "application/json";
      const f = { headers: i }, p = JSON.stringify({
        groupId: a.id,
        roleIds: (a.roles || []).concat([e.id])
      }), _ = c.post(
        `${u}/appregistry/authorize/group?schoolId=${o.id}`,
        p,
        f
      );
      d(_, {
        "link role to structure": (E) => E.status == 200
      });
    }
}
function pe(o, e, t) {
  let r = y(o, t);
  if (r)
    console.log(`Structure ${o} already exists`);
  else {
    const s = l(t);
    s["content-type"] = "application/json";
    const n = JSON.stringify({
      hasApp: e,
      name: o
    });
    let a = c.post(`${u}/directory/school`, n, s);
    a.status !== 201 && (console.error(a.body), g(`Could not create structure ${o}`)), r = y(o, t);
  }
  return r;
}
function ue(o) {
  const e = D(__ENV.ADMC_LOGIN, __ENV.ADMC_PASSWORD), t = j(o);
  return F(t, e), t;
}
function j(o) {
  const e = o || "General", t = D(__ENV.ADMC_LOGIN, __ENV.ADMC_PASSWORD), r = "https://raw.githubusercontent.com/edificeio/edifice-k6-commons/main/data/structure", s = c.get(`${r}/enseignants.csv`).body, n = c.get(`${r}/eleves.csv`).body, a = c.get(`${r}/responsables.csv`).body;
  return P(
    e,
    {
      teachers: s,
      students: n,
      responsables: a
    },
    t
  );
}
function P(o, e, t) {
  let r = y(o, t);
  if (r)
    console.log("School already exists");
  else {
    const s = new O();
    s.append("type", "CSV"), s.append("structureName", o);
    let n, a, i;
    "teachers" in e ? (n = e.teachers, a = e.students, i = e.responsables) : n = e, s.append("Teacher", c.file(n, "enseignants.csv")), a && s.append("Student", c.file(a, "eleves.csv")), i && s.append("Relative", c.file(i, "responsables.csv"));
    const f = l(t);
    f["Content-Type"] = "multipart/form-data; boundary=" + s.boundary;
    const p = { headers: f };
    c.post(
      `${u}/directory/wizard/import`,
      s.body(),
      p
    ).status != 200 && g(`Could not create structure ${o}`), r = y(o, t);
  }
  return r;
}
function de(o, e, t) {
  let r;
  if ((e.parents || []).map((n) => n.id).indexOf(o.id) >= 0)
    console.log(
      `${e.name} is already a child of ${o.name}`
    ), r = !1;
  else {
    const n = l(t);
    n["content-type"] = "application/json", c.put(
      `${u}/directory/structure/${e.id}/parent/${o.id}`,
      "{}"
    ).status !== 200 && g(
      `Could not attach structure ${e.name} as a child of ${o.name}`
    ), r = !0;
  }
  return r;
}
function fe(o, e, t) {
  const r = new O();
  r.append("type", "CSV"), r.append("structureName", o.name), r.append("structureId", o.id), r.append("structureExternalId", o.externalId);
  let s, n, a;
  "teachers" in e ? (s = e.teachers, n = e.students, a = e.responsables) : s = e, r.append("Teacher", c.file(s, "enseignants.csv")), n && r.append("Student", c.file(n, "eleves.csv")), a && r.append("Relative", c.file(a, "responsables.csv"));
  const i = l(t);
  i["Content-Type"] = "multipart/form-data; boundary=" + r.boundary;
  const f = { headers: i };
  return c.post(
    `${u}/directory/wizard/import`,
    r.body(),
    f
  );
}
function ge(o) {
  const e = l(o);
  return e["content-type"] = "application/json", c.post(`${u}/directory/import`, "{}", { headers: e });
}
function V(o, e, t) {
  const r = l(t);
  r["content-type"] = "application/json";
  const s = JSON.stringify({
    name: o,
    structureId: e.id
  });
  return c.post(`${u}/directory/positions`, s, {
    redirects: 0,
    headers: r
  });
}
function ke(o, e) {
  const t = l(e);
  return t["content-type"] = "application/json", c.del(`${u}/directory/positions/${o}`, null, {
    redirects: 0,
    headers: t
  });
}
function me(o, e, t) {
  const r = V(o, e, t);
  return r.status !== 201 && (console.error(r), g(
    `Could not create position ${o} on structure ${e.name}`
  )), JSON.parse(r.body);
}
function he(o, e) {
  const t = l(e), r = new W(`${u}/directory/positions`);
  return r.searchParams.append("prefix", o), c.get(r.toString(), { headers: t });
}
function ye(o, e, t) {
  const r = l(t);
  r["content-type"] = "application/json";
  const s = JSON.stringify({
    functionCode: "ADMIN_LOCAL",
    inherit: "s",
    scope: [e.id]
  });
  let n = c.post(
    `${u}/directory/user/function/${o.id}`,
    s,
    { headers: r }
  );
  return z(n, "user should be made ADML"), n;
}
const $ = __ENV.ROOT_URL;
function R(o, e) {
  let t = c.get(`${$}/appregistry/roles`, {
    headers: l(e)
  });
  return JSON.parse(t.body).filter((s) => s.name === o)[0];
}
function $e(o, e) {
  const t = `${o} - All - Stress Test`;
  let r = R(t, e);
  if (r)
    console.log(`Role ${t} already existed`);
  else {
    let s = c.get(
      `${$}/appregistry/applications/actions?actionType=WORKFLOW`,
      { headers: l(e) }
    );
    d(s, { "get workflow actions": (p) => p.status == 200 });
    const a = JSON.parse(s.body).filter(
      (p) => p.name === o
    )[0].actions.map((p) => p[0]), i = l(e);
    i["content-type"] = "application/json";
    const f = {
      role: t,
      actions: a
    };
    s = c.post(`${$}/appregistry/role`, JSON.stringify(f), {
      headers: i
    }), console.log(s), d(s, { "save role ok": (p) => p.status == 201 }), r = R(t, e);
  }
  return r;
}
function A(o, e) {
  const t = l(e);
  t["Accept-Language"] = "en";
  let r = c.get(
    `${$}/appregistry/groups/roles?structureId=${o}&translate=false`,
    { headers: t }
  );
  return d(r, {
    "get structure roles should be ok": (s) => s.status == 200
  }), JSON.parse(r.body);
}
const G = __ENV.ROOT_URL, we = [
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
], Ce = [
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
function Oe(o, e) {
  let t = l(e);
  const r = new O();
  r.append("file", c.file(o, "file.txt")), t["Content-Type"] = "multipart/form-data; boundary=" + r.boundary;
  let s = c.post(`${G}/workspace/document`, r.body(), { headers: t });
  return d(s, {
    "upload doc ok": (n) => n.status === 201
  }), JSON.parse(s.body);
}
const B = __ENV.ROOT_URL;
function Se(o, e, t) {
  const r = l(t);
  r["content-type"] = "application/json";
  const s = JSON.stringify(e);
  return c.put(`${B}/workspace/share/resource/${o}`, s, {
    headers: r
  });
}
const M = __ENV.ROOT_URL;
function _e(o, e, t) {
  const r = c.post(
    `${M}/communication/v2/group/${o}/communique/${e}`,
    "{}",
    { headers: l(t) }
  );
  return r.status !== 200 && (console.error(
    `Error while adding communication between ${o} -> ${e}`
  ), console.error(r), g(`could not add communication between ${o} -> ${e}`)), r;
}
const w = __ENV.ROOT_URL;
function be(o, e, t) {
  let r = v(o, e, t);
  if (r)
    console.log("Broadcast group already existed");
  else {
    console.log("Creating broadcast group");
    const s = l(t);
    s["content-type"] = "application/json";
    let n = JSON.stringify({
      name: o,
      structureId: e.id,
      subType: "BroadcastGroup"
    }), a = c.post(`${w}/directory/group`, n, { headers: s });
    d(a, {
      "create broadcast group": (p) => p.status === 201
    });
    const i = JSON.parse(a.body).id;
    n = JSON.stringify({
      name: o,
      autolinkTargetAllStructs: !0,
      autolinkTargetStructs: [],
      autolinkUsersFromGroups: ["Teacher"]
    }), a = c.put(`${w}/directory/group/${i}`, n, { headers: s }), d(a, {
      "set broadcast group for teachers": (p) => p.status === 200
    });
    const f = H(e, t).id;
    K(i, [f], t), r = v(o, e, t);
  }
  return r;
}
function K(o, e, t) {
  const r = l(t);
  r["content-type"] = "application/json";
  for (let s of e) {
    let n = c.post(
      `${w}/communication/v2/group/${s}/communique/${o}`,
      "{}",
      { headers: r }
    );
    n.status !== 200 && (console.error(n), g(`Cannot open comm rule from ${s} to ${o}`));
  }
}
function H(o, e) {
  return S("teachers", o, e);
}
function Re(o, e) {
  return S("students", o, e);
}
function ve(o, e) {
  return S("relatives", o, e);
}
function S(o, e, t) {
  return A(e.id, t).filter((s) => {
    const n = s.name.toLowerCase();
    return n === `${e.name} group ${o}.`.toLowerCase() || n === `${o} from group ${e.name}.`.toLowerCase();
  })[0];
}
function v(o, e, t) {
  const r = l(t);
  r["content-type"] = "application/json";
  let s = c.get(
    `${w}/directory/group/admin/list?translate=false&structureId=${e.id}`,
    { headers: r }
  );
  return JSON.parse(s.body).filter(
    (n) => n.subType === "BroadcastGroup" && n.name === o
  )[0];
}
function z(o, e, t = 200) {
  const r = t || 200;
  o.status != r && (console.error(`ko - ${e}. Expecting ${r} but got ${o.status}`), console.error(o), g(e + " ko"));
}
function We(o, e) {
  const t = {};
  t[e] = () => o, d({}, t) || g(e);
}
export {
  U as BASE_URL,
  C as Session,
  h as SessionMode,
  we as WS_MANAGER_SHARE,
  Ce as WS_READER_SHARE,
  L as activateUser,
  F as activateUsers,
  K as addCommRuleToGroup,
  _e as addCommunicationBetweenGroups,
  We as assertCondition,
  z as assertOk,
  de as attachStructureAsChild,
  se as authenticateOAuth2,
  D as authenticateWeb,
  ce as checkStatus,
  $e as createAndSetRole,
  be as createBroadcastGroup,
  j as createDefaultStructure,
  pe as createEmptyStructure,
  V as createPosition,
  me as createPositionOrFail,
  P as createStructure,
  ke as deletePosition,
  v as getBroadcastGroup,
  oe as getConnectedUserId,
  l as getHeaders,
  ae as getMetricValue,
  ve as getParentRole,
  S as getProfileGroupOfStructure,
  x as getRandomUser,
  ne as getRandomUserWithProfile,
  R as getRoleByName,
  A as getRolesOfStructure,
  y as getSchoolByName,
  Re as getStudentRole,
  H as getTeacherRole,
  le as getUsersOfSchool,
  fe as importUsers,
  ue as initStructure,
  ie as linkRoleToUsers,
  te as logout,
  ye as makeAdml,
  he as searchPositions,
  ee as searchUser,
  Se as shareFile,
  re as switchSession,
  ge as triggerImport,
  Oe as uploadFile
};
