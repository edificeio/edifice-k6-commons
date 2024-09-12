var T = Object.defineProperty;
var U = (o, e, t) => e in o ? T(o, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : o[e] = t;
var y = (o, e, t) => (U(o, typeof e != "symbol" ? e + "" : e, t), t);
import c from "k6/http";
import { check as f, fail as g } from "k6";
import { FormData as w } from "https://jslib.k6.io/formdata/0.0.2/index.js";
import { URL as A } from "https://jslib.k6.io/url/1.0.0/index.js";
const $ = {
  COOKIE: 0,
  OAUTH2: 1
};
class S {
  constructor(e, t, r, n) {
    y(this, "expiresAt");
    y(this, "token");
    y(this, "mode");
    y(this, "cookies");
    this.token = e, this.mode = t, this.cookies = n, this.expiresAt = Date.now() + r * 1e3 - 3e3;
  }
  static from(e) {
    const t = new S(e.token, e.mode, 0, e.cookies);
    return t.expiresAt = e.expiresAt, t;
  }
  isExpired() {
    return this.expiresAt <= Date.now();
  }
  getCookie(e) {
    return this.cookies ? this.cookies.filter((t) => t.name === e).map((t) => t.value)[0] : null;
  }
}
const J = __ENV.BASE_URL, x = 30 * 60, k = __ENV.ROOT_URL, l = function(o) {
  let e;
  return o ? o.mode === $.COOKIE ? e = { "x-xsrf-token": o.getCookie("XSRF-TOKEN") || "" } : o.mode === $.OAUTH2 ? e = { Authorization: `Bearer ${o.token}` } : e = {} : e = {}, e;
}, ue = function(o, e) {
  const t = c.get(`${k}/conversation/visible?search=${o}`, {
    headers: l(e)
  });
  return f(t, {
    "should get an OK response": (n) => n.status == 200
  }), t.json("users")[0].id;
}, pe = function(o) {
  const e = c.get(`${k}/auth/oauth2/userinfo`, {
    headers: l(o)
  });
  return f(e, {
    "should get an OK response": (t) => t.status == 200,
    "should get a valid userId": (t) => !!t.json("userId")
  }), e.json("userId");
}, _ = function(o, e) {
  const t = c.cookieJar();
  t.clear(k);
  let r = {
    email: o,
    password: e || __ENV.DEFAULT_PASSWORD || "password",
    callBack: "",
    detail: ""
  };
  const n = c.post(`${k}/auth/login`, r, {
    redirects: 0
  });
  if (n.status !== 302 && g("should redirect connected user to login page"), (n.cookies.oneSessionId === null || n.cookies.oneSessionId === void 0) && g("login process should have set an auth cookie"), !n.cookies.oneSessionId)
    return console.error(`Could not get oneSessionId for ${o}`), null;
  t.set(k, "oneSessionId", n.cookies.oneSessionId[0].value);
  const s = Object.keys(n.cookies).map((a) => ({ name: a, value: n.cookies[a][0].value }));
  return new S(
    n.cookies.oneSessionId[0].value,
    $.COOKIE,
    x,
    s
  );
}, de = function(o) {
  const e = c.get(`${k}/auth/logout?callback=/`, {
    headers: l(o)
  });
  return c.cookieJar().clear(k), e;
}, P = function(o) {
  const e = c.cookieJar();
  return o ? (e.set(k, "oneSessionId", o.token), e.set(k, "XSRF-TOKEN", o.getCookie("XSRF-TOKEN") || "")) : (e.delete(k, "oneSessionId"), e.delete(k, "XSRF-TOKEN")), o;
}, fe = function(o, e, t, r) {
  let n = {
    grant_type: "password",
    username: o,
    password: e,
    client_id: t,
    client_secret: r,
    scope: "timeline userbook blog lvs actualites pronote schoolbook support viescolaire zimbra conversation directory homeworks userinfo workspace portal cas sso presences incidents competences diary edt infra auth"
  }, s = c.post(`${k}/auth/oauth2/token`, n, {
    redirects: 0
  });
  f(s, {
    "should get an OK response for authentication": (i) => i.status == 200,
    "should have set an access token": (i) => !!i.json("access_token")
  });
  const a = s.json("access_token");
  return new S(
    a,
    $.OAUTH2,
    s.json("expires_in")
  );
};
function N(o, e) {
  const t = (e || []).map((r) => r.id);
  for (let r = 0; r < 1e3; r++) {
    const n = o[Math.floor(Math.random() * o.length)];
    if (t.indexOf(n.id) < 0)
      return n;
  }
  throw "cannot.find.random.user";
}
function L(o, e, t) {
  const r = o.filter((n) => n.type === e);
  return N(r, t);
}
function ge(o, e, t) {
  const r = {};
  r[e] = (s) => s.status === t;
  const n = f(o, r);
  return n || console.error(e, o), n;
}
function ke(o, e) {
  let t = c.get(`${k}/directory/user/${o}?manual-groups=true`, {
    headers: l(e)
  });
  return t.status !== 200 && (console.error(t), g("Could not get user profile")), JSON.parse(t.body);
}
const he = function(o, e) {
  const t = c.get(`${J}/metrics`, {
    headers: l(e)
  });
  f(t, {
    "should get an OK response": (n) => n.status == 200
  });
  const r = t.body.split(`
`);
  for (let n of r)
    if (n.indexOf(`${o} `) === 0)
      return parseFloat(n.substring(o.length + 1).trim());
  return console.error("Metric", o, "not found"), null;
}, m = __ENV.ROOT_URL, F = "AdminLocal";
function me(o, e, t) {
  let r = R(o, e, t);
  if (r)
    console.log("Broadcast group already existed");
  else {
    console.log("Creating broadcast group");
    const n = l(t);
    n["content-type"] = "application/json";
    let s = JSON.stringify({
      name: o,
      structureId: e.id,
      subType: "BroadcastGroup"
    }), a = c.post(`${m}/directory/group`, s, { headers: n });
    f(a, {
      "create broadcast group": (u) => u.status === 201
    });
    const i = JSON.parse(a.body).id;
    s = JSON.stringify({
      name: o,
      autolinkTargetAllStructs: !0,
      autolinkTargetStructs: [],
      autolinkUsersFromGroups: ["Teacher"]
    }), a = c.put(`${m}/directory/group/${i}`, s, { headers: n }), f(a, {
      "set broadcast group for teachers": (u) => u.status === 200
    });
    const p = G(e, t).id;
    j(i, [p], t), r = R(o, e, t);
  }
  return r;
}
function j(o, e, t) {
  const r = l(t);
  r["content-type"] = "application/json";
  for (let n of e) {
    let s = c.post(
      `${m}/communication/v2/group/${n}/communique/${o}`,
      "{}",
      { headers: r }
    );
    s.status !== 200 && (console.error(s), g(`Cannot open comm rule from ${n} to ${o}`));
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
  return I(e.id, t).filter((n) => {
    const s = n.name.toLowerCase();
    return s === `${e.name} group ${o}.`.toLowerCase() || s === `${o} from group ${e.name}.`.toLowerCase();
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
    "get structure profile groups should be ok": (n) => n.status == 200
  }), JSON.parse(r.body);
}
function R(o, e, t) {
  const r = l(t);
  r["content-type"] = "application/json";
  let n = c.get(
    `${m}/directory/group/admin/list?translate=false&structureId=${e.id}`,
    { headers: r }
  );
  return JSON.parse(n.body).filter(
    (s) => s.subType === "BroadcastGroup" && s.name === o
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
  t.status != 200 && g(`Cannot fetch users of structure ${o.id} : ${t}`);
  const r = JSON.parse(t.body);
  for (let n = 0; n < r.length; n++) {
    const s = r[n];
    z(s);
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
    t.status !== 302 && (console.error(t), g(
      `Could not activate user ${o.login} : ${t.status} - ${t.body}`
    ));
  }
}
function Oe(o, e, t, r) {
  const s = I(o.id, r).filter(
    (a) => t.indexOf(a.name) >= 0
  );
  for (let a of s)
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
        "link role to structure": (E) => E.status == 200
      });
    }
}
function Ce(o, e, t) {
  let r = O(o, t);
  if (r)
    console.log(`Structure ${o} already exists`);
  else {
    const n = l(t);
    n["content-type"] = "application/json";
    const s = JSON.stringify({
      hasApp: e,
      name: o
    });
    let a = c.post(`${d}/directory/school`, s, n);
    a.status !== 201 && (console.error(a.body), g(`Could not create structure ${o}`)), r = O(o, t);
  }
  return r;
}
function Se(o, e, t) {
  const r = l(t);
  r["content-type"] = "application/json";
  const n = JSON.stringify({
    hasApp: e,
    name: o
  });
  let s = c.post(`${d}/directory/school`, n, r);
  return s.status !== 201 && (console.error(s.body), g(`Could not create structure ${o}`)), s;
}
function we(o, e = "default") {
  const t = _(__ENV.ADMC_LOGIN, __ENV.ADMC_PASSWORD), r = X(o, e);
  return H(r, t), r;
}
function X(o, e = "default") {
  const t = o || "General", r = _(__ENV.ADMC_LOGIN, __ENV.ADMC_PASSWORD), n = "https://raw.githubusercontent.com/edificeio/edifice-k6-commons/develop/data/structure", s = c.get(`${n}/enseignants.${e}.csv`).body, a = c.get(`${n}/eleves.${e}.csv`).body, i = c.get(`${n}/responsables.${e}.csv`).body;
  return q(
    t,
    {
      teachers: s,
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
    const n = new w();
    n.append("type", "CSV"), n.append("structureName", o);
    let s, a, i;
    "teachers" in e ? (s = e.teachers, a = e.students, i = e.responsables) : s = e, n.append("Teacher", c.file(s, "enseignants.csv")), a && n.append("Student", c.file(a, "eleves.csv")), i && n.append("Relative", c.file(i, "responsables.csv"));
    const p = l(t);
    p["Content-Type"] = "multipart/form-data; boundary=" + n.boundary;
    const u = { headers: p };
    c.post(
      `${d}/directory/wizard/import`,
      n.body(),
      u
    ).status != 200 && g(`Could not create structure ${o}`), r = O(o, t);
  }
  return r;
}
function _e(o, e, t) {
  let r;
  if ((e.parents || []).map((s) => s.id).indexOf(o.id) >= 0)
    console.log(
      `${e.name} is already a child of ${o.name}`
    ), r = !1;
  else {
    const s = l(t);
    s["content-type"] = "application/json", c.put(
      `${d}/directory/structure/${e.id}/parent/${o.id}`,
      "{}"
    ).status !== 200 && g(
      `Could not attach structure ${e.name} as a child of ${o.name}`
    ), r = !0;
  }
  return r;
}
function be(o, e, t) {
  const r = new w();
  r.append("type", "CSV"), r.append("structureName", o.name), r.append("structureId", o.id), r.append("structureExternalId", o.externalId);
  let n, s, a;
  "teachers" in e ? (n = e.teachers, s = e.students, a = e.responsables) : n = e, r.append("Teacher", c.file(n, "enseignants.csv")), s && r.append("Student", c.file(s, "eleves.csv")), a && r.append("Relative", c.file(a, "responsables.csv"));
  const i = l(t);
  i["Content-Type"] = "multipart/form-data; boundary=" + r.boundary;
  const p = { headers: i };
  return c.post(
    `${d}/directory/wizard/import`,
    r.body(),
    p
  );
}
function Re(o) {
  const e = l(o);
  return e["content-type"] = "application/json", c.post(`${d}/directory/import`, "{}", { headers: e });
}
function D(o, e, t) {
  const r = l(t);
  r["content-type"] = "application/json";
  const n = JSON.stringify({
    name: o,
    structureId: e.id
  });
  return c.post(`${d}/directory/positions`, n, {
    redirects: 0,
    headers: r
  });
}
function We(o, e) {
  const t = l(e);
  t["content-type"] = "application/json";
  const r = JSON.stringify(o);
  return c.put(`${d}/directory/positions/${o.id}`, r, {
    redirects: 0,
    headers: t
  });
}
function ve(o, e, t) {
  let r = D(o, e, t);
  if (r.status === 409) {
    const n = JSON.parse(
      r.body
    ).existingPositionId;
    return Y(n, t);
  } else
    return JSON.parse(r.body);
}
function Ae(o, e, t) {
  const r = l(t);
  r["content-type"] = "application/json";
  const n = {};
  return e != null && (n.positionIds = e.map((a) => a.id)), c.put(
    `${d}/directory/user/${o.id}`,
    JSON.stringify(n),
    {
      headers: r
    }
  );
}
function Ne(o, e) {
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
function De(o, e, t) {
  const r = D(o, e, t);
  return r.status !== 201 && (console.error(r), g(
    `Could not create position ${o} on structure ${e.name}`
  )), JSON.parse(r.body);
}
function Ie(o, e) {
  const t = l(e), r = new A(`${d}/directory/positions`);
  return r.searchParams.append("content", o), c.get(r.toString(), { headers: t });
}
function Q(o, e, t) {
  const r = l(t);
  r["content-type"] = "application/json";
  const n = JSON.stringify({
    functionCode: "ADMIN_LOCAL",
    inherit: "s",
    scope: [e.id]
  });
  let s = c.post(
    `${d}/directory/user/function/${o.id}`,
    n,
    { headers: r }
  );
  return te(s, "user should be made ADML"), s;
}
function Ee(o, e, t, r, n) {
  const a = V(
    o.id,
    n
  ).filter(
    (p) => p.filter === F
  )[0];
  let i;
  if (a) {
    const p = M(
      a.id,
      n
    );
    i = e ? p.filter((u) => u.type === e) : p;
  } else
    i = [];
  if (r && r.length > 0) {
    const p = r.map((u) => u.id);
    i = i.filter((u) => p.indexOf(u.id) < 0);
  }
  if (i.length < t) {
    const p = K(o, n);
    for (let u = i.length; u < t; u++) {
      let h;
      e ? h = L(p, e, i) : h = N(p, i), console.log(
        `Turning ${h.login} into an ADML of ${o.id} - ${o.name}`
      ), Q(h, o, n), i.push(h);
    }
  }
  return i.slice(0, t);
}
function Te(o, e, t) {
  try {
    const r = _(__ENV.ADMC_LOGIN, __ENV.ADMC_PASSWORD), n = Array.isArray(e) ? e : [e];
    for (let s of n)
      c.put(
        `${d}/directory/structure/${s.id}/link/${o.id}`,
        null,
        { headers: l(r) }
      );
  } finally {
    P(t);
  }
}
const C = __ENV.ROOT_URL;
function v(o, e) {
  let t = c.get(`${C}/appregistry/roles`, {
    headers: l(e)
  });
  return JSON.parse(t.body).filter((n) => n.name === o)[0];
}
function Ue(o, e) {
  const t = `${o} - All - Stress Test`;
  let r = v(t, e);
  if (r)
    console.log(`Role ${t} already existed`);
  else {
    let n = c.get(
      `${C}/appregistry/applications/actions?actionType=WORKFLOW`,
      { headers: l(e) }
    );
    f(n, { "get workflow actions": (u) => u.status == 200 });
    const a = JSON.parse(n.body).filter(
      (u) => u.name === o
    )[0].actions.map((u) => u[0]), i = l(e);
    i["content-type"] = "application/json";
    const p = {
      role: t,
      actions: a
    };
    n = c.post(`${C}/appregistry/role`, JSON.stringify(p), {
      headers: i
    }), console.log(n), f(n, { "save role ok": (u) => u.status == 201 }), r = v(t, e);
  }
  return r;
}
function I(o, e) {
  const t = l(e);
  t["Accept-Language"] = "en";
  let r = c.get(
    `${C}/appregistry/groups/roles?structureId=${o}&translate=false`,
    { headers: t }
  );
  return f(r, {
    "get structure roles should be ok": (n) => n.status == 200
  }), JSON.parse(r.body);
}
const Z = __ENV.ROOT_URL, Je = [
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
], xe = [
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
function Pe(o, e) {
  let t = l(e);
  const r = new w();
  r.append("file", c.file(o, "file.txt")), t["Content-Type"] = "multipart/form-data; boundary=" + r.boundary;
  let n = c.post(`${Z}/workspace/document`, r.body(), { headers: t });
  return f(n, {
    "upload doc ok": (s) => s.status === 201
  }), JSON.parse(n.body);
}
const ee = __ENV.ROOT_URL;
function Le(o, e, t) {
  const r = l(t);
  r["content-type"] = "application/json";
  const n = JSON.stringify(e);
  return c.put(`${ee}/workspace/share/resource/${o}`, n, {
    headers: r
  });
}
const oe = __ENV.ROOT_URL;
function Fe(o, e, t) {
  const r = c.post(
    `${oe}/communication/v2/group/${o}/communique/${e}`,
    "{}",
    { headers: l(t) }
  );
  return r.status !== 200 && (console.error(
    `Error while adding communication between ${o} -> ${e}`
  ), console.error(r), g(`could not add communication between ${o} -> ${e}`)), r;
}
function te(o, e, t = 200) {
  const r = t || 200;
  o.status != r && (console.error(`ko - ${e}. Expecting ${r} but got ${o.status}`), console.error(o), g(e + " ko"));
}
function je(o, e, t = 500) {
  re(
    () => o && o.code === t,
    `[${o.request.method}]${o.url} returns code ${t}: ${e} `
  );
}
function Ge(o, e, t = 500) {
  const r = {};
  return r[`${e} (expects ${t})`] = () => {
    const n = o && o.status === t;
    return n || (console.warn("Expected ", t, " but got ", o.status), console.warn(o)), n;
  }, f({}, r);
}
function re(o, e) {
  const t = {};
  t[e] = () => o, f({}, t) || g(e);
}
const ne = __ENV.ROOT_URL;
function Ve(o) {
  let e = c.get(`${ne}/userbook/search/criteria`, {
    headers: l(o)
  });
  return JSON.parse(e.body);
}
export {
  F as ADML_FILTER,
  J as BASE_URL,
  S as Session,
  $ as SessionMode,
  Je as WS_MANAGER_SHARE,
  xe as WS_READER_SHARE,
  z as activateUser,
  H as activateUsers,
  j as addCommRuleToGroup,
  Fe as addCommunicationBetweenGroups,
  re as assertCondition,
  je as assertKo,
  te as assertOk,
  _e as attachStructureAsChild,
  Te as attachUserToStructures,
  Ae as attributePositions,
  fe as authenticateOAuth2,
  _ as authenticateWeb,
  Ge as checkReturnCode,
  ge as checkStatus,
  Ue as createAndSetRole,
  me as createBroadcastGroup,
  X as createDefaultStructure,
  Ce as createEmptyStructure,
  Se as createEmptyStructureNoCheck,
  D as createPosition,
  De as createPositionOrFail,
  q as createStructure,
  Ne as deletePosition,
  Ee as getAdmlsOrMakThem,
  R as getBroadcastGroup,
  pe as getConnectedUserId,
  l as getHeaders,
  he as getMetricValue,
  ve as getOrCreatePosition,
  $e as getParentRole,
  Y as getPositionByIdOrFail,
  b as getProfileGroupOfStructure,
  V as getProfileGroupsOfStructure,
  N as getRandomUser,
  L as getRandomUserWithProfile,
  v as getRoleByName,
  I as getRolesOfStructure,
  O as getSchoolByName,
  Ve as getSearchCriteria,
  ye as getStudentRole,
  G as getTeacherRole,
  ke as getUserProfileOrFail,
  M as getUsersOfGroup,
  K as getUsersOfSchool,
  be as importUsers,
  we as initStructure,
  Oe as linkRoleToUsers,
  de as logout,
  Q as makeAdml,
  Ie as searchPositions,
  ue as searchUser,
  Le as shareFile,
  P as switchSession,
  Re as triggerImport,
  We as updatePosition,
  Pe as uploadFile
};
