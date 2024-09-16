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
  constructor(e, t, r, n) {
    y(this, "expiresAt");
    y(this, "token");
    y(this, "mode");
    y(this, "cookies");
    this.token = e, this.mode = t, this.cookies = n, this.expiresAt = Date.now() + r * 1e3 - 3e3;
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
    "should get an OK response": (n) => n.status == 200
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
  const n = c.post(`${g}/auth/login`, r, {
    redirects: 0
  });
  if (n.status !== 302 && k("should redirect connected user to login page"), (n.cookies.oneSessionId === null || n.cookies.oneSessionId === void 0) && k("login process should have set an auth cookie"), !n.cookies.oneSessionId)
    return console.error(`Could not get oneSessionId for ${o}`), null;
  t.set(g, "oneSessionId", n.cookies.oneSessionId[0].value);
  const s = Object.keys(n.cookies).map((l) => ({ name: l, value: n.cookies[l][0].value }));
  return new w(
    n.cookies.oneSessionId[0].value,
    $.COOKIE,
    x,
    s
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
  let n = {
    grant_type: "password",
    username: o,
    password: e,
    client_id: t,
    client_secret: r,
    scope: "timeline userbook blog lvs actualites pronote schoolbook support viescolaire zimbra conversation directory homeworks userinfo workspace portal cas sso presences incidents competences diary edt infra auth"
  }, s = c.post(`${g}/auth/oauth2/token`, n, {
    redirects: 0
  });
  f(s, {
    "should get an OK response for authentication": (i) => i.status == 200,
    "should have set an access token": (i) => !!i.json("access_token")
  });
  const l = s.json("access_token");
  return new w(
    l,
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
    "should get an OK response": (n) => n.status == 200
  });
  const r = t.body.split(`
`);
  for (let n of r)
    if (n.indexOf(`${o} `) === 0)
      return parseFloat(n.substring(o.length + 1).trim());
  return console.error("Metric", o, "not found"), null;
}, m = __ENV.ROOT_URL, F = "AdminLocal";
function ye(o, e, t) {
  let r = R(o, e, t);
  if (r)
    console.log("Broadcast group already existed");
  else {
    console.log("Creating broadcast group");
    const n = a(t);
    n["content-type"] = "application/json";
    let s = JSON.stringify({
      name: o,
      structureId: e.id,
      subType: "BroadcastGroup"
    }), l = c.post(`${m}/directory/group`, s, { headers: n });
    f(l, {
      "create broadcast group": (u) => u.status === 201
    });
    const i = JSON.parse(l.body).id;
    s = JSON.stringify({
      name: o,
      autolinkTargetAllStructs: !0,
      autolinkTargetStructs: [],
      autolinkUsersFromGroups: ["Teacher"]
    }), l = c.put(`${m}/directory/group/${i}`, s, { headers: n }), f(l, {
      "set broadcast group for teachers": (u) => u.status === 200
    });
    const p = G(e, t).id;
    j(i, [p], t), r = R(o, e, t);
  }
  return r;
}
function j(o, e, t) {
  const r = a(t);
  r["content-type"] = "application/json";
  for (let n of e) {
    let s = c.post(
      `${m}/communication/v2/group/${n}/communique/${o}`,
      "{}",
      { headers: r }
    );
    s.status !== 200 && (console.error(s), k(`Cannot open comm rule from ${n} to ${o}`));
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
  return I(e.id, t).filter((n) => {
    const s = n.name.toLowerCase();
    return s === `${e.name} group ${o}.`.toLowerCase() || s === `${o} from group ${e.name}.`.toLowerCase();
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
    "get structure profile groups should be ok": (n) => n.status == 200
  }), JSON.parse(r.body);
}
function R(o, e, t) {
  const r = a(t);
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
  const t = a(e);
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
    headers: a(e)
  });
  return JSON.parse(t.body).filter(
    (r) => r.name === o
  )[0];
}
function K(o, e) {
  let t = c.get(`${d}/directory/structure/${o.id}/users`, {
    headers: a(e)
  });
  if (t.status !== 200)
    throw `Impossible to get users of ${o.id}`;
  return JSON.parse(t.body);
}
function H(o, e) {
  let t = c.get(`${d}/directory/structure/${o.id}/users`, {
    headers: a(e)
  });
  t.status != 200 && k(`Cannot fetch users of structure ${o.id} : ${t}`);
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
    t.status !== 302 && (console.error(t), k(
      `Could not activate user ${o.login} : ${t.status} - ${t.body}`
    ));
  }
}
function Ce(o, e, t, r) {
  const s = I(o.id, r).filter(
    (l) => t.indexOf(l.name) >= 0
  );
  for (let l of s)
    if (l.roles.indexOf(e.name) >= 0)
      console.log("Role already attributed to teachers");
    else {
      const i = a(r);
      i["content-type"] = "application/json";
      const p = { headers: i }, u = JSON.stringify({
        groupId: l.id,
        roleIds: (l.roles || []).concat([e.id])
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
function we(o, e, t) {
  let r = O(o, t);
  if (r)
    console.log(`Structure ${o} already exists`);
  else {
    const n = a(t);
    n["content-type"] = "application/json";
    const s = JSON.stringify({
      hasApp: e,
      name: o
    });
    let l = c.post(`${d}/directory/school`, s, n);
    l.status !== 201 && (console.error(l.body), k(`Could not create structure ${o}`)), r = O(o, t);
  }
  return r;
}
function Se(o, e, t) {
  const r = a(t);
  r["content-type"] = "application/json";
  const n = JSON.stringify({
    hasApp: e,
    name: o
  });
  let s = c.post(`${d}/directory/school`, n, r);
  return s.status !== 201 && (console.error(s.body), k(`Could not create structure ${o}`)), s;
}
function _e(o, e = "default") {
  const t = _(__ENV.ADMC_LOGIN, __ENV.ADMC_PASSWORD), r = X(o, e);
  return H(r, t), r;
}
function X(o, e = "default") {
  const t = o || "General", r = _(__ENV.ADMC_LOGIN, __ENV.ADMC_PASSWORD), n = "https://raw.githubusercontent.com/edificeio/edifice-k6-commons/develop/data/structure", s = c.get(`${n}/enseignants.${e}.csv`).body, l = c.get(`${n}/eleves.${e}.csv`).body, i = c.get(`${n}/responsables.${e}.csv`).body;
  return q(
    t,
    {
      teachers: s,
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
    const n = new S();
    n.append("type", "CSV"), n.append("structureName", o);
    let s, l, i;
    "teachers" in e ? (s = e.teachers, l = e.students, i = e.responsables) : s = e, n.append("Teacher", c.file(s, "enseignants.csv")), l && n.append("Student", c.file(l, "eleves.csv")), i && n.append("Relative", c.file(i, "responsables.csv"));
    const p = a(t);
    p["Content-Type"] = "multipart/form-data; boundary=" + n.boundary;
    const u = { headers: p };
    c.post(
      `${d}/directory/wizard/import`,
      n.body(),
      u
    ).status != 200 && k(`Could not create structure ${o}`), r = O(o, t);
  }
  return r;
}
function be(o, e, t) {
  let r;
  if ((e.parents || []).map((s) => s.id).indexOf(o.id) >= 0)
    console.log(
      `${e.name} is already a child of ${o.name}`
    ), r = !1;
  else {
    const s = a(t);
    s["content-type"] = "application/json", c.put(
      `${d}/directory/structure/${e.id}/parent/${o.id}`,
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
  let n, s, l;
  "teachers" in e ? (n = e.teachers, s = e.students, l = e.responsables) : n = e, r.append("Teacher", c.file(n, "enseignants.csv")), s && r.append("Student", c.file(s, "eleves.csv")), l && r.append("Relative", c.file(l, "responsables.csv"));
  const i = a(t);
  i["Content-Type"] = "multipart/form-data; boundary=" + r.boundary;
  const p = { headers: i };
  return c.post(
    `${d}/directory/wizard/import`,
    r.body(),
    p
  );
}
function We(o) {
  const e = a(o);
  return e["content-type"] = "application/json", c.post(`${d}/directory/import`, "{}", { headers: e });
}
function D(o, e, t) {
  const r = a(t);
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
function ve(o, e) {
  const t = a(e);
  t["content-type"] = "application/json";
  const r = JSON.stringify(o);
  return c.put(`${d}/directory/positions/${o.id}`, r, {
    redirects: 0,
    headers: t
  });
}
function Ae(o, e, t) {
  let r = D(o, e, t);
  if (r.status === 409) {
    const n = JSON.parse(
      r.body
    ).existingPositionId;
    return Y(n, t);
  } else
    return JSON.parse(r.body);
}
function Ne(o, e, t) {
  const r = a(t);
  r["content-type"] = "application/json";
  const n = {};
  return e != null && (n.positionIds = e.map((l) => l.id)), c.put(
    `${d}/directory/user/${o.id}`,
    JSON.stringify(n),
    {
      headers: r
    }
  );
}
function De(o, e) {
  const t = a(e);
  return t["content-type"] = "application/json", c.del(`${d}/directory/positions/${o}`, null, {
    redirects: 0,
    headers: t
  });
}
function Y(o, e) {
  let t = c.get(`${d}/directory/positions/${o}`, {
    headers: a(e)
  });
  return JSON.parse(t.body);
}
function Ie(o, e, t) {
  const r = D(o, e, t);
  return r.status !== 201 && (console.error(r), k(
    `Could not create position ${o} on structure ${e.name}`
  )), JSON.parse(r.body);
}
function Te(o, e) {
  const t = a(e), r = new A(`${d}/directory/positions`);
  return r.searchParams.append("content", o), c.get(r.toString(), { headers: t });
}
function Q(o, e, t) {
  const r = a(t);
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
  const l = V(
    o.id,
    n
  ).filter(
    (p) => p.filter === F
  )[0];
  let i;
  if (l) {
    const p = M(
      l.id,
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
function Ue(o, e, t) {
  try {
    const r = _(__ENV.ADMC_LOGIN, __ENV.ADMC_PASSWORD), n = Array.isArray(e) ? e : [e];
    for (let s of n)
      c.put(
        `${d}/directory/structure/${s.id}/link/${o.id}`,
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
  return JSON.parse(t.body).filter((n) => n.name === o)[0];
}
function Je(o, e) {
  const t = `${o} - All - Stress Test`;
  let r = v(t, e);
  if (r)
    console.log(`Role ${t} already existed`);
  else {
    let n = c.get(
      `${C}/appregistry/applications/actions?actionType=WORKFLOW`,
      { headers: a(e) }
    );
    f(n, { "get workflow actions": (u) => u.status == 200 });
    const l = JSON.parse(n.body).filter(
      (u) => u.name === o
    )[0].actions.map((u) => u[0]), i = a(e);
    i["content-type"] = "application/json";
    const p = {
      role: t,
      actions: l
    };
    n = c.post(`${C}/appregistry/role`, JSON.stringify(p), {
      headers: i
    }), console.log(n), f(n, { "save role ok": (u) => u.status == 201 }), r = v(t, e);
  }
  return r;
}
function I(o, e) {
  const t = a(e);
  t["Accept-Language"] = "en";
  let r = c.get(
    `${C}/appregistry/groups/roles?structureId=${o}&translate=false`,
    { headers: t }
  );
  return f(r, {
    "get structure roles should be ok": (n) => n.status == 200
  }), JSON.parse(r.body);
}
const Z = __ENV.ROOT_URL, xe = [
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
], Pe = [
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
function Le(o, e) {
  let t = a(e);
  const r = new S();
  r.append("file", c.file(o, "file.txt")), t["Content-Type"] = "multipart/form-data; boundary=" + r.boundary;
  let n = c.post(`${Z}/workspace/document`, r.body(), { headers: t });
  return f(n, {
    "upload doc ok": (s) => s.status === 201
  }), JSON.parse(n.body);
}
const ee = __ENV.ROOT_URL;
function Fe(o, e, t) {
  const r = a(t);
  r["content-type"] = "application/json";
  const n = JSON.stringify(e);
  return c.put(`${ee}/workspace/share/resource/${o}`, n, {
    headers: r
  });
}
const oe = __ENV.ROOT_URL;
function je(o, e, t) {
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
function Ge(o, e, t = 500) {
  re(
    () => o && o.code === t,
    `[${o.request.method}]${o.url} returns code ${t}: ${e} `
  );
}
function Ve(o, e, t = 500) {
  const r = {};
  return r[`${e} (expects ${t})`] = () => {
    const n = o && o.status === t;
    return n || (console.warn("Expected ", t, " but got ", o.status), console.warn(o)), n;
  }, f({}, r);
}
function re(o, e) {
  const t = {};
  t[e] = () => o, f({}, t) || k(e);
}
const ne = __ENV.ROOT_URL;
function Me(o) {
  let e = c.get(`${ne}/userbook/search/criteria`, {
    headers: a(o)
  });
  return JSON.parse(e.body);
}
export {
  F as ADML_FILTER,
  J as BASE_URL,
  w as Session,
  $ as SessionMode,
  xe as WS_MANAGER_SHARE,
  Pe as WS_READER_SHARE,
  z as activateUser,
  H as activateUsers,
  j as addCommRuleToGroup,
  je as addCommunicationBetweenGroups,
  re as assertCondition,
  Ge as assertKo,
  te as assertOk,
  be as attachStructureAsChild,
  Ue as attachUserToStructures,
  Ne as attributePositions,
  fe as authenticateOAuth2,
  _ as authenticateWeb,
  Ve as checkReturnCode,
  ge as checkStatus,
  Je as createAndSetRole,
  ye as createBroadcastGroup,
  X as createDefaultStructure,
  we as createEmptyStructure,
  Se as createEmptyStructureNoCheck,
  D as createPosition,
  Ie as createPositionOrFail,
  q as createStructure,
  he as createUser,
  De as deletePosition,
  Ee as getAdmlsOrMakThem,
  R as getBroadcastGroup,
  pe as getConnectedUserId,
  a as getHeaders,
  me as getMetricValue,
  Ae as getOrCreatePosition,
  Oe as getParentRole,
  Y as getPositionByIdOrFail,
  b as getProfileGroupOfStructure,
  V as getProfileGroupsOfStructure,
  N as getRandomUser,
  L as getRandomUserWithProfile,
  v as getRoleByName,
  I as getRolesOfStructure,
  O as getSchoolByName,
  Me as getSearchCriteria,
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
  Fe as shareFile,
  P as switchSession,
  We as triggerImport,
  ve as updatePosition,
  Le as uploadFile
};
