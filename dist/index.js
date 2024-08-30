var E = Object.defineProperty;
var I = (o, e, t) => e in o ? E(o, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : o[e] = t;
var y = (o, e, t) => (I(o, typeof e != "symbol" ? e + "" : e, t), t);
import c from "k6/http";
import { check as d, fail as g } from "k6";
import { FormData as S } from "https://jslib.k6.io/formdata/0.0.2/index.js";
import { URL as W } from "https://jslib.k6.io/url/1.0.0/index.js";
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
const N = __ENV.BASE_URL, J = 30 * 60, k = __ENV.ROOT_URL, l = function(o) {
  let e;
  return o ? o.mode === $.COOKIE ? e = { "x-xsrf-token": o.getCookie("XSRF-TOKEN") || "" } : o.mode === $.OAUTH2 ? e = { Authorization: `Bearer ${o.token}` } : e = {} : e = {}, e;
}, ae = function(o, e) {
  const t = c.get(`${k}/conversation/visible?search=${o}`, {
    headers: l(e)
  });
  return d(t, {
    "should get an OK response": (s) => s.status == 200
  }), t.json("users")[0].id;
}, le = function(o) {
  const e = c.get(`${k}/auth/oauth2/userinfo`, {
    headers: l(o)
  });
  return d(e, {
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
  if (d(s, {
    "should redirect connected user to login page": (a) => a.status === 302,
    "should have set an auth cookie": (a) => a.cookies.oneSessionId !== null && a.cookies.oneSessionId !== void 0
  }), !s.cookies.oneSessionId)
    return console.error(`Could not get oneSessionId for ${o}`), null;
  t.set(k, "oneSessionId", s.cookies.oneSessionId[0].value);
  const n = Object.keys(s.cookies).map((a) => ({ name: a, value: s.cookies[a][0].value }));
  return new O(
    s.cookies.oneSessionId[0].value,
    $.COOKIE,
    J,
    n
  );
}, ie = function(o) {
  console.log("Removing session", o), c.cookieJar().clear(k);
}, pe = function(o) {
  const e = c.cookieJar();
  return e.set(k, "oneSessionId", o.token), e.set(k, "XSRF-TOKEN", o.getCookie("XSRF-TOKEN") || ""), o;
}, ue = function(o, e, t, r) {
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
function de(o, e, t) {
  const r = {};
  r[e] = (n) => n.status === t;
  const s = d(o, r);
  return s || console.error(e, o), s;
}
const fe = function(o, e) {
  const t = c.get(`${N}/metrics`, {
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
}, h = __ENV.ROOT_URL, L = "AdminLocal";
function ge(o, e, t) {
  let r = b(o, e, t);
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
    }), a = c.post(`${h}/directory/group`, n, { headers: s });
    d(a, {
      "create broadcast group": (p) => p.status === 201
    });
    const i = JSON.parse(a.body).id;
    n = JSON.stringify({
      name: o,
      autolinkTargetAllStructs: !0,
      autolinkTargetStructs: [],
      autolinkUsersFromGroups: ["Teacher"]
    }), a = c.put(`${h}/directory/group/${i}`, n, { headers: s }), d(a, {
      "set broadcast group for teachers": (p) => p.status === 200
    });
    const u = F(e, t).id;
    G(i, [u], t), r = b(o, e, t);
  }
  return r;
}
function G(o, e, t) {
  const r = l(t);
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
function F(o, e) {
  return _("teachers", o, e);
}
function ke(o, e) {
  return _("students", o, e);
}
function me(o, e) {
  return _("relatives", o, e);
}
function _(o, e, t) {
  return T(e.id, t).filter((s) => {
    const n = s.name.toLowerCase();
    return n === `${e.name} group ${o}.`.toLowerCase() || n === `${o} from group ${e.name}.`.toLowerCase();
  })[0];
}
function j(o, e) {
  const t = l(e);
  t["Accept-Language"] = "en";
  let r = c.get(
    `${h}/directory/group/admin/list?structureId=${o}&translate=false`,
    { headers: t }
  );
  return d(r, {
    "get structure profile groups should be ok": (s) => s.status == 200
  }), JSON.parse(r.body);
}
function b(o, e, t) {
  const r = l(t);
  r["content-type"] = "application/json";
  let s = c.get(
    `${h}/directory/group/admin/list?translate=false&structureId=${e.id}`,
    { headers: r }
  );
  return JSON.parse(s.body).filter(
    (n) => n.subType === "BroadcastGroup" && n.name === o
  )[0];
}
function P(o, e) {
  const t = l(e);
  t["content-type"] = "application/json";
  let r = c.get(
    `${h}/directory/user/admin/list?groupId=${o}`,
    { headers: t }
  );
  return JSON.parse(r.body);
}
const f = __ENV.ROOT_URL, V = new W(f).hostname, R = __ENV.DEFAULT_PASSWORD || "password";
function w(o, e) {
  let t = c.get(`${f}/directory/structure/admin/list`, {
    headers: l(e)
  });
  return JSON.parse(t.body).filter(
    (r) => r.name === o
  )[0];
}
function M(o, e) {
  let t = c.get(`${f}/directory/structure/${o.id}/users`, {
    headers: l(e)
  });
  if (t.status !== 200)
    throw `Impossible to get users of ${o.id}`;
  return JSON.parse(t.body);
}
function B(o, e) {
  let t = c.get(`${f}/directory/structure/${o.id}/users`, {
    headers: l(e)
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
    const t = c.post(`${f}/auth/activation`, e, {
      redirects: 0,
      headers: { Host: V }
    });
    t.status !== 302 && (console.error(t), g(
      `Could not activate user ${o.login} : ${t.status} - ${t.body}`
    ));
  }
}
function he(o, e, t, r) {
  const n = T(o.id, r).filter(
    (a) => t.indexOf(a.name) >= 0
  );
  for (let a of n)
    if (a.roles.indexOf(e.name) >= 0)
      console.log("Role already attributed to teachers");
    else {
      const i = l(r);
      i["content-type"] = "application/json";
      const u = { headers: i }, p = JSON.stringify({
        groupId: a.id,
        roleIds: (a.roles || []).concat([e.id])
      }), m = c.post(
        `${f}/appregistry/authorize/group?schoolId=${o.id}`,
        p,
        u
      );
      d(m, {
        "link role to structure": (U) => U.status == 200
      });
    }
}
function ye(o, e, t) {
  let r = w(o, t);
  if (r)
    console.log(`Structure ${o} already exists`);
  else {
    const s = l(t);
    s["content-type"] = "application/json";
    const n = JSON.stringify({
      hasApp: e,
      name: o
    });
    let a = c.post(`${f}/directory/school`, n, s);
    a.status !== 201 && (console.error(a.body), g(`Could not create structure ${o}`)), r = w(o, t);
  }
  return r;
}
function $e(o) {
  const e = A(__ENV.ADMC_LOGIN, __ENV.ADMC_PASSWORD), t = H(o);
  return B(t, e), t;
}
function H(o) {
  const e = o || "General", t = A(__ENV.ADMC_LOGIN, __ENV.ADMC_PASSWORD), r = "https://raw.githubusercontent.com/edificeio/edifice-k6-commons/main/data/structure", s = c.get(`${r}/enseignants.csv`).body, n = c.get(`${r}/eleves.csv`).body, a = c.get(`${r}/responsables.csv`).body;
  return z(
    e,
    {
      teachers: s,
      students: n,
      responsables: a
    },
    t
  );
}
function z(o, e, t) {
  let r = w(o, t);
  if (r)
    console.log("School already exists");
  else {
    const s = new S();
    s.append("type", "CSV"), s.append("structureName", o);
    let n, a, i;
    "teachers" in e ? (n = e.teachers, a = e.students, i = e.responsables) : n = e, s.append("Teacher", c.file(n, "enseignants.csv")), a && s.append("Student", c.file(a, "eleves.csv")), i && s.append("Relative", c.file(i, "responsables.csv"));
    const u = l(t);
    u["Content-Type"] = "multipart/form-data; boundary=" + s.boundary;
    const p = { headers: u };
    c.post(
      `${f}/directory/wizard/import`,
      s.body(),
      p
    ).status != 200 && g(`Could not create structure ${o}`), r = w(o, t);
  }
  return r;
}
function we(o, e, t) {
  let r;
  if ((e.parents || []).map((n) => n.id).indexOf(o.id) >= 0)
    console.log(
      `${e.name} is already a child of ${o.name}`
    ), r = !1;
  else {
    const n = l(t);
    n["content-type"] = "application/json", c.put(
      `${f}/directory/structure/${e.id}/parent/${o.id}`,
      "{}"
    ).status !== 200 && g(
      `Could not attach structure ${e.name} as a child of ${o.name}`
    ), r = !0;
  }
  return r;
}
function Ce(o, e, t) {
  const r = new S();
  r.append("type", "CSV"), r.append("structureName", o.name), r.append("structureId", o.id), r.append("structureExternalId", o.externalId);
  let s, n, a;
  "teachers" in e ? (s = e.teachers, n = e.students, a = e.responsables) : s = e, r.append("Teacher", c.file(s, "enseignants.csv")), n && r.append("Student", c.file(n, "eleves.csv")), a && r.append("Relative", c.file(a, "responsables.csv"));
  const i = l(t);
  i["Content-Type"] = "multipart/form-data; boundary=" + r.boundary;
  const u = { headers: i };
  return c.post(
    `${f}/directory/wizard/import`,
    r.body(),
    u
  );
}
function Oe(o) {
  const e = l(o);
  return e["content-type"] = "application/json", c.post(`${f}/directory/import`, "{}", { headers: e });
}
function X(o, e, t) {
  const r = l(t);
  r["content-type"] = "application/json";
  const s = JSON.stringify({
    name: o,
    structureId: e.id
  });
  return c.post(`${f}/directory/positions`, s, {
    redirects: 0,
    headers: r
  });
}
function Se(o, e) {
  const t = l(e);
  return t["content-type"] = "application/json", c.del(`${f}/directory/positions/${o}`, null, {
    redirects: 0,
    headers: t
  });
}
function _e(o, e, t) {
  const r = X(o, e, t);
  return r.status !== 201 && (console.error(r), g(
    `Could not create position ${o} on structure ${e.name}`
  )), JSON.parse(r.body);
}
function be(o, e) {
  const t = l(e), r = new W(`${f}/directory/positions`);
  return r.searchParams.append("prefix", o), c.get(r.toString(), { headers: t });
}
function q(o, e, t) {
  const r = l(t);
  r["content-type"] = "application/json";
  const s = JSON.stringify({
    functionCode: "ADMIN_LOCAL",
    inherit: "s",
    scope: [e.id]
  });
  let n = c.post(
    `${f}/directory/user/function/${o.id}`,
    s,
    { headers: r }
  );
  return ee(n, "user should be made ADML"), n;
}
function Re(o, e, t, r) {
  const n = j(
    o.id,
    r
  ).filter(
    (u) => u.filter === L
  )[0], a = P(n.id, r), i = e ? a.filter((u) => u.profile === e) : a;
  if (i.length < t) {
    const u = M(o, r);
    for (let p = i.length; p < t; p++) {
      let m;
      e ? m = x(u, e, i) : m = D(u, i), console.log(
        `Turning ${m.login} into an ADML of ${o.id} - ${o.name}`
      ), q(m, o, r), i.push(m);
    }
  }
  return i.slice(0, t);
}
const C = __ENV.ROOT_URL;
function v(o, e) {
  let t = c.get(`${C}/appregistry/roles`, {
    headers: l(e)
  });
  return JSON.parse(t.body).filter((s) => s.name === o)[0];
}
function ve(o, e) {
  const t = `${o} - All - Stress Test`;
  let r = v(t, e);
  if (r)
    console.log(`Role ${t} already existed`);
  else {
    let s = c.get(
      `${C}/appregistry/applications/actions?actionType=WORKFLOW`,
      { headers: l(e) }
    );
    d(s, { "get workflow actions": (p) => p.status == 200 });
    const a = JSON.parse(s.body).filter(
      (p) => p.name === o
    )[0].actions.map((p) => p[0]), i = l(e);
    i["content-type"] = "application/json";
    const u = {
      role: t,
      actions: a
    };
    s = c.post(`${C}/appregistry/role`, JSON.stringify(u), {
      headers: i
    }), console.log(s), d(s, { "save role ok": (p) => p.status == 201 }), r = v(t, e);
  }
  return r;
}
function T(o, e) {
  const t = l(e);
  t["Accept-Language"] = "en";
  let r = c.get(
    `${C}/appregistry/groups/roles?structureId=${o}&translate=false`,
    { headers: t }
  );
  return d(r, {
    "get structure roles should be ok": (s) => s.status == 200
  }), JSON.parse(r.body);
}
const Y = __ENV.ROOT_URL, We = [
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
], Ae = [
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
function De(o, e) {
  let t = l(e);
  const r = new S();
  r.append("file", c.file(o, "file.txt")), t["Content-Type"] = "multipart/form-data; boundary=" + r.boundary;
  let s = c.post(`${Y}/workspace/document`, r.body(), { headers: t });
  return d(s, {
    "upload doc ok": (n) => n.status === 201
  }), JSON.parse(s.body);
}
const Q = __ENV.ROOT_URL;
function Te(o, e, t) {
  const r = l(t);
  r["content-type"] = "application/json";
  const s = JSON.stringify(e);
  return c.put(`${Q}/workspace/share/resource/${o}`, s, {
    headers: r
  });
}
const Z = __ENV.ROOT_URL;
function Ue(o, e, t) {
  const r = c.post(
    `${Z}/communication/v2/group/${o}/communique/${e}`,
    "{}",
    { headers: l(t) }
  );
  return r.status !== 200 && (console.error(
    `Error while adding communication between ${o} -> ${e}`
  ), console.error(r), g(`could not add communication between ${o} -> ${e}`)), r;
}
function ee(o, e, t = 200) {
  const r = t || 200;
  o.status != r && (console.error(`ko - ${e}. Expecting ${r} but got ${o.status}`), console.error(o), g(e + " ko"));
}
function Ee(o, e) {
  const t = {};
  t[e] = () => o, d({}, t) || g(e);
}
const oe = __ENV.ROOT_URL;
function Ie(o) {
  let e = c.get(`${oe}/userbook/search/criteria`, {
    headers: l(o)
  });
  return JSON.parse(e.body);
}
export {
  L as ADML_FILTER,
  N as BASE_URL,
  O as Session,
  $ as SessionMode,
  We as WS_MANAGER_SHARE,
  Ae as WS_READER_SHARE,
  K as activateUser,
  B as activateUsers,
  G as addCommRuleToGroup,
  Ue as addCommunicationBetweenGroups,
  Ee as assertCondition,
  ee as assertOk,
  we as attachStructureAsChild,
  ue as authenticateOAuth2,
  A as authenticateWeb,
  de as checkStatus,
  ve as createAndSetRole,
  ge as createBroadcastGroup,
  H as createDefaultStructure,
  ye as createEmptyStructure,
  X as createPosition,
  _e as createPositionOrFail,
  z as createStructure,
  Se as deletePosition,
  Re as getAdmlsOrMakThem,
  b as getBroadcastGroup,
  le as getConnectedUserId,
  l as getHeaders,
  fe as getMetricValue,
  me as getParentRole,
  _ as getProfileGroupOfStructure,
  j as getProfileGroupsOfStructure,
  D as getRandomUser,
  x as getRandomUserWithProfile,
  v as getRoleByName,
  T as getRolesOfStructure,
  w as getSchoolByName,
  Ie as getSearchCriteria,
  ke as getStudentRole,
  F as getTeacherRole,
  P as getUsersOfGroup,
  M as getUsersOfSchool,
  Ce as importUsers,
  $e as initStructure,
  he as linkRoleToUsers,
  ie as logout,
  q as makeAdml,
  be as searchPositions,
  ae as searchUser,
  Te as shareFile,
  pe as switchSession,
  Oe as triggerImport,
  De as uploadFile
};
