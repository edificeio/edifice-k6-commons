var E = Object.defineProperty;
var U = (o, e, t) => e in o ? E(o, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : o[e] = t;
var y = (o, e, t) => (U(o, typeof e != "symbol" ? e + "" : e, t), t);
import c from "k6/http";
import { check as f, fail as k } from "k6";
import { FormData as S } from "https://jslib.k6.io/formdata/0.0.2/index.js";
import { URL as A } from "https://jslib.k6.io/url/1.0.0/index.js";
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
}, ue = function(o, e) {
  const t = c.get(`${g}/conversation/visible?search=${o}`, {
    headers: l(e)
  });
  return f(t, {
    "should get an OK response": (s) => s.status == 200
  }), t.json("users")[0].id;
}, pe = function(o) {
  const e = c.get(`${g}/auth/oauth2/userinfo`, {
    headers: l(o)
  });
  return f(e, {
    "should get an OK response": (t) => t.status == 200,
    "should get a valid userId": (t) => !!t.json("userId")
  }), e.json("userId");
}, _ = function(o, e) {
  const t = c.cookieJar();
  t.clear(g);
  let r = {
    email: o,
    password: e || __ENV.DEFAULT_PASSWORD,
    callBack: "",
    detail: ""
  };
  const s = c.post(`${g}/auth/login`, r, {
    redirects: 0
  });
  if (s.status !== 302 && k("should redirect connected user to login page"), (s.cookies.oneSessionId === null || s.cookies.oneSessionId === void 0) && k("login process should have set an auth cookie"), !s.cookies.oneSessionId)
    return console.error(`Could not get oneSessionId for ${o}`), null;
  t.set(g, "oneSessionId", s.cookies.oneSessionId[0].value);
  const n = Object.keys(s.cookies).map((a) => ({ name: a, value: s.cookies[a][0].value }));
  return new w(
    s.cookies.oneSessionId[0].value,
    $.COOKIE,
    x,
    n
  );
}, de = function(o) {
  const e = c.get(`${g}/auth/logout?callback=/`, {
    headers: l(o)
  });
  return c.cookieJar().clear(g), e;
}, L = function(o) {
  const e = c.cookieJar();
  return o ? (e.set(g, "oneSessionId", o.token), e.set(g, "XSRF-TOKEN", o.getCookie("XSRF-TOKEN") || "")) : (e.delete(g, "oneSessionId"), e.delete(g, "XSRF-TOKEN")), o;
}, fe = function(o, e, t, r) {
  let s = {
    grant_type: "password",
    username: o,
    password: e,
    client_id: t,
    client_secret: r,
    scope: "timeline userbook blog lvs actualites pronote schoolbook support viescolaire zimbra conversation directory homeworks userinfo workspace portal cas sso presences incidents competences diary edt infra auth"
  }, n = c.post(`${g}/auth/oauth2/token`, s, {
    redirects: 0
  });
  f(n, {
    "should get an OK response for authentication": (i) => i.status == 200,
    "should have set an access token": (i) => !!i.json("access_token")
  });
  const a = n.json("access_token");
  return new w(
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
function P(o, e, t) {
  const r = o.filter((s) => s.type === e);
  return D(r, t);
}
function ge(o, e, t) {
  const r = {};
  r[e] = (n) => n.status === t;
  const s = f(o, r);
  return s || console.error(e, o), s;
}
function ke(o, e) {
  let t = c.get(`${g}/directory/user/${o}?manual-groups=true`, {
    headers: l(e)
  });
  return t.status !== 200 && (console.error(t), k("Could not get user profile")), JSON.parse(t.body);
}
const he = function(o, e) {
  const t = c.get(`${J}/metrics`, {
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
}, m = __ENV.ROOT_URL, F = "AdminLocal";
function me(o, e, t) {
  let r = R(o, e, t);
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
    }), a = c.post(`${m}/directory/group`, n, { headers: s });
    f(a, {
      "create broadcast group": (u) => u.status === 201
    });
    const i = JSON.parse(a.body).id;
    n = JSON.stringify({
      name: o,
      autolinkTargetAllStructs: !0,
      autolinkTargetStructs: [],
      autolinkUsersFromGroups: ["Teacher"]
    }), a = c.put(`${m}/directory/group/${i}`, n, { headers: s }), f(a, {
      "set broadcast group for teachers": (u) => u.status === 200
    });
    const p = j(e, t).id;
    G(i, [p], t), r = R(o, e, t);
  }
  return r;
}
function G(o, e, t) {
  const r = l(t);
  r["content-type"] = "application/json";
  for (let s of e) {
    let n = c.post(
      `${m}/communication/v2/group/${s}/communique/${o}`,
      "{}",
      { headers: r }
    );
    n.status !== 200 && (console.error(n), k(`Cannot open comm rule from ${s} to ${o}`));
  }
}
function j(o, e) {
  return b("teachers", o, e);
}
function ye(o, e) {
  return b("students", o, e);
}
function $e(o, e) {
  return b("relatives", o, e);
}
function b(o, e, t) {
  return N(e.id, t).filter((s) => {
    const n = s.name.toLowerCase();
    return n === `${e.name} group ${o}.`.toLowerCase() || n === `${o} from group ${e.name}.`.toLowerCase();
  })[0];
}
function V(o, e) {
  const t = l(e);
  t["Accept-Language"] = "en";
  let r = c.get(
    `${m}/directory/group/admin/list?structureId=${o}&translate=false`,
    { headers: t }
  );
  return f(r, {
    "get structure profile groups should be ok": (s) => s.status == 200
  }), JSON.parse(r.body);
}
function R(o, e, t) {
  const r = l(t);
  r["content-type"] = "application/json";
  let s = c.get(
    `${m}/directory/group/admin/list?translate=false&structureId=${e.id}`,
    { headers: r }
  );
  return JSON.parse(s.body).filter(
    (n) => n.subType === "BroadcastGroup" && n.name === o
  )[0];
}
function M(o, e) {
  const t = l(e);
  t["content-type"] = "application/json";
  let r = c.get(
    `${m}/directory/user/admin/list?groupId=${o}`,
    { headers: t }
  );
  return JSON.parse(r.body);
}
const d = __ENV.ROOT_URL, B = new A(d).hostname, W = __ENV.DEFAULT_PASSWORD || "password";
function O(o, e) {
  let t = c.get(`${d}/directory/structure/admin/list`, {
    headers: l(e)
  });
  return JSON.parse(t.body).filter(
    (r) => r.name === o
  )[0];
}
function K(o, e) {
  let t = c.get(`${d}/directory/structure/${o.id}/users`, {
    headers: l(e)
  });
  if (t.status !== 200)
    throw `Impossible to get users of ${o.id}`;
  return JSON.parse(t.body);
}
function H(o, e) {
  let t = c.get(`${d}/directory/structure/${o.id}/users`, {
    headers: l(e)
  });
  t.status != 200 && k(`Cannot fetch users of structure ${o.id} : ${t}`);
  const r = JSON.parse(t.body);
  for (let s = 0; s < r.length; s++) {
    const n = r[s];
    z(n);
  }
}
function z(o) {
  if (o.code) {
    const e = {};
    e.login = o.login, e.activationCode = o.code, e.password = W, e.confirmPassword = W, e.acceptCGU = "true";
    const t = c.post(`${d}/auth/activation`, e, {
      redirects: 0,
      headers: { Host: B }
    });
    t.status !== 302 && (console.error(t), k(
      `Could not activate user ${o.login} : ${t.status} - ${t.body}`
    ));
  }
}
function Oe(o, e, t, r) {
  const n = N(o.id, r).filter(
    (a) => t.indexOf(a.name) >= 0
  );
  for (let a of n)
    if (a.roles.indexOf(e.name) >= 0)
      console.log("Role already attributed to teachers");
    else {
      const i = l(r);
      i["content-type"] = "application/json";
      const p = { headers: i }, u = JSON.stringify({
        groupId: a.id,
        roleIds: (a.roles || []).concat([e.id])
      }), h = c.post(
        `${d}/appregistry/authorize/group?schoolId=${o.id}`,
        u,
        p
      );
      f(h, {
        "link role to structure": (T) => T.status == 200
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
    const n = JSON.stringify({
      hasApp: e,
      name: o
    });
    let a = c.post(`${d}/directory/school`, n, s);
    a.status !== 201 && (console.error(a.body), k(`Could not create structure ${o}`)), r = O(o, t);
  }
  return r;
}
function we(o, e = "default") {
  const t = _(__ENV.ADMC_LOGIN, __ENV.ADMC_PASSWORD), r = X(o, e);
  return H(r, t), r;
}
function X(o, e = "default") {
  const t = o || "General", r = _(__ENV.ADMC_LOGIN, __ENV.ADMC_PASSWORD), s = "https://raw.githubusercontent.com/edificeio/edifice-k6-commons/develop/data/structure", n = c.get(`${s}/enseignants.${e}.csv`).body, a = c.get(`${s}/eleves.${e}.csv`).body, i = c.get(`${s}/responsables.${e}.csv`).body;
  return q(
    t,
    {
      teachers: n,
      students: a,
      responsables: i
    },
    r
  );
}
function q(o, e, t) {
  let r = O(o, t);
  if (r)
    console.log("School already exists");
  else {
    const s = new S();
    s.append("type", "CSV"), s.append("structureName", o);
    let n, a, i;
    "teachers" in e ? (n = e.teachers, a = e.students, i = e.responsables) : n = e, s.append("Teacher", c.file(n, "enseignants.csv")), a && s.append("Student", c.file(a, "eleves.csv")), i && s.append("Relative", c.file(i, "responsables.csv"));
    const p = l(t);
    p["Content-Type"] = "multipart/form-data; boundary=" + s.boundary;
    const u = { headers: p };
    c.post(
      `${d}/directory/wizard/import`,
      s.body(),
      u
    ).status != 200 && k(`Could not create structure ${o}`), r = O(o, t);
  }
  return r;
}
function Se(o, e, t) {
  let r;
  if ((e.parents || []).map((n) => n.id).indexOf(o.id) >= 0)
    console.log(
      `${e.name} is already a child of ${o.name}`
    ), r = !1;
  else {
    const n = l(t);
    n["content-type"] = "application/json", c.put(
      `${d}/directory/structure/${e.id}/parent/${o.id}`,
      "{}"
    ).status !== 200 && k(
      `Could not attach structure ${e.name} as a child of ${o.name}`
    ), r = !0;
  }
  return r;
}
function _e(o, e, t) {
  const r = new S();
  r.append("type", "CSV"), r.append("structureName", o.name), r.append("structureId", o.id), r.append("structureExternalId", o.externalId);
  let s, n, a;
  "teachers" in e ? (s = e.teachers, n = e.students, a = e.responsables) : s = e, r.append("Teacher", c.file(s, "enseignants.csv")), n && r.append("Student", c.file(n, "eleves.csv")), a && r.append("Relative", c.file(a, "responsables.csv"));
  const i = l(t);
  i["Content-Type"] = "multipart/form-data; boundary=" + r.boundary;
  const p = { headers: i };
  return c.post(
    `${d}/directory/wizard/import`,
    r.body(),
    p
  );
}
function be(o) {
  const e = l(o);
  return e["content-type"] = "application/json", c.post(`${d}/directory/import`, "{}", { headers: e });
}
function I(o, e, t) {
  const r = l(t);
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
function Re(o, e, t) {
  let r = I(o, e, t);
  if (r.status === 409) {
    const s = JSON.parse(
      r.body
    ).existingPositionId;
    return Y(s, t);
  } else
    return JSON.parse(r.body);
}
function We(o, e, t) {
  const r = l(t);
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
function ve(o, e) {
  const t = l(e);
  return t["content-type"] = "application/json", c.del(`${d}/directory/positions/${o}`, null, {
    redirects: 0,
    headers: t
  });
}
function Y(o, e) {
  let t = c.get(`${d}/directory/positions/${o}`, {
    headers: l(e)
  });
  return JSON.parse(t.body);
}
function Ae(o, e, t) {
  const r = I(o, e, t);
  return r.status !== 201 && (console.error(r), k(
    `Could not create position ${o} on structure ${e.name}`
  )), JSON.parse(r.body);
}
function De(o, e) {
  const t = l(e), r = new A(`${d}/directory/positions`);
  return r.searchParams.append("content", o), c.get(r.toString(), { headers: t });
}
function Q(o, e, t) {
  const r = l(t);
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
  return te(n, "user should be made ADML"), n;
}
function Ie(o, e, t, r, s) {
  const a = V(
    o.id,
    s
  ).filter(
    (p) => p.filter === F
  )[0];
  let i;
  if (a) {
    const p = M(
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
    const p = K(o, s);
    for (let u = i.length; u < t; u++) {
      let h;
      e ? h = P(p, e, i) : h = D(p, i), console.log(
        `Turning ${h.login} into an ADML of ${o.id} - ${o.name}`
      ), Q(h, o, s), i.push(h);
    }
  }
  return i.slice(0, t);
}
function Ne(o, e, t) {
  try {
    const r = _(__ENV.ADMC_LOGIN, __ENV.ADMC_PASSWORD), s = Array.isArray(e) ? e : [e];
    for (let n of s)
      c.put(
        `${d}/directory/structure/${n.id}/link/${o.id}`,
        null,
        { headers: l(r) }
      );
  } finally {
    L(t);
  }
}
const C = __ENV.ROOT_URL;
function v(o, e) {
  let t = c.get(`${C}/appregistry/roles`, {
    headers: l(e)
  });
  return JSON.parse(t.body).filter((s) => s.name === o)[0];
}
function Te(o, e) {
  const t = `${o} - All - Stress Test`;
  let r = v(t, e);
  if (r)
    console.log(`Role ${t} already existed`);
  else {
    let s = c.get(
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
    s = c.post(`${C}/appregistry/role`, JSON.stringify(p), {
      headers: i
    }), console.log(s), f(s, { "save role ok": (u) => u.status == 201 }), r = v(t, e);
  }
  return r;
}
function N(o, e) {
  const t = l(e);
  t["Accept-Language"] = "en";
  let r = c.get(
    `${C}/appregistry/groups/roles?structureId=${o}&translate=false`,
    { headers: t }
  );
  return f(r, {
    "get structure roles should be ok": (s) => s.status == 200
  }), JSON.parse(r.body);
}
const Z = __ENV.ROOT_URL, Ee = [
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
], Ue = [
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
function Je(o, e) {
  let t = l(e);
  const r = new S();
  r.append("file", c.file(o, "file.txt")), t["Content-Type"] = "multipart/form-data; boundary=" + r.boundary;
  let s = c.post(`${Z}/workspace/document`, r.body(), { headers: t });
  return f(s, {
    "upload doc ok": (n) => n.status === 201
  }), JSON.parse(s.body);
}
const ee = __ENV.ROOT_URL;
function xe(o, e, t) {
  const r = l(t);
  r["content-type"] = "application/json";
  const s = JSON.stringify(e);
  return c.put(`${ee}/workspace/share/resource/${o}`, s, {
    headers: r
  });
}
const oe = __ENV.ROOT_URL;
function Le(o, e, t) {
  const r = c.post(
    `${oe}/communication/v2/group/${o}/communique/${e}`,
    "{}",
    { headers: l(t) }
  );
  return r.status !== 200 && (console.error(
    `Error while adding communication between ${o} -> ${e}`
  ), console.error(r), k(`could not add communication between ${o} -> ${e}`)), r;
}
function te(o, e, t = 200) {
  const r = t || 200;
  o.status != r && (console.error(`ko - ${e}. Expecting ${r} but got ${o.status}`), console.error(o), k(e + " ko"));
}
function Pe(o, e, t = 500) {
  re(
    () => o && o.code === t,
    `[${o.request.method}]${o.url} returns code ${t}: ${e} `
  );
}
function Fe(o, e, t = 500) {
  const r = {};
  return r[`${e} (expects ${t})`] = () => {
    const s = o && o.status === t;
    return s || (console.warn("Expected ", t, " but got ", o.status), console.warn(o)), s;
  }, f({}, r);
}
function re(o, e) {
  const t = {};
  t[e] = () => o, f({}, t) || k(e);
}
const se = __ENV.ROOT_URL;
function Ge(o) {
  let e = c.get(`${se}/userbook/search/criteria`, {
    headers: l(o)
  });
  return JSON.parse(e.body);
}
export {
  F as ADML_FILTER,
  J as BASE_URL,
  w as Session,
  $ as SessionMode,
  Ee as WS_MANAGER_SHARE,
  Ue as WS_READER_SHARE,
  z as activateUser,
  H as activateUsers,
  G as addCommRuleToGroup,
  Le as addCommunicationBetweenGroups,
  re as assertCondition,
  Pe as assertKo,
  te as assertOk,
  Se as attachStructureAsChild,
  Ne as attachUserToStructures,
  We as attributePositions,
  fe as authenticateOAuth2,
  _ as authenticateWeb,
  Fe as checkReturnCode,
  ge as checkStatus,
  Te as createAndSetRole,
  me as createBroadcastGroup,
  X as createDefaultStructure,
  Ce as createEmptyStructure,
  I as createPosition,
  Ae as createPositionOrFail,
  q as createStructure,
  ve as deletePosition,
  Ie as getAdmlsOrMakThem,
  R as getBroadcastGroup,
  pe as getConnectedUserId,
  l as getHeaders,
  he as getMetricValue,
  Re as getOrCreatePosition,
  $e as getParentRole,
  Y as getPositionByIdOrFail,
  b as getProfileGroupOfStructure,
  V as getProfileGroupsOfStructure,
  D as getRandomUser,
  P as getRandomUserWithProfile,
  v as getRoleByName,
  N as getRolesOfStructure,
  O as getSchoolByName,
  Ge as getSearchCriteria,
  ye as getStudentRole,
  j as getTeacherRole,
  ke as getUserProfileOrFail,
  M as getUsersOfGroup,
  K as getUsersOfSchool,
  _e as importUsers,
  we as initStructure,
  Oe as linkRoleToUsers,
  de as logout,
  Q as makeAdml,
  De as searchPositions,
  ue as searchUser,
  xe as shareFile,
  L as switchSession,
  be as triggerImport,
  Je as uploadFile
};
