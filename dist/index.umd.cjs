(function(s,c){typeof exports=="object"&&typeof module<"u"?c(exports,require("k6/http"),require("k6"),require("https://jslib.k6.io/formdata/0.0.2/index.js"),require("https://jslib.k6.io/url/1.0.0/index.js")):typeof define=="function"&&define.amd?define(["exports","k6/http","k6","https://jslib.k6.io/formdata/0.0.2/index.js","https://jslib.k6.io/url/1.0.0/index.js"],c):(s=typeof globalThis<"u"?globalThis:s||self,c(s["edifice-k6-commons"]={},s.http,s.k6,s.index_js$1,s.index_js))})(this,function(s,c,i,O,v){"use strict";var we=Object.defineProperty;var Oe=(s,c,i)=>c in s?we(s,c,{enumerable:!0,configurable:!0,writable:!0,value:i}):s[c]=i;var S=(s,c,i)=>(Oe(s,typeof c!="symbol"?c+"":c,i),i);const m={COOKIE:0,OAUTH2:1};class h{constructor(e,r,t,n){S(this,"expiresAt");S(this,"token");S(this,"mode");S(this,"cookies");this.token=e,this.mode=r,this.cookies=n,this.expiresAt=Date.now()+t*1e3-3e3}static from(e){const r=new h(e.token,e.mode,0,e.cookies);return r.expiresAt=e.expiresAt,r}isExpired(){return this.expiresAt<=Date.now()}getCookie(e){return this.cookies?this.cookies.filter(r=>r.name===e).map(r=>r.value)[0]:null}}const A=__ENV.BASE_URL,L=30*60,k=__ENV.ROOT_URL,u=function(o){let e;return o?o.mode===m.COOKIE?e={"x-xsrf-token":o.getCookie("XSRF-TOKEN")||""}:o.mode===m.OAUTH2?e={Authorization:`Bearer ${o.token}`}:e={}:e={},e},B=function(o,e){const r=c.get(`${k}/conversation/visible?search=${o}`,{headers:u(e)});return i.check(r,{"should get an OK response":n=>n.status==200}),r.json("users")[0].id},V=function(o){const e=c.get(`${k}/auth/oauth2/userinfo`,{headers:u(o)});return i.check(e,{"should get an OK response":r=>r.status==200,"should get a valid userId":r=>!!r.json("userId")}),e.json("userId")},R=function(o,e){const r=c.cookieJar();r.clear(k);let t={email:o,password:e||__ENV.DEFAULT_PASSWORD,callBack:"",detail:""};const n=c.post(`${k}/auth/login`,t,{redirects:0});if(i.check(n,{"should redirect connected user to login page":l=>l.status===302,"should have set an auth cookie":l=>l.cookies.oneSessionId!==null&&l.cookies.oneSessionId!==void 0}),!n.cookies.oneSessionId)return console.error(`Could not get oneSessionId for ${o}`),null;r.set(k,"oneSessionId",n.cookies.oneSessionId[0].value);const a=Object.keys(n.cookies).map(l=>({name:l,value:n.cookies[l][0].value}));return new h(n.cookies.oneSessionId[0].value,m.COOKIE,L,a)},M=function(o){console.log("Removing session",o),c.cookieJar().clear(k)},H=function(o){const e=c.cookieJar();return e.set(k,"oneSessionId",o.token),e.set(k,"XSRF-TOKEN",o.getCookie("XSRF-TOKEN")||""),o},K=function(o,e,r,t){let n={grant_type:"password",username:o,password:e,client_id:r,client_secret:t,scope:"timeline userbook blog lvs actualites pronote schoolbook support viescolaire zimbra conversation directory homeworks userinfo workspace portal cas sso presences incidents competences diary edt infra auth"},a=c.post(`${k}/auth/oauth2/token`,n,{redirects:0});i.check(a,{"should get an OK response for authentication":d=>d.status==200,"should have set an access token":d=>!!d.json("access_token")});const l=a.json("access_token");return new h(l,m.OAUTH2,a.json("expires_in"))};function U(o,e){const r=(e||[]).map(t=>t.id);for(let t=0;t<1e3;t++){const n=o[Math.floor(Math.random()*o.length)];if(r.indexOf(n.id)<0)return n}throw"cannot.find.random.user"}function q(o,e,r){const t=o.filter(n=>n.type===e);return U(t,r)}function z(o,e,r){const t={};t[e]=a=>a.status===r;const n=i.check(o,t);return n||console.error(e,o),n}const X=function(o,e){const r=c.get(`${A}/metrics`,{headers:u(e)});i.check(r,{"should get an OK response":n=>n.status==200});const t=r.body.split(`
`);for(let n of t)if(n.indexOf(`${o} `)===0)return parseFloat(n.substring(o.length+1).trim());return console.error("Metric",o,"not found"),null},f=__ENV.ROOT_URL,Y=new v.URL(f).hostname,D=__ENV.DEFAULT_PASSWORD||"password";function y(o,e){let r=c.get(`${f}/directory/structure/admin/list`,{headers:u(e)});return JSON.parse(r.body).filter(t=>t.name===o)[0]}function Q(o,e){let r=c.get(`${f}/directory/structure/${o.id}/users`,{headers:u(e)});if(r.status!==200)throw`Impossible to get users of ${o.id}`;return JSON.parse(r.body)}function E(o,e){let r=c.get(`${f}/directory/structure/${o.id}/users`,{headers:u(e)});r.status!=200&&i.fail(`Cannot fetch users of structure ${o.id} : ${r}`);const t=JSON.parse(r.body);for(let n=0;n<t.length;n++){const a=t[n];T(a)}}function T(o){if(o.code){const e={};e.login=o.login,e.activationCode=o.code,e.password=D,e.confirmPassword=D,e.acceptCGU="true";const r=c.post(`${f}/auth/activation`,e,{redirects:0,headers:{Host:Y}});r.status!==302&&(console.error(r),i.fail(`Could not activate user ${o.login} : ${r.status} - ${r.body}`))}}function Z(o,e,r,t){const a=b(o.id,t).filter(l=>r.indexOf(l.name)>=0);for(let l of a)if(l.roles.indexOf(e.name)>=0)console.log("Role already attributed to teachers");else{const d=u(t);d["content-type"]="application/json";const g={headers:d},p=JSON.stringify({groupId:l.id,roleIds:(l.roles||[]).concat([e.id])}),G=c.post(`${f}/appregistry/authorize/group?schoolId=${o.id}`,p,g);i.check(G,{"link role to structure":Ce=>Ce.status==200})}}function x(o,e,r){let t=y(o,r);if(t)console.log(`Structure ${o} already exists`);else{const n=u(r);n["content-type"]="application/json";const a=JSON.stringify({hasApp:e,name:o});let l=c.post(`${f}/directory/school`,a,n);l.status!==201&&(console.error(l.body),i.fail(`Could not create structure ${o}`)),t=y(o,r)}return t}function ee(o){const e=R(__ENV.ADMC_LOGIN,__ENV.ADMC_PASSWORD),r=I(o);return E(r,e),r}function I(o){const e=o||"General",r=R(__ENV.ADMC_LOGIN,__ENV.ADMC_PASSWORD),t="https://raw.githubusercontent.com/edificeio/edifice-k6-commons/main/data/structure",n=c.get(`${t}/enseignants.csv`).body,a=c.get(`${t}/eleves.csv`).body,l=c.get(`${t}/responsables.csv`).body;return N(e,{teachers:n,students:a,responsables:l},r)}function N(o,e,r){let t=y(o,r);if(t)console.log("School already exists");else{const n=new O.FormData;n.append("type","CSV"),n.append("structureName",o);let a,l,d;"teachers"in e?(a=e.teachers,l=e.students,d=e.responsables):a=e,n.append("Teacher",c.file(a,"enseignants.csv")),l&&n.append("Student",c.file(l,"eleves.csv")),d&&n.append("Relative",c.file(d,"responsables.csv"));const g=u(r);g["Content-Type"]="multipart/form-data; boundary="+n.boundary;const p={headers:g};c.post(`${f}/directory/wizard/import`,n.body(),p).status!=200&&i.fail(`Could not create structure ${o}`),t=y(o,r)}return t}function oe(o,e,r){let t;if((e.parents||[]).map(a=>a.id).indexOf(o.id)>=0)console.log(`${e.name} is already a child of ${o.name}`),t=!1;else{const a=u(r);a["content-type"]="application/json",c.put(`${f}/directory/structure/${e.id}/parent/${o.id}`,"{}").status!==200&&i.fail(`Could not attach structure ${e.name} as a child of ${o.name}`),t=!0}return t}function re(o,e,r){const t=new O.FormData;t.append("type","CSV"),t.append("structureName",o.name),t.append("structureId",o.id),t.append("structureExternalId",o.externalId);let n,a,l;"teachers"in e?(n=e.teachers,a=e.students,l=e.responsables):n=e,t.append("Teacher",c.file(n,"enseignants.csv")),a&&t.append("Student",c.file(a,"eleves.csv")),l&&t.append("Relative",c.file(l,"responsables.csv"));const d=u(r);d["Content-Type"]="multipart/form-data; boundary="+t.boundary;const g={headers:d};return c.post(`${f}/directory/wizard/import`,t.body(),g)}function te(o){const e=u(o);return e["content-type"]="application/json",c.post(`${f}/directory/import`,"{}",{headers:e})}function j(o,e,r){const t=u(r);t["content-type"]="application/json";const n=JSON.stringify({name:o,structureId:e.id});return c.post(`${f}/directory/positions`,n,{redirects:0,headers:t})}function ne(o,e){const r=u(e);return r["content-type"]="application/json",c.del(`${f}/directory/positions/${o}`,null,{redirects:0,headers:r})}function se(o,e,r){const t=j(o,e,r);return t.status!==201&&(console.error(t),i.fail(`Could not create position ${o} on structure ${e.name}`)),JSON.parse(t.body)}function ce(o,e){const r=u(e),t=new v.URL(`${f}/directory/positions`);return t.searchParams.append("prefix",o),c.get(t.toString(),{headers:r})}function ae(o,e,r){const t=u(r);t["content-type"]="application/json";const n=JSON.stringify({functionCode:"ADMIN_LOCAL",inherit:"s",scope:[e.id]});let a=c.post(`${f}/directory/user/function/${o.id}`,n,{headers:t});return J(a,"user should be made ADML"),a}const $=__ENV.ROOT_URL;function _(o,e){let r=c.get(`${$}/appregistry/roles`,{headers:u(e)});return JSON.parse(r.body).filter(n=>n.name===o)[0]}function le(o,e){const r=`${o} - All - Stress Test`;let t=_(r,e);if(t)console.log(`Role ${r} already existed`);else{let n=c.get(`${$}/appregistry/applications/actions?actionType=WORKFLOW`,{headers:u(e)});i.check(n,{"get workflow actions":p=>p.status==200});const l=JSON.parse(n.body).filter(p=>p.name===o)[0].actions.map(p=>p[0]),d=u(e);d["content-type"]="application/json";const g={role:r,actions:l};n=c.post(`${$}/appregistry/role`,JSON.stringify(g),{headers:d}),console.log(n),i.check(n,{"save role ok":p=>p.status==201}),t=_(r,e)}return t}function b(o,e){const r=u(e);r["Accept-Language"]="en";let t=c.get(`${$}/appregistry/groups/roles?structureId=${o}&translate=false`,{headers:r});return i.check(t,{"get structure roles should be ok":n=>n.status==200}),JSON.parse(t.body)}const ie=__ENV.ROOT_URL,ue=["org-entcore-workspace-controllers-WorkspaceController|getDocument","org-entcore-workspace-controllers-WorkspaceController|copyDocuments","org-entcore-workspace-controllers-WorkspaceController|getDocumentProperties","org-entcore-workspace-controllers-WorkspaceController|getRevision","org-entcore-workspace-controllers-WorkspaceController|copyFolder","org-entcore-workspace-controllers-WorkspaceController|getPreview","org-entcore-workspace-controllers-WorkspaceController|copyDocument","org-entcore-workspace-controllers-WorkspaceController|getDocumentBase64","org-entcore-workspace-controllers-WorkspaceController|listRevisions","org-entcore-workspace-controllers-WorkspaceController|commentFolder","org-entcore-workspace-controllers-WorkspaceController|commentDocument","org-entcore-workspace-controllers-WorkspaceController|shareJson","org-entcore-workspace-controllers-WorkspaceController|deleteFolder","org-entcore-workspace-controllers-WorkspaceController|restoreFolder","org-entcore-workspace-controllers-WorkspaceController|removeShare","org-entcore-workspace-controllers-WorkspaceController|moveFolder","org-entcore-workspace-controllers-WorkspaceController|moveTrash","org-entcore-workspace-controllers-WorkspaceController|restoreTrash","org-entcore-workspace-controllers-WorkspaceController|bulkDelete","org-entcore-workspace-controllers-WorkspaceController|shareResource","org-entcore-workspace-controllers-WorkspaceController|deleteRevision","org-entcore-workspace-controllers-WorkspaceController|shareJsonSubmit","org-entcore-workspace-controllers-WorkspaceController|moveDocument","org-entcore-workspace-controllers-WorkspaceController|renameFolder","org-entcore-workspace-controllers-WorkspaceController|moveTrashFolder","org-entcore-workspace-controllers-WorkspaceController|deleteComment","org-entcore-workspace-controllers-WorkspaceController|getParentInfos","org-entcore-workspace-controllers-WorkspaceController|deleteDocument","org-entcore-workspace-controllers-WorkspaceController|renameDocument","org-entcore-workspace-controllers-WorkspaceController|moveDocuments","org-entcore-workspace-controllers-WorkspaceController|updateDocument"],de=["org-entcore-workspace-controllers-WorkspaceController|getDocument","org-entcore-workspace-controllers-WorkspaceController|copyDocuments","org-entcore-workspace-controllers-WorkspaceController|getDocumentProperties","org-entcore-workspace-controllers-WorkspaceController|getRevision","org-entcore-workspace-controllers-WorkspaceController|copyFolder","org-entcore-workspace-controllers-WorkspaceController|getPreview","org-entcore-workspace-controllers-WorkspaceController|copyDocument","org-entcore-workspace-controllers-WorkspaceController|getDocumentBase64","org-entcore-workspace-controllers-WorkspaceController|listRevisions","org-entcore-workspace-controllers-WorkspaceController|commentFolder","org-entcore-workspace-controllers-WorkspaceController|commentDocument"];function pe(o,e){let r=u(e);const t=new O.FormData;t.append("file",c.file(o,"file.txt")),r["Content-Type"]="multipart/form-data; boundary="+t.boundary;let n=c.post(`${ie}/workspace/document`,t.body(),{headers:r});return i.check(n,{"upload doc ok":a=>a.status===201}),JSON.parse(n.body)}const fe=__ENV.ROOT_URL;function ge(o,e,r){const t=u(r);t["content-type"]="application/json";const n=JSON.stringify(e);return c.put(`${fe}/workspace/share/resource/${o}`,n,{headers:t})}const ke=__ENV.ROOT_URL;function me(o,e,r){const t=c.post(`${ke}/communication/v2/group/${o}/communique/${e}`,"{}",{headers:u(r)});return t.status!==200&&(console.error(`Error while adding communication between ${o} -> ${e}`),console.error(t),i.fail(`could not add communication between ${o} -> ${e}`)),t}const C=__ENV.ROOT_URL;function he(o,e,r){let t=W(o,e,r);if(t)console.log("Broadcast group already existed");else{console.log("Creating broadcast group");const n=u(r);n["content-type"]="application/json";let a=JSON.stringify({name:o,structureId:e.id,subType:"BroadcastGroup"}),l=c.post(`${C}/directory/group`,a,{headers:n});i.check(l,{"create broadcast group":p=>p.status===201});const d=JSON.parse(l.body).id;a=JSON.stringify({name:o,autolinkTargetAllStructs:!0,autolinkTargetStructs:[],autolinkUsersFromGroups:["Teacher"]}),l=c.put(`${C}/directory/group/${d}`,a,{headers:n}),i.check(l,{"set broadcast group for teachers":p=>p.status===200});const g=F(e,r).id;P(d,[g],r),t=W(o,e,r)}return t}function P(o,e,r){const t=u(r);t["content-type"]="application/json";for(let n of e){let a=c.post(`${C}/communication/v2/group/${n}/communique/${o}`,"{}",{headers:t});a.status!==200&&(console.error(a),i.fail(`Cannot open comm rule from ${n} to ${o}`))}}function F(o,e){return w("teachers",o,e)}function ye(o,e){return w("students",o,e)}function Se(o,e){return w("relatives",o,e)}function w(o,e,r){return b(e.id,r).filter(n=>{const a=n.name.toLowerCase();return a===`${e.name} group ${o}.`.toLowerCase()||a===`${o} from group ${e.name}.`.toLowerCase()})[0]}function W(o,e,r){const t=u(r);t["content-type"]="application/json";let n=c.get(`${C}/directory/group/admin/list?translate=false&structureId=${e.id}`,{headers:t});return JSON.parse(n.body).filter(a=>a.subType==="BroadcastGroup"&&a.name===o)[0]}function J(o,e,r=200){const t=r||200;o.status!=t&&(console.error(`ko - ${e}. Expecting ${t} but got ${o.status}`),console.error(o),i.fail(e+" ko"))}function $e(o,e){const r={};r[e]=()=>o,i.check({},r)||i.fail(e)}s.BASE_URL=A,s.Session=h,s.SessionMode=m,s.WS_MANAGER_SHARE=ue,s.WS_READER_SHARE=de,s.activateUser=T,s.activateUsers=E,s.addCommRuleToGroup=P,s.addCommunicationBetweenGroups=me,s.assertCondition=$e,s.assertOk=J,s.attachStructureAsChild=oe,s.authenticateOAuth2=K,s.authenticateWeb=R,s.checkStatus=z,s.createAndSetRole=le,s.createBroadcastGroup=he,s.createDefaultStructure=I,s.createEmptyStructure=x,s.createPosition=j,s.createPositionOrFail=se,s.createStructure=N,s.deletePosition=ne,s.getBroadcastGroup=W,s.getConnectedUserId=V,s.getHeaders=u,s.getMetricValue=X,s.getParentRole=Se,s.getProfileGroupOfStructure=w,s.getRandomUser=U,s.getRandomUserWithProfile=q,s.getRoleByName=_,s.getRolesOfStructure=b,s.getSchoolByName=y,s.getStudentRole=ye,s.getTeacherRole=F,s.getUsersOfSchool=Q,s.importUsers=re,s.initStructure=ee,s.linkRoleToUsers=Z,s.logout=M,s.makeAdml=ae,s.searchPositions=ce,s.searchUser=B,s.shareFile=ge,s.switchSession=H,s.triggerImport=te,s.uploadFile=pe,Object.defineProperty(s,Symbol.toStringTag,{value:"Module"})});
