var J = Object.defineProperty;
var x = (o, e, t) => e in o ? J(o, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : o[e] = t;
var y = (o, e, t) => (x(o, typeof e != "symbol" ? e + "" : e, t), t);
import c from "k6/http";
import { check as f, fail as m } from "k6";
import { FormData as C } from "https://jslib.k6.io/formdata/0.0.2/index.js";
import { URL as E } from "https://jslib.k6.io/url/1.0.0/index.js";
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
const L = __ENV.BASE_URL, M = 30 * 60, g = __ENV.ROOT_URL, l = function(o) {
  let e = {};
  return o ? o.mode === $.COOKIE ? e = { "x-xsrf-token": o.getCookie("XSRF-TOKEN") || "" } : o.mode === $.OAUTH2 ? e = { Authorization: `Bearer ${o.token}` } : e = {} : e = {}, __ENV.REQUEST_TIMEOUT && (e.requestTimeout = __ENV.REQUEST_TIMEOUT, e.timeout = __ENV.REQUEST_TIMEOUT), e;
}, de = function(o, e) {
  const t = c.get(`${g}/conversation/visible?search=${o}`, {
    headers: l(e)
  });
  return f(t, {
    "should get an OK response": (n) => n.status == 200
  }), t.json("users")[0].id;
}, fe = function(o) {
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
    password: e || __ENV.DEFAULT_PASSWORD || "password",
    callBack: "",
    detail: ""
  };
  const n = c.post(`${g}/auth/login`, r, {
    redirects: 0
  });
  if (n.status !== 302 && m("should redirect connected user to login page"), (n.cookies.oneSessionId === null || n.cookies.oneSessionId === void 0) && m("login process should have set an auth cookie"), !n.cookies.oneSessionId)
    return console.error(`Could not get oneSessionId for ${o}`), null;
  t.set(g, "oneSessionId", n.cookies.oneSessionId[0].value);
  const s = Object.keys(n.cookies).map((a) => ({ name: a, value: n.cookies[a][0].value }));
  return new w(
    n.cookies.oneSessionId[0].value,
    $.COOKIE,
    M,
    s
  );
}, ge = function(o) {
  const e = c.get(`${g}/auth/logout?callback=/`, {
    headers: l(o)
  });
  return c.cookieJar().clear(g), e;
}, P = function(o) {
  const e = c.cookieJar();
  return o ? (e.set(g, "oneSessionId", o.token), e.set(g, "XSRF-TOKEN", o.getCookie("XSRF-TOKEN") || "")) : (e.delete(g, "oneSessionId"), e.delete(g, "XSRF-TOKEN")), o;
}, me = function(o, e, t, r) {
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
  const a = s.json("access_token");
  return new w(
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
function V(o, e, t) {
  const r = o.filter((n) => n.type === e);
  return N(r, t);
}
function he(o, e, t) {
  const r = {};
  r[e] = (s) => s.status === t;
  const n = f(o, r);
  return n || console.error(e, o), n;
}
function ke(o, e) {
  let t = c.get(`${g}/directory/user/${o}?manual-groups=true`, {
    headers: l(e)
  });
  return t.status !== 200 && (console.error(t), m("Could not get user profile")), JSON.parse(t.body);
}
function ye(o, e) {
  const t = o, r = l(e);
  return r["content-type"] = "application/x-www-form-urlencoded;charset=UTF-8", c.post(`${g}/directory/api/user`, t, {
    headers: r
  });
}
const $e = function(o, e) {
  const t = c.get(`${L}/metrics`, {
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
}, k = __ENV.ROOT_URL, j = "AdminLocal";
function Oe(o, e, t) {
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
    }), a = c.post(`${k}/directory/group`, s, { headers: n });
    f(a, {
      "create broadcast group": (u) => u.status === 201
    });
    const i = JSON.parse(a.body).id;
    s = JSON.stringify({
      name: o,
      autolinkTargetAllStructs: !0,
      autolinkTargetStructs: [],
      autolinkUsersFromGroups: ["Teacher"]
    }), a = c.put(`${k}/directory/group/${i}`, s, { headers: n }), f(a, {
      "set broadcast group for teachers": (u) => u.status === 200
    });
    const d = G(e, t).id;
    F(i, [d], t), r = R(o, e, t);
  }
  return r;
}
function F(o, e, t) {
  const r = l(t);
  r["content-type"] = "application/json";
  for (let n of e) {
    let s = c.post(
      `${k}/communication/v2/group/${n}/communique/${o}`,
      "{}",
      { headers: r }
    );
    s.status !== 200 && (console.error(s), m(`Cannot open comm rule from ${n} to ${o}`));
  }
}
function G(o, e) {
  return b("teachers", o, e);
}
function Se(o, e) {
  return b("students", o, e);
}
function Ce(o, e) {
  return b("relatives", o, e);
}
function b(o, e, t) {
  return W(e.id, t).filter((n) => {
    const s = n.name.toLowerCase();
    return s === `${e.name} group ${o}.`.toLowerCase() || s === `${o} from group ${e.name}.`.toLowerCase();
  })[0];
}
function B(o, e) {
  const t = l(e);
  t["Accept-Language"] = "en";
  let r = c.get(
    `${k}/directory/group/admin/list?structureId=${o}&translate=false`,
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
    `${k}/directory/group/admin/list?translate=false&structureId=${e.id}`,
    { headers: r }
  );
  return JSON.parse(n.body).filter(
    (s) => s.subType === "BroadcastGroup" && s.name === o
  )[0];
}
function z(o, e) {
  const t = l(e);
  t["content-type"] = "application/json";
  let r = c.get(
    `${k}/directory/user/admin/list?groupId=${o}`,
    { headers: t }
  );
  return JSON.parse(r.body);
}
const p = __ENV.ROOT_URL, K = new E(p).hostname, v = __ENV.DEFAULT_PASSWORD || "password";
function O(o, e) {
  let t = c.get(`${p}/directory/structure/admin/list`, {
    headers: l(e)
  });
  return JSON.parse(t.body).filter(
    (r) => r.name === o
  )[0];
}
function A(o, e) {
  let t = c.get(`${p}/directory/structure/${o.id}/users`, {
    headers: l(e)
  });
  if (t.status !== 200)
    throw `Impossible to get users of ${o.id}`;
  return JSON.parse(t.body);
}
function H(o, e) {
  let t = c.get(`${p}/directory/structure/${o.id}/users`, {
    headers: l(e)
  });
  t.status != 200 && m(`Cannot fetch users of structure ${o.id} : ${t}`);
  const r = JSON.parse(t.body);
  for (let n = 0; n < r.length; n++) {
    const s = r[n];
    q(s);
  }
}
function q(o) {
  if (o.code) {
    const e = {};
    e.login = o.login, e.activationCode = o.code, e.password = v, e.confirmPassword = v, e.acceptCGU = "true";
    const t = c.post(`${p}/auth/activation`, e, {
      redirects: 0,
      headers: { Host: K }
    });
    t.status !== 302 && (console.error(t), m(
      `Could not activate user ${o.login} : ${t.status} - ${t.body}`
    ));
  }
}
function we(o, e, t, r) {
  const s = W(o.id, r).filter(
    (a) => t.indexOf(a.name) >= 0
  );
  for (let a of s)
    if (a.roles.indexOf(e.name) >= 0)
      console.log("Role already attributed to teachers");
    else {
      const i = l(r);
      i["content-type"] = "application/json";
      const d = { headers: i }, u = JSON.stringify({
        groupId: a.id,
        roleIds: (a.roles || []).concat([e.id])
      }), h = c.post(
        `${p}/appregistry/authorize/group?schoolId=${o.id}`,
        u,
        d
      );
      f(h, {
        "link role to structure": (U) => U.status == 200
      });
    }
}
function _e(o, e, t) {
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
    let a = c.post(`${p}/directory/school`, s, n);
    a.status !== 201 && (console.error(a.body), m(`Could not create structure ${o}`)), r = O(o, t);
  }
  return r;
}
function be(o, e, t) {
  const r = l(t);
  r["content-type"] = "application/json";
  const n = JSON.stringify({
    hasApp: e,
    name: o
  });
  let s = c.post(`${p}/directory/school`, n, r);
  return s.status !== 201 && (console.error(s.body), m(`Could not create structure ${o}`)), s;
}
function Re(o, e = "default") {
  const t = _(__ENV.ADMC_LOGIN, __ENV.ADMC_PASSWORD), r = X(o, e);
  return H(r, t), r;
}
function X(o, e = "default") {
  const t = o || "General", r = _(__ENV.ADMC_LOGIN, __ENV.ADMC_PASSWORD), n = "https://raw.githubusercontent.com/edificeio/edifice-k6-commons/develop/data/structure", s = c.get(`${n}/enseignants.${e}.csv`).body, a = c.get(`${n}/eleves.${e}.csv`).body, i = c.get(`${n}/responsables.${e}.csv`).body;
  return Q(
    t,
    {
      teachers: s,
      students: a,
      responsables: i
    },
    r
  );
}
function Q(o, e, t) {
  let r = O(o, t);
  if (r)
    console.log("School already exists");
  else {
    const n = new C();
    n.append("type", "CSV"), n.append("structureName", o);
    let s, a, i;
    "teachers" in e ? (s = e.teachers, a = e.students, i = e.responsables) : s = e, n.append("Teacher", c.file(s, "enseignants.csv")), a && n.append("Student", c.file(a, "eleves.csv")), i && n.append("Relative", c.file(i, "responsables.csv"));
    const d = l(t);
    d["Content-Type"] = "multipart/form-data; boundary=" + n.boundary;
    const u = { headers: d };
    c.post(
      `${p}/directory/wizard/import`,
      n.body(),
      u
    ).status != 200 && m(`Could not create structure ${o}`), r = O(o, t);
  }
  return r;
}
function Y(o, e, t, r = 0) {
  let n;
  if ((e.parents || []).map((a) => a.id).indexOf(o.id) >= 0)
    console.log(
      `${e.name} is already a child of ${o.name}`
    ), n = !1;
  else {
    const a = l(t);
    a["content-type"] = "application/json";
    let i = c.put(
      `${p}/directory/structure/${e.id}/parent/${o.id}`,
      "{}"
    );
    i.status !== 200 && (r > 0 ? (console.log(
      "Retrying to attach structure as a child because we got ",
      i.status,
      i.body
    ), Y(
      o,
      e,
      t,
      r - 1
    )) : m(
      `Could not attach structure ${e.name} as a child of ${o.name}`
    )), n = !0;
  }
  return n;
}
function ve(o, e, t) {
  const r = new C();
  r.append("type", "CSV"), r.append("structureName", o.name), r.append("structureId", o.id), r.append("structureExternalId", o.externalId);
  let n, s, a;
  "teachers" in e ? (n = e.teachers, s = e.students, a = e.responsables) : n = e, r.append("Teacher", c.file(n, "enseignants.csv")), s && r.append("Student", c.file(s, "eleves.csv")), a && r.append("Relative", c.file(a, "responsables.csv"));
  const i = l(t);
  i["Content-Type"] = "multipart/form-data; boundary=" + r.boundary;
  const d = { headers: i };
  return c.post(
    `${p}/directory/wizard/import`,
    r.body(),
    d
  );
}
function Te(o) {
  const e = l(o);
  return e["content-type"] = "application/json", c.post(`${p}/directory/import`, "{}", { headers: e });
}
function I(o, e, t) {
  const r = l(t);
  r["content-type"] = "application/json";
  const n = JSON.stringify({
    name: o,
    structureId: e.id
  });
  return c.post(`${p}/directory/positions`, n, {
    redirects: 0,
    headers: r
  });
}
function Ee(o, e) {
  const t = l(e);
  t["content-type"] = "application/json";
  const r = JSON.stringify(o);
  return c.put(`${p}/directory/positions/${o.id}`, r, {
    redirects: 0,
    headers: t
  });
}
function Ne(o, e, t) {
  let r = I(o, e, t);
  if (r.status === 409) {
    const n = JSON.parse(
      r.body
    ).existingPositionId;
    return Z(n, t);
  } else
    return JSON.parse(r.body);
}
function Ae(o, e, t) {
  const r = l(t);
  r["content-type"] = "application/json";
  const n = {};
  return e != null && (n.positionIds = e.map((a) => a.id)), c.put(
    `${p}/directory/user/${o.id}`,
    JSON.stringify(n),
    {
      headers: r
    }
  );
}
function Ie(o, e) {
  const t = l(e);
  return t["content-type"] = "application/json", c.del(`${p}/directory/positions/${o}`, null, {
    redirects: 0,
    headers: t
  });
}
function Z(o, e) {
  let t = c.get(`${p}/directory/positions/${o}`, {
    headers: l(e)
  });
  return JSON.parse(t.body);
}
function We(o, e, t) {
  const r = I(o, e, t);
  return r.status !== 201 && (console.error(r), m(
    `Could not create position ${o} on structure ${e.name}`
  )), JSON.parse(r.body);
}
function De(o, e) {
  const t = l(e), r = new E(`${p}/directory/positions`);
  return r.searchParams.append("content", o), c.get(r.toString(), { headers: t });
}
function Ue(o, e) {
  const t = l(e), r = c.get(
    `${p}/directory/positions?structureId=${o.id}`,
    { headers: t }
  );
  return JSON.parse(r.body);
}
function ee(o, e, t) {
  const r = l(t);
  r["content-type"] = "application/json";
  const n = JSON.stringify({
    functionCode: "ADMIN_LOCAL",
    inherit: "s",
    scope: [e.id]
  });
  let s = c.post(
    `${p}/directory/user/function/${o.id}`,
    n,
    { headers: r }
  );
  return D(s, "user should be made ADML"), s;
}
function oe(o, e, t) {
  const r = l(t);
  r["content-type"] = "application/json";
  const n = JSON.stringify({
    functionCode: "ADMIN_LOCAL",
    inherit: "s",
    scope: e
  });
  let s = c.post(
    `${p}/directory/user/function/${o.id}`,
    n,
    { headers: r }
  );
  return D(s, "user should be made ADML"), s;
}
function Je(o, e, t, r, n) {
  const a = B(
    o.id,
    n
  ).filter(
    (d) => d.filter === j
  )[0];
  let i;
  if (a) {
    const d = z(
      a.id,
      n
    );
    i = e ? d.filter((u) => u.type === e) : d;
  } else
    i = [];
  if (r && r.length > 0) {
    const d = r.map((u) => u.id);
    i = i.filter((u) => d.indexOf(u.id) < 0);
  }
  if (i.length < t) {
    const d = A(o, n);
    for (let u = i.length; u < t; u++) {
      let h;
      e ? h = V(d, e, i) : h = N(d, i), console.log(
        `Turning ${h.login} into an ADML of ${o.id} - ${o.name}`
      ), ee(h, o, n), i.push(h);
    }
  }
  return i.slice(0, t);
}
function xe(o, e, t) {
  const r = A(o, t);
  console.log(`ADMLization of ${r.length} users...`);
  let n = 0;
  for (let s of r)
    oe(s, e, t), n++, console.log(`${n} users adml-ized`);
  console.log(`....ADMLization of ${r.length} users done`);
}
function Le(o, e, t) {
  try {
    const r = new Set(o.structures.map((a) => a.id)), n = t || _(__ENV.ADMC_LOGIN, __ENV.ADMC_PASSWORD), s = Array.isArray(e) ? e : [e];
    for (let a of s)
      r.has(a.id) || c.put(
        `${p}/directory/structure/${a.id}/link/${o.id}`,
        null,
        { headers: l(n) }
      );
  } finally {
    P(t);
  }
}
function Me(o, e, t, r) {
  const n = new C();
  n.append("type", "CSV"), n.append("structureName", o.name), n.append("structureId", o.id), n.append("structureExternalId", o.externalId), n.append("valid", "true"), t.predelete !== void 0 && n.append("predelete", String(t.predelete)), t.transition !== void 0 && n.append("transition", String(t.transition));
  let s, a, i;
  "teachers" in e ? (s = e.teachers, a = e.students, i = e.responsables) : s = e, n.append("Teacher", c.file(s, "enseignants.csv")), a && n.append("Student", c.file(a, "eleves.csv")), i && n.append("Relative", c.file(i, "responsables.csv"));
  const d = l(r);
  d["Content-Type"] = "multipart/form-data; boundary=" + n.boundary;
  const u = { headers: d };
  return c.post(`${p}/directory/wizard/import`, n.body(), u);
}
function Pe(o, e) {
  const t = l(e);
  if (t["content-type"] = "application/json", console.log("initializing communication rules..."), c.put(
    `${p}/communication/init/rules`,
    JSON.stringify({ structures: o.map((n) => n.id) }),
    { headers: t }
  ).status === 200) {
    console.log(`Initializing ${o.length} structures....`);
    let n = 0;
    for (let s of o)
      c.put(
        `${p}/communication/rules/${s.id}`,
        JSON.stringify({ structures: o.map((i) => i.id) }),
        { headers: t }
      ).status !== 200 && console.log(
        `... initialization failed for structure ${s.id} - ${s.name}`
      ), n++, n % 20 === 0 && console.log(`${n} structures initialized...`);
  } else
    console.log("... initialization failed");
}
const S = __ENV.ROOT_URL;
function T(o, e) {
  let t = c.get(`${S}/appregistry/roles`, {
    headers: l(e)
  });
  return JSON.parse(t.body).filter((n) => n.name === o)[0];
}
function Ve(o, e) {
  const t = `${o} - All - Stress Test`;
  let r = T(t, e);
  if (r)
    console.log(`Role ${t} already existed`);
  else {
    let n = c.get(
      `${S}/appregistry/applications/actions?actionType=WORKFLOW`,
      { headers: l(e) }
    );
    f(n, { "get workflow actions": (u) => u.status == 200 });
    const a = JSON.parse(n.body).filter(
      (u) => u.name === o
    )[0].actions.map((u) => u[0]), i = l(e);
    i["content-type"] = "application/json";
    const d = {
      role: t,
      actions: a
    };
    n = c.post(`${S}/appregistry/role`, JSON.stringify(d), {
      headers: i
    }), console.log(n), f(n, { "save role ok": (u) => u.status == 201 }), r = T(t, e);
  }
  return r;
}
function W(o, e) {
  const t = l(e);
  t["Accept-Language"] = "en";
  let r = c.get(
    `${S}/appregistry/groups/roles?structureId=${o}&translate=false`,
    { headers: t }
  );
  return f(r, {
    "get structure roles should be ok": (n) => n.status == 200
  }), JSON.parse(r.body);
}
const te = __ENV.ROOT_URL, je = [
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
], Fe = [
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
function Ge(o, e) {
  let t = l(e);
  const r = new C();
  r.append("file", c.file(o, "file.txt")), t["Content-Type"] = "multipart/form-data; boundary=" + r.boundary;
  let n = c.post(`${te}/workspace/document`, r.body(), { headers: t });
  return f(n, {
    "upload doc ok": (s) => s.status === 201
  }), JSON.parse(n.body);
}
const re = __ENV.ROOT_URL;
function Be(o, e, t) {
  const r = l(t);
  r["content-type"] = "application/json";
  const n = JSON.stringify(e);
  return c.put(`${re}/workspace/share/resource/${o}`, n, {
    headers: r
  });
}
const ne = __ENV.ROOT_URL;
function ze(o, e, t) {
  const r = c.post(
    `${ne}/communication/v2/group/${o}/communique/${e}`,
    "{}",
    { headers: l(t) }
  );
  return r.status !== 200 && (console.error(
    `Error while adding communication between ${o} -> ${e}`
  ), console.error(r), m(`could not add communication between ${o} -> ${e}`)), r;
}
function D(o, e, t = 200) {
  const r = t || 200;
  o.status != r && (console.error(`ko - ${e}. Expecting ${r} but got ${o.status}`), console.error(o), m(e + " ko"));
}
function Ke(o, e, t = 500) {
  se(
    () => o && o.code === t,
    `[${o.request.method}]${o.url} returns code ${t}: ${e} `
  );
}
function He(o, e, t = 500) {
  const r = {};
  return r[`${e} (expects ${t})`] = () => {
    const n = o && o.status === t;
    return n || (console.warn("Expected ", t, " but got ", o.status), console.warn(o)), n;
  }, f({}, r);
}
function se(o, e) {
  const t = {};
  t[e] = () => o, f({}, t) || m(e);
}
const ce = __ENV.ROOT_URL;
function qe(o) {
  let e = c.get(`${ce}/userbook/search/criteria`, {
    headers: l(o)
  });
  return JSON.parse(e.body);
}
export {
  j as ADML_FILTER,
  L as BASE_URL,
  w as Session,
  $ as SessionMode,
  je as WS_MANAGER_SHARE,
  Fe as WS_READER_SHARE,
  q as activateUser,
  H as activateUsers,
  F as addCommRuleToGroup,
  ze as addCommunicationBetweenGroups,
  Pe as applyCommRules,
  se as assertCondition,
  Ke as assertKo,
  D as assertOk,
  Y as attachStructureAsChild,
  Le as attachUserToStructures,
  Ae as attributePositions,
  me as authenticateOAuth2,
  _ as authenticateWeb,
  He as checkReturnCode,
  he as checkStatus,
  Ve as createAndSetRole,
  Oe as createBroadcastGroup,
  X as createDefaultStructure,
  _e as createEmptyStructure,
  be as createEmptyStructureNoCheck,
  I as createPosition,
  We as createPositionOrFail,
  Q as createStructure,
  ye as createUser,
  Ie as deletePosition,
  Je as getAdmlsOrMakThem,
  R as getBroadcastGroup,
  fe as getConnectedUserId,
  l as getHeaders,
  $e as getMetricValue,
  Ne as getOrCreatePosition,
  Ce as getParentRole,
  Z as getPositionByIdOrFail,
  Ue as getPositionsOfStructure,
  b as getProfileGroupOfStructure,
  B as getProfileGroupsOfStructure,
  N as getRandomUser,
  V as getRandomUserWithProfile,
  T as getRoleByName,
  W as getRolesOfStructure,
  O as getSchoolByName,
  qe as getSearchCriteria,
  Se as getStudentRole,
  G as getTeacherRole,
  ke as getUserProfileOrFail,
  z as getUsersOfGroup,
  A as getUsersOfSchool,
  Me as importCSVToStructure,
  ve as importUsers,
  Re as initStructure,
  we as linkRoleToUsers,
  ge as logout,
  ee as makeAdml,
  oe as makeAdmlOfStructures,
  xe as makeEverybodyAdml,
  De as searchPositions,
  de as searchUser,
  Be as shareFile,
  P as switchSession,
  Te as triggerImport,
  Ee as updatePosition,
  Ge as uploadFile
};
