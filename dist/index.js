var E = Object.defineProperty;
var U = (o, e, t) => e in o ? E(o, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : o[e] = t;
var y = (o, e, t) => (U(o, typeof e != "symbol" ? e + "" : e, t), t);
import n from "k6/http";
import { check as f, fail as k } from "k6";
import { FormData as S } from "https://jslib.k6.io/formdata/0.0.2/index.js";
import { URL as v } from "https://jslib.k6.io/url/1.0.0/index.js";
const $ = {
  COOKIE: 0,
  OAUTH2: 1
};
class w {
  constructor(e, t, r, s) {
    y(this, "expiresAt");
    y(this, "token");
    y(this, "mode");
    y(this, "cookies");
    this.token = e, this.mode = t, this.cookies = s, this.expiresAt = Date.now() + r * 1e3 - 3e3;
  }
  static from(e) {
    const t = new w(e.token, e.mode, 0, e.cookies);
    return t.expiresAt = e.expiresAt, t;
  }
  isExpired() {
    return this.expiresAt <= Date.now();
  }
  getCookie(e) {
    return this.cookies ? this.cookies.filter((t) => t.name === e).map((t) => t.value)[0] : null;
  }
}
const J = __ENV.BASE_URL, x = 30 * 60, g = __ENV.ROOT_URL, l = function(o) {
  let e;
  return o ? o.mode === $.COOKIE ? e = { "x-xsrf-token": o.getCookie("XSRF-TOKEN") || "" } : o.mode === $.OAUTH2 ? e = { Authorization: `Bearer ${o.token}` } : e = {} : e = {}, e;
}, ie = function(o, e) {
  const t = n.get(`${g}/conversation/visible?search=${o}`, {
    headers: l(e)
  });
  return f(t, {
    "should get an OK response": (s) => s.status == 200
  }), t.json("users")[0].id;
}, ue = function(o) {
  const e = n.get(`${g}/auth/oauth2/userinfo`, {
    headers: l(o)
  });
  return f(e, {
    "should get an OK response": (t) => t.status == 200,
    "should get a valid userId": (t) => !!t.json("userId")
  }), e.json("userId");
}, I = function(o, e) {
  const t = n.cookieJar();
  t.clear(g);
  let r = {
    email: o,
    password: e || __ENV.DEFAULT_PASSWORD,
    callBack: "",
    detail: ""
  };
  const s = n.post(`${g}/auth/login`, r, {
    redirects: 0
  });
  if (s.status !== 302 && k("should redirect connected user to login page"), (s.cookies.oneSessionId === null || s.cookies.oneSessionId === void 0) && k("login process should have set an auth cookie"), !s.cookies.oneSessionId)
    return console.error(`Could not get oneSessionId for ${o}`), null;
  t.set(g, "oneSessionId", s.cookies.oneSessionId[0].value);
  const c = Object.keys(s.cookies).map((a) => ({ name: a, value: s.cookies[a][0].value }));
  return new w(
    s.cookies.oneSessionId[0].value,
    $.COOKIE,
    x,
    c
  );
}, pe = function(o) {
  const e = n.get(`${g}/auth/logout?callback=/`, {
    headers: l(o)
  });
  return n.cookieJar().clear(g), e;
}, de = function(o) {
  const e = n.cookieJar();
  return o ? (e.set(g, "oneSessionId", o.token), e.set(g, "XSRF-TOKEN", o.getCookie("XSRF-TOKEN") || "")) : (e.delete(g, "oneSessionId"), e.delete(g, "XSRF-TOKEN")), o;
}, fe = function(o, e, t, r) {
  let s = {
    grant_type: "password",
    username: o,
    password: e,
    client_id: t,
    client_secret: r,
    scope: "timeline userbook blog lvs actualites pronote schoolbook support viescolaire zimbra conversation directory homeworks userinfo workspace portal cas sso presences incidents competences diary edt infra auth"
  }, c = n.post(`${g}/auth/oauth2/token`, s, {
    redirects: 0
  });
  f(c, {
    "should get an OK response for authentication": (i) => i.status == 200,
    "should have set an access token": (i) => !!i.json("access_token")
  });
  const a = c.json("access_token");
  return new w(
    a,
    $.OAUTH2,
    c.json("expires_in")
  );
};
function A(o, e) {
  const t = (e || []).map((r) => r.id);
  for (let r = 0; r < 1e3; r++) {
    const s = o[Math.floor(Math.random() * o.length)];
    if (t.indexOf(s.id) < 0)
      return s;
  }
  throw "cannot.find.random.user";
}
function L(o, e, t) {
  const r = o.filter((s) => s.type === e);
  return A(r, t);
}
function ge(o, e, t) {
  const r = {};
  r[e] = (c) => c.status === t;
  const s = f(o, r);
  return s || console.error(e, o), s;
}
function ke(o, e) {
  let t = n.get(`${g}/directory/user/${o}?manual-groups=true`, {
    headers: l(e)
  });
  return t.status !== 200 && (console.error(t), k("Could not get user profile")), JSON.parse(t.body);
}
const me = function(o, e) {
  const t = n.get(`${J}/metrics`, {
    headers: l(e)
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
}, h = __ENV.ROOT_URL, P = "AdminLocal";
function he(o, e, t) {
  let r = _(o, e, t);
  if (r)
    console.log("Broadcast group already existed");
  else {
    console.log("Creating broadcast group");
    const s = l(t);
    s["content-type"] = "application/json";
    let c = JSON.stringify({
      name: o,
      structureId: e.id,
      subType: "BroadcastGroup"
    }), a = n.post(`${h}/directory/group`, c, { headers: s });
    f(a, {
      "create broadcast group": (u) => u.status === 201
    });
    const i = JSON.parse(a.body).id;
    c = JSON.stringify({
      name: o,
      autolinkTargetAllStructs: !0,
      autolinkTargetStructs: [],
      autolinkUsersFromGroups: ["Teacher"]
    }), a = n.put(`${h}/directory/group/${i}`, c, { headers: s }), f(a, {
      "set broadcast group for teachers": (u) => u.status === 200
    });
    const p = G(e, t).id;
    F(i, [p], t), r = _(o, e, t);
  }
  return r;
}
function F(o, e, t) {
  const r = l(t);
  r["content-type"] = "application/json";
  for (let s of e) {
    let c = n.post(
      `${h}/communication/v2/group/${s}/communique/${o}`,
      "{}",
      { headers: r }
    );
    c.status !== 200 && (console.error(c), k(`Cannot open comm rule from ${s} to ${o}`));
  }
}
function G(o, e) {
  return b("teachers", o, e);
}
function ye(o, e) {
  return b("students", o, e);
}
function $e(o, e) {
  return b("relatives", o, e);
}
function b(o, e, t) {
  return D(e.id, t).filter((s) => {
    const c = s.name.toLowerCase();
    return c === `${e.name} group ${o}.`.toLowerCase() || c === `${o} from group ${e.name}.`.toLowerCase();
  })[0];
}
function j(o, e) {
  const t = l(e);
  t["Accept-Language"] = "en";
  let r = n.get(
    `${h}/directory/group/admin/list?structureId=${o}&translate=false`,
    { headers: t }
  );
  return f(r, {
    "get structure profile groups should be ok": (s) => s.status == 200
  }), JSON.parse(r.body);
}
function _(o, e, t) {
  const r = l(t);
  r["content-type"] = "application/json";
  let s = n.get(
    `${h}/directory/group/admin/list?translate=false&structureId=${e.id}`,
    { headers: r }
  );
  return JSON.parse(s.body).filter(
    (c) => c.subType === "BroadcastGroup" && c.name === o
  )[0];
}
function V(o, e) {
  const t = l(e);
  t["content-type"] = "application/json";
  let r = n.get(
    `${h}/directory/user/admin/list?groupId=${o}`,
    { headers: t }
  );
  return JSON.parse(r.body);
}
const d = __ENV.ROOT_URL, M = new v(d).hostname, R = __ENV.DEFAULT_PASSWORD || "password";
function O(o, e) {
  let t = n.get(`${d}/directory/structure/admin/list`, {
    headers: l(e)
  });
  return JSON.parse(t.body).filter(
    (r) => r.name === o
  )[0];
}
function B(o, e) {
  let t = n.get(`${d}/directory/structure/${o.id}/users`, {
    headers: l(e)
  });
  if (t.status !== 200)
    throw `Impossible to get users of ${o.id}`;
  return JSON.parse(t.body);
}
function K(o, e) {
  let t = n.get(`${d}/directory/structure/${o.id}/users`, {
    headers: l(e)
  });
  t.status != 200 && k(`Cannot fetch users of structure ${o.id} : ${t}`);
  const r = JSON.parse(t.body);
  for (let s = 0; s < r.length; s++) {
    const c = r[s];
    H(c);
  }
}
function H(o) {
  if (o.code) {
    const e = {};
    e.login = o.login, e.activationCode = o.code, e.password = R, e.confirmPassword = R, e.acceptCGU = "true";
    const t = n.post(`${d}/auth/activation`, e, {
      redirects: 0,
      headers: { Host: M }
    });
    t.status !== 302 && (console.error(t), k(
      `Could not activate user ${o.login} : ${t.status} - ${t.body}`
    ));
  }
}
function Oe(o, e, t, r) {
  const c = D(o.id, r).filter(
    (a) => t.indexOf(a.name) >= 0
  );
  for (let a of c)
    if (a.roles.indexOf(e.name) >= 0)
      console.log("Role already attributed to teachers");
    else {
      const i = l(r);
      i["content-type"] = "application/json";
      const p = { headers: i }, u = JSON.stringify({
        groupId: a.id,
        roleIds: (a.roles || []).concat([e.id])
      }), m = n.post(
        `${d}/appregistry/authorize/group?schoolId=${o.id}`,
        u,
        p
      );
      f(m, {
        "link role to structure": (N) => N.status == 200
      });
    }
}
function Ce(o, e, t) {
  let r = O(o, t);
  if (r)
    console.log(`Structure ${o} already exists`);
  else {
    const s = l(t);
    s["content-type"] = "application/json";
    const c = JSON.stringify({
      hasApp: e,
      name: o
    });
    let a = n.post(`${d}/directory/school`, c, s);
    a.status !== 201 && (console.error(a.body), k(`Could not create structure ${o}`)), r = O(o, t);
  }
  return r;
}
function we(o, e = "default") {
  const t = I(__ENV.ADMC_LOGIN, __ENV.ADMC_PASSWORD), r = z(o, e);
  return K(r, t), r;
}
function z(o, e = "default") {
  const t = o || "General", r = I(__ENV.ADMC_LOGIN, __ENV.ADMC_PASSWORD), s = "https://raw.githubusercontent.com/edificeio/edifice-k6-commons/develop/data/structure", c = n.get(`${s}/enseignants.${e}.csv`).body, a = n.get(`${s}/eleves.${e}.csv`).body, i = n.get(`${s}/responsables.${e}.csv`).body;
  return X(
    t,
    {
      teachers: c,
      students: a,
      responsables: i
    },
    r
  );
}
function X(o, e, t) {
  let r = O(o, t);
  if (r)
    console.log("School already exists");
  else {
    const s = new S();
    s.append("type", "CSV"), s.append("structureName", o);
    let c, a, i;
    "teachers" in e ? (c = e.teachers, a = e.students, i = e.responsables) : c = e, s.append("Teacher", n.file(c, "enseignants.csv")), a && s.append("Student", n.file(a, "eleves.csv")), i && s.append("Relative", n.file(i, "responsables.csv"));
    const p = l(t);
    p["Content-Type"] = "multipart/form-data; boundary=" + s.boundary;
    const u = { headers: p };
    n.post(
      `${d}/directory/wizard/import`,
      s.body(),
      u
    ).status != 200 && k(`Could not create structure ${o}`), r = O(o, t);
  }
  return r;
}
function Se(o, e, t) {
  let r;
  if ((e.parents || []).map((c) => c.id).indexOf(o.id) >= 0)
    console.log(
      `${e.name} is already a child of ${o.name}`
    ), r = !1;
  else {
    const c = l(t);
    c["content-type"] = "application/json", n.put(
      `${d}/directory/structure/${e.id}/parent/${o.id}`,
      "{}"
    ).status !== 200 && k(
      `Could not attach structure ${e.name} as a child of ${o.name}`
    ), r = !0;
  }
  return r;
}
function be(o, e, t) {
  const r = new S();
  r.append("type", "CSV"), r.append("structureName", o.name), r.append("structureId", o.id), r.append("structureExternalId", o.externalId);
  let s, c, a;
  "teachers" in e ? (s = e.teachers, c = e.students, a = e.responsables) : s = e, r.append("Teacher", n.file(s, "enseignants.csv")), c && r.append("Student", n.file(c, "eleves.csv")), a && r.append("Relative", n.file(a, "responsables.csv"));
  const i = l(t);
  i["Content-Type"] = "multipart/form-data; boundary=" + r.boundary;
  const p = { headers: i };
  return n.post(
    `${d}/directory/wizard/import`,
    r.body(),
    p
  );
}
function _e(o) {
  const e = l(o);
  return e["content-type"] = "application/json", n.post(`${d}/directory/import`, "{}", { headers: e });
}
function T(o, e, t) {
  const r = l(t);
  r["content-type"] = "application/json";
  const s = JSON.stringify({
    name: o,
    structureId: e.id
  });
  return n.post(`${d}/directory/positions`, s, {
    redirects: 0,
    headers: r
  });
}
function Re(o, e, t) {
  let r = T(o, e, t);
  if (r.status === 409) {
    const s = JSON.parse(
      r.body
    ).existingPositionId;
    return q(s, t);
  } else
    return JSON.parse(r.body);
}
function We(o, e, t) {
  const r = l(t);
  r["content-type"] = "application/json";
  const s = {};
  return e != null && (s.positionIds = e.map((a) => a.id)), n.put(
    `${d}/directory/user/${o.id}`,
    JSON.stringify(s),
    {
      headers: r
    }
  );
}
function ve(o, e) {
  const t = l(e);
  return t["content-type"] = "application/json", n.del(`${d}/directory/positions/${o}`, null, {
    redirects: 0,
    headers: t
  });
}
function q(o, e) {
  let t = n.get(`${d}/directory/positions/${o}`, {
    headers: l(e)
  });
  return JSON.parse(t.body);
}
function Ie(o, e, t) {
  const r = T(o, e, t);
  return r.status !== 201 && (console.error(r), k(
    `Could not create position ${o} on structure ${e.name}`
  )), JSON.parse(r.body);
}
function Ae(o, e) {
  const t = l(e), r = new v(`${d}/directory/positions`);
  return r.searchParams.append("prefix", o), n.get(r.toString(), { headers: t });
}
function Y(o, e, t) {
  const r = l(t);
  r["content-type"] = "application/json";
  const s = JSON.stringify({
    functionCode: "ADMIN_LOCAL",
    inherit: "s",
    scope: [e.id]
  });
  let c = n.post(
    `${d}/directory/user/function/${o.id}`,
    s,
    { headers: r }
  );
  return oe(c, "user should be made ADML"), c;
}
function Te(o, e, t, r, s) {
  const a = j(
    o.id,
    s
  ).filter(
    (p) => p.filter === P
  )[0];
  let i;
  if (a) {
    const p = V(
      a.id,
      s
    );
    i = e ? p.filter((u) => u.type === e) : p;
  } else
    i = [];
  if (r && r.length > 0) {
    const p = r.map((u) => u.id);
    i = i.filter((u) => p.indexOf(u.id) < 0);
  }
  if (i.length < t) {
    const p = B(o, s);
    for (let u = i.length; u < t; u++) {
      let m;
      e ? m = L(p, e, i) : m = A(p, i), console.log(
        `Turning ${m.login} into an ADML of ${o.id} - ${o.name}`
      ), Y(m, o, s), i.push(m);
    }
  }
  return i.slice(0, t);
}
const C = __ENV.ROOT_URL;
function W(o, e) {
  let t = n.get(`${C}/appregistry/roles`, {
    headers: l(e)
  });
  return JSON.parse(t.body).filter((s) => s.name === o)[0];
}
function De(o, e) {
  const t = `${o} - All - Stress Test`;
  let r = W(t, e);
  if (r)
    console.log(`Role ${t} already existed`);
  else {
    let s = n.get(
      `${C}/appregistry/applications/actions?actionType=WORKFLOW`,
      { headers: l(e) }
    );
    f(s, { "get workflow actions": (u) => u.status == 200 });
    const a = JSON.parse(s.body).filter(
      (u) => u.name === o
    )[0].actions.map((u) => u[0]), i = l(e);
    i["content-type"] = "application/json";
    const p = {
      role: t,
      actions: a
    };
    s = n.post(`${C}/appregistry/role`, JSON.stringify(p), {
      headers: i
    }), console.log(s), f(s, { "save role ok": (u) => u.status == 201 }), r = W(t, e);
  }
  return r;
}
function D(o, e) {
  const t = l(e);
  t["Accept-Language"] = "en";
  let r = n.get(
    `${C}/appregistry/groups/roles?structureId=${o}&translate=false`,
    { headers: t }
  );
  return f(r, {
    "get structure roles should be ok": (s) => s.status == 200
  }), JSON.parse(r.body);
}
const Q = __ENV.ROOT_URL, Ne = [
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
function Ue(o, e) {
  let t = l(e);
  const r = new S();
  r.append("file", n.file(o, "file.txt")), t["Content-Type"] = "multipart/form-data; boundary=" + r.boundary;
  let s = n.post(`${Q}/workspace/document`, r.body(), { headers: t });
  return f(s, {
    "upload doc ok": (c) => c.status === 201
  }), JSON.parse(s.body);
}
const Z = __ENV.ROOT_URL;
function Je(o, e, t) {
  const r = l(t);
  r["content-type"] = "application/json";
  const s = JSON.stringify(e);
  return n.put(`${Z}/workspace/share/resource/${o}`, s, {
    headers: r
  });
}
const ee = __ENV.ROOT_URL;
function xe(o, e, t) {
  const r = n.post(
    `${ee}/communication/v2/group/${o}/communique/${e}`,
    "{}",
    { headers: l(t) }
  );
  return r.status !== 200 && (console.error(
    `Error while adding communication between ${o} -> ${e}`
  ), console.error(r), k(`could not add communication between ${o} -> ${e}`)), r;
}
function oe(o, e, t = 200) {
  const r = t || 200;
  o.status != r && (console.error(`ko - ${e}. Expecting ${r} but got ${o.status}`), console.error(o), k(e + " ko"));
}
function Le(o, e, t = 500) {
  te(
    () => o && o.code === t,
    `[${o.request.method}]${o.url} returns code ${t}: ${e} `
  );
}
function Pe(o, e, t = 500) {
  const r = {};
  return r[`${e} (expects ${t})`] = () => {
    const s = o && o.status === t;
    return s || (console.warn("Expected ", t, " but got ", o.status), console.warn(o)), s;
  }, f({}, r);
}
function te(o, e) {
  const t = {};
  t[e] = () => o, f({}, t) || k(e);
}
const re = __ENV.ROOT_URL;
function Fe(o) {
  let e = n.get(`${re}/userbook/search/criteria`, {
    headers: l(o)
  });
  return JSON.parse(e.body);
}
export {
  P as ADML_FILTER,
  J as BASE_URL,
  w as Session,
  $ as SessionMode,
  Ne as WS_MANAGER_SHARE,
  Ee as WS_READER_SHARE,
  H as activateUser,
  K as activateUsers,
  F as addCommRuleToGroup,
  xe as addCommunicationBetweenGroups,
  te as assertCondition,
  Le as assertKo,
  oe as assertOk,
  Se as attachStructureAsChild,
  We as attributePositions,
  fe as authenticateOAuth2,
  I as authenticateWeb,
  Pe as checkReturnCode,
  ge as checkStatus,
  De as createAndSetRole,
  he as createBroadcastGroup,
  z as createDefaultStructure,
  Ce as createEmptyStructure,
  T as createPosition,
  Ie as createPositionOrFail,
  X as createStructure,
  ve as deletePosition,
  Te as getAdmlsOrMakThem,
  _ as getBroadcastGroup,
  ue as getConnectedUserId,
  l as getHeaders,
  me as getMetricValue,
  Re as getOrCreatePosition,
  $e as getParentRole,
  q as getPositionByIdOrFail,
  b as getProfileGroupOfStructure,
  j as getProfileGroupsOfStructure,
  A as getRandomUser,
  L as getRandomUserWithProfile,
  W as getRoleByName,
  D as getRolesOfStructure,
  O as getSchoolByName,
  Fe as getSearchCriteria,
  ye as getStudentRole,
  G as getTeacherRole,
  ke as getUserProfileOrFail,
  V as getUsersOfGroup,
  B as getUsersOfSchool,
  be as importUsers,
  we as initStructure,
  Oe as linkRoleToUsers,
  pe as logout,
  Y as makeAdml,
  Ae as searchPositions,
  ie as searchUser,
  Je as shareFile,
  de as switchSession,
  _e as triggerImport,
  Ue as uploadFile
};
