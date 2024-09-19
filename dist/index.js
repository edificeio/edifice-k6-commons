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
const J = __ENV.BASE_URL, x = 30 * 60, g = __ENV.ROOT_URL, a = function(o) {
  let e;
  return o ? o.mode === $.COOKIE ? e = { "x-xsrf-token": o.getCookie("XSRF-TOKEN") || "" } : o.mode === $.OAUTH2 ? e = { Authorization: `Bearer ${o.token}` } : e = {} : e = {}, e;
}, ue = function(o, e) {
  const t = c.get(`${g}/conversation/visible?search=${o}`, {
    headers: a(e)
  });
  return f(t, {
    "should get an OK response": (s) => s.status == 200
  }), t.json("users")[0].id;
}, pe = function(o) {
  const e = c.get(`${g}/auth/oauth2/userinfo`, {
    headers: a(o)
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
    password: e || __ENV.DEFAULT_PASSWORD || "password",
    callBack: "",
    detail: ""
  };
  const s = c.post(`${g}/auth/login`, r, {
    redirects: 0
  });
  if (s.status !== 302 && k("should redirect connected user to login page"), (s.cookies.oneSessionId === null || s.cookies.oneSessionId === void 0) && k("login process should have set an auth cookie"), !s.cookies.oneSessionId)
    return console.error(`Could not get oneSessionId for ${o}`), null;
  t.set(g, "oneSessionId", s.cookies.oneSessionId[0].value);
  const n = Object.keys(s.cookies).map((l) => ({ name: l, value: s.cookies[l][0].value }));
  return new w(
    s.cookies.oneSessionId[0].value,
    $.COOKIE,
    x,
    n
  );
}, de = function(o) {
  const e = c.get(`${g}/auth/logout?callback=/`, {
    headers: a(o)
  });
  return c.cookieJar().clear(g), e;
}, P = function(o) {
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
  const l = n.json("access_token");
  return new w(
    l,
    $.OAUTH2,
    n.json("expires_in")
  );
};
function N(o, e) {
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
  return N(r, t);
}
function ge(o, e, t) {
  const r = {};
  r[e] = (n) => n.status === t;
  const s = f(o, r);
  return s || console.error(e, o), s;
}
function ke(o, e) {
  let t = c.get(`${g}/directory/user/${o}?manual-groups=true`, {
    headers: a(e)
  });
  return t.status !== 200 && (console.error(t), k("Could not get user profile")), JSON.parse(t.body);
}
function he(o, e) {
  const t = o, r = a(e);
  return r["content-type"] = "application/x-www-form-urlencoded;charset=UTF-8", c.post(`${g}/directory/api/user`, t, {
    headers: r
  });
}
const me = function(o, e) {
  const t = c.get(`${J}/metrics`, {
    headers: a(e)
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
function ye(o, e, t) {
  let r = R(o, e, t);
  if (r)
    console.log("Broadcast group already existed");
  else {
    console.log("Creating broadcast group");
    const s = a(t);
    s["content-type"] = "application/json";
    let n = JSON.stringify({
      name: o,
      structureId: e.id,
      subType: "BroadcastGroup"
    }), l = c.post(`${m}/directory/group`, n, { headers: s });
    f(l, {
      "create broadcast group": (u) => u.status === 201
    });
    const i = JSON.parse(l.body).id;
    n = JSON.stringify({
      name: o,
      autolinkTargetAllStructs: !0,
      autolinkTargetStructs: [],
      autolinkUsersFromGroups: ["Teacher"]
    }), l = c.put(`${m}/directory/group/${i}`, n, { headers: s }), f(l, {
      "set broadcast group for teachers": (u) => u.status === 200
    });
    const d = G(e, t).id;
    j(i, [d], t), r = R(o, e, t);
  }
  return r;
}
function j(o, e, t) {
  const r = a(t);
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
function G(o, e) {
  return b("teachers", o, e);
}
function $e(o, e) {
  return b("students", o, e);
}
function Oe(o, e) {
  return b("relatives", o, e);
}
function b(o, e, t) {
  return D(e.id, t).filter((s) => {
    const n = s.name.toLowerCase();
    return n === `${e.name} group ${o}.`.toLowerCase() || n === `${o} from group ${e.name}.`.toLowerCase();
  })[0];
}
function V(o, e) {
  const t = a(e);
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
  const r = a(t);
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
  const t = a(e);
  t["content-type"] = "application/json";
  let r = c.get(
    `${m}/directory/user/admin/list?groupId=${o}`,
    { headers: t }
  );
  return JSON.parse(r.body);
}
const p = __ENV.ROOT_URL, B = new A(p).hostname, W = __ENV.DEFAULT_PASSWORD || "password";
function O(o, e) {
  let t = c.get(`${p}/directory/structure/admin/list`, {
    headers: a(e)
  });
  return JSON.parse(t.body).filter(
    (r) => r.name === o
  )[0];
}
function K(o, e) {
  let t = c.get(`${p}/directory/structure/${o.id}/users`, {
    headers: a(e)
  });
  if (t.status !== 200)
    throw `Impossible to get users of ${o.id}`;
  return JSON.parse(t.body);
}
function H(o, e) {
  let t = c.get(`${p}/directory/structure/${o.id}/users`, {
    headers: a(e)
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
    const t = c.post(`${p}/auth/activation`, e, {
      redirects: 0,
      headers: { Host: B }
    });
    t.status !== 302 && (console.error(t), k(
      `Could not activate user ${o.login} : ${t.status} - ${t.body}`
    ));
  }
}
function Ce(o, e, t, r) {
  const n = D(o.id, r).filter(
    (l) => t.indexOf(l.name) >= 0
  );
  for (let l of n)
    if (l.roles.indexOf(e.name) >= 0)
      console.log("Role already attributed to teachers");
    else {
      const i = a(r);
      i["content-type"] = "application/json";
      const d = { headers: i }, u = JSON.stringify({
        groupId: l.id,
        roleIds: (l.roles || []).concat([e.id])
      }), h = c.post(
        `${p}/appregistry/authorize/group?schoolId=${o.id}`,
        u,
        d
      );
      f(h, {
        "link role to structure": (T) => T.status == 200
      });
    }
}
function we(o, e, t) {
  let r = O(o, t);
  if (r)
    console.log(`Structure ${o} already exists`);
  else {
    const s = a(t);
    s["content-type"] = "application/json";
    const n = JSON.stringify({
      hasApp: e,
      name: o
    });
    let l = c.post(`${p}/directory/school`, n, s);
    l.status !== 201 && (console.error(l.body), k(`Could not create structure ${o}`)), r = O(o, t);
  }
  return r;
}
function Se(o, e, t) {
  const r = a(t);
  r["content-type"] = "application/json";
  const s = JSON.stringify({
    hasApp: e,
    name: o
  });
  let n = c.post(`${p}/directory/school`, s, r);
  return n.status !== 201 && (console.error(n.body), k(`Could not create structure ${o}`)), n;
}
function _e(o, e = "default") {
  const t = _(__ENV.ADMC_LOGIN, __ENV.ADMC_PASSWORD), r = X(o, e);
  return H(r, t), r;
}
function X(o, e = "default") {
  const t = o || "General", r = _(__ENV.ADMC_LOGIN, __ENV.ADMC_PASSWORD), s = "https://raw.githubusercontent.com/edificeio/edifice-k6-commons/develop/data/structure", n = c.get(`${s}/enseignants.${e}.csv`).body, l = c.get(`${s}/eleves.${e}.csv`).body, i = c.get(`${s}/responsables.${e}.csv`).body;
  return q(
    t,
    {
      teachers: n,
      students: l,
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
    let n, l, i;
    "teachers" in e ? (n = e.teachers, l = e.students, i = e.responsables) : n = e, s.append("Teacher", c.file(n, "enseignants.csv")), l && s.append("Student", c.file(l, "eleves.csv")), i && s.append("Relative", c.file(i, "responsables.csv"));
    const d = a(t);
    d["Content-Type"] = "multipart/form-data; boundary=" + s.boundary;
    const u = { headers: d };
    c.post(
      `${p}/directory/wizard/import`,
      s.body(),
      u
    ).status != 200 && k(`Could not create structure ${o}`), r = O(o, t);
  }
  return r;
}
function be(o, e, t) {
  let r;
  if ((e.parents || []).map((n) => n.id).indexOf(o.id) >= 0)
    console.log(
      `${e.name} is already a child of ${o.name}`
    ), r = !1;
  else {
    const n = a(t);
    n["content-type"] = "application/json", c.put(
      `${p}/directory/structure/${e.id}/parent/${o.id}`,
      "{}"
    ).status !== 200 && k(
      `Could not attach structure ${e.name} as a child of ${o.name}`
    ), r = !0;
  }
  return r;
}
function Re(o, e, t) {
  const r = new S();
  r.append("type", "CSV"), r.append("structureName", o.name), r.append("structureId", o.id), r.append("structureExternalId", o.externalId);
  let s, n, l;
  "teachers" in e ? (s = e.teachers, n = e.students, l = e.responsables) : s = e, r.append("Teacher", c.file(s, "enseignants.csv")), n && r.append("Student", c.file(n, "eleves.csv")), l && r.append("Relative", c.file(l, "responsables.csv"));
  const i = a(t);
  i["Content-Type"] = "multipart/form-data; boundary=" + r.boundary;
  const d = { headers: i };
  return c.post(
    `${p}/directory/wizard/import`,
    r.body(),
    d
  );
}
function We(o) {
  const e = a(o);
  return e["content-type"] = "application/json", c.post(`${p}/directory/import`, "{}", { headers: e });
}
function I(o, e, t) {
  const r = a(t);
  r["content-type"] = "application/json";
  const s = JSON.stringify({
    name: o,
    structureId: e.id
  });
  return c.post(`${p}/directory/positions`, s, {
    redirects: 0,
    headers: r
  });
}
function ve(o, e) {
  const t = a(e);
  t["content-type"] = "application/json";
  const r = JSON.stringify(o);
  return c.put(`${p}/directory/positions/${o.id}`, r, {
    redirects: 0,
    headers: t
  });
}
function Ae(o, e, t) {
  let r = I(o, e, t);
  if (r.status === 409) {
    const s = JSON.parse(
      r.body
    ).existingPositionId;
    return Y(s, t);
  } else
    return JSON.parse(r.body);
}
function Ne(o, e, t) {
  const r = a(t);
  r["content-type"] = "application/json";
  const s = {};
  return e != null && (s.positionIds = e.map((l) => l.id)), c.put(
    `${p}/directory/user/${o.id}`,
    JSON.stringify(s),
    {
      headers: r
    }
  );
}
function Ie(o, e) {
  const t = a(e);
  return t["content-type"] = "application/json", c.del(`${p}/directory/positions/${o}`, null, {
    redirects: 0,
    headers: t
  });
}
function Y(o, e) {
  let t = c.get(`${p}/directory/positions/${o}`, {
    headers: a(e)
  });
  return JSON.parse(t.body);
}
function De(o, e, t) {
  const r = I(o, e, t);
  return r.status !== 201 && (console.error(r), k(
    `Could not create position ${o} on structure ${e.name}`
  )), JSON.parse(r.body);
}
function Te(o, e) {
  const t = a(e), r = new A(`${p}/directory/positions`);
  return r.searchParams.append("content", o), c.get(r.toString(), { headers: t });
}
function Ee(o, e) {
  const t = a(e), r = c.get(
    `${p}/directory/positions?structureId=${o.id}`,
    { headers: t }
  );
  return JSON.parse(r.body);
}
function Q(o, e, t) {
  const r = a(t);
  r["content-type"] = "application/json";
  const s = JSON.stringify({
    functionCode: "ADMIN_LOCAL",
    inherit: "s",
    scope: [e.id]
  });
  let n = c.post(
    `${p}/directory/user/function/${o.id}`,
    s,
    { headers: r }
  );
  return te(n, "user should be made ADML"), n;
}
function Ue(o, e, t, r, s) {
  const l = V(
    o.id,
    s
  ).filter(
    (d) => d.filter === F
  )[0];
  let i;
  if (l) {
    const d = M(
      l.id,
      s
    );
    i = e ? d.filter((u) => u.type === e) : d;
  } else
    i = [];
  if (r && r.length > 0) {
    const d = r.map((u) => u.id);
    i = i.filter((u) => d.indexOf(u.id) < 0);
  }
  if (i.length < t) {
    const d = K(o, s);
    for (let u = i.length; u < t; u++) {
      let h;
      e ? h = L(d, e, i) : h = N(d, i), console.log(
        `Turning ${h.login} into an ADML of ${o.id} - ${o.name}`
      ), Q(h, o, s), i.push(h);
    }
  }
  return i.slice(0, t);
}
function Je(o, e, t) {
  try {
    const r = _(__ENV.ADMC_LOGIN, __ENV.ADMC_PASSWORD), s = Array.isArray(e) ? e : [e];
    for (let n of s)
      c.put(
        `${p}/directory/structure/${n.id}/link/${o.id}`,
        null,
        { headers: a(r) }
      );
  } finally {
    P(t);
  }
}
const C = __ENV.ROOT_URL;
function v(o, e) {
  let t = c.get(`${C}/appregistry/roles`, {
    headers: a(e)
  });
  return JSON.parse(t.body).filter((s) => s.name === o)[0];
}
function xe(o, e) {
  const t = `${o} - All - Stress Test`;
  let r = v(t, e);
  if (r)
    console.log(`Role ${t} already existed`);
  else {
    let s = c.get(
      `${C}/appregistry/applications/actions?actionType=WORKFLOW`,
      { headers: a(e) }
    );
    f(s, { "get workflow actions": (u) => u.status == 200 });
    const l = JSON.parse(s.body).filter(
      (u) => u.name === o
    )[0].actions.map((u) => u[0]), i = a(e);
    i["content-type"] = "application/json";
    const d = {
      role: t,
      actions: l
    };
    s = c.post(`${C}/appregistry/role`, JSON.stringify(d), {
      headers: i
    }), console.log(s), f(s, { "save role ok": (u) => u.status == 201 }), r = v(t, e);
  }
  return r;
}
function D(o, e) {
  const t = a(e);
  t["Accept-Language"] = "en";
  let r = c.get(
    `${C}/appregistry/groups/roles?structureId=${o}&translate=false`,
    { headers: t }
  );
  return f(r, {
    "get structure roles should be ok": (s) => s.status == 200
  }), JSON.parse(r.body);
}
const Z = __ENV.ROOT_URL, Pe = [
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
], Le = [
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
function Fe(o, e) {
  let t = a(e);
  const r = new S();
  r.append("file", c.file(o, "file.txt")), t["Content-Type"] = "multipart/form-data; boundary=" + r.boundary;
  let s = c.post(`${Z}/workspace/document`, r.body(), { headers: t });
  return f(s, {
    "upload doc ok": (n) => n.status === 201
  }), JSON.parse(s.body);
}
const ee = __ENV.ROOT_URL;
function je(o, e, t) {
  const r = a(t);
  r["content-type"] = "application/json";
  const s = JSON.stringify(e);
  return c.put(`${ee}/workspace/share/resource/${o}`, s, {
    headers: r
  });
}
const oe = __ENV.ROOT_URL;
function Ge(o, e, t) {
  const r = c.post(
    `${oe}/communication/v2/group/${o}/communique/${e}`,
    "{}",
    { headers: a(t) }
  );
  return r.status !== 200 && (console.error(
    `Error while adding communication between ${o} -> ${e}`
  ), console.error(r), k(`could not add communication between ${o} -> ${e}`)), r;
}
function te(o, e, t = 200) {
  const r = t || 200;
  o.status != r && (console.error(`ko - ${e}. Expecting ${r} but got ${o.status}`), console.error(o), k(e + " ko"));
}
function Ve(o, e, t = 500) {
  re(
    () => o && o.code === t,
    `[${o.request.method}]${o.url} returns code ${t}: ${e} `
  );
}
function Me(o, e, t = 500) {
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
function Be(o) {
  let e = c.get(`${se}/userbook/search/criteria`, {
    headers: a(o)
  });
  return JSON.parse(e.body);
}
export {
  F as ADML_FILTER,
  J as BASE_URL,
  w as Session,
  $ as SessionMode,
  Pe as WS_MANAGER_SHARE,
  Le as WS_READER_SHARE,
  z as activateUser,
  H as activateUsers,
  j as addCommRuleToGroup,
  Ge as addCommunicationBetweenGroups,
  re as assertCondition,
  Ve as assertKo,
  te as assertOk,
  be as attachStructureAsChild,
  Je as attachUserToStructures,
  Ne as attributePositions,
  fe as authenticateOAuth2,
  _ as authenticateWeb,
  Me as checkReturnCode,
  ge as checkStatus,
  xe as createAndSetRole,
  ye as createBroadcastGroup,
  X as createDefaultStructure,
  we as createEmptyStructure,
  Se as createEmptyStructureNoCheck,
  I as createPosition,
  De as createPositionOrFail,
  q as createStructure,
  he as createUser,
  Ie as deletePosition,
  Ue as getAdmlsOrMakThem,
  R as getBroadcastGroup,
  pe as getConnectedUserId,
  a as getHeaders,
  me as getMetricValue,
  Ae as getOrCreatePosition,
  Oe as getParentRole,
  Y as getPositionByIdOrFail,
  Ee as getPositionsOfStructure,
  b as getProfileGroupOfStructure,
  V as getProfileGroupsOfStructure,
  N as getRandomUser,
  L as getRandomUserWithProfile,
  v as getRoleByName,
  D as getRolesOfStructure,
  O as getSchoolByName,
  Be as getSearchCriteria,
  $e as getStudentRole,
  G as getTeacherRole,
  ke as getUserProfileOrFail,
  M as getUsersOfGroup,
  K as getUsersOfSchool,
  Re as importUsers,
  _e as initStructure,
  Ce as linkRoleToUsers,
  de as logout,
  Q as makeAdml,
  Te as searchPositions,
  ue as searchUser,
  je as shareFile,
  P as switchSession,
  We as triggerImport,
  ve as updatePosition,
  Fe as uploadFile
};
