import { check, fail } from "k6";

export function assertOk(res: any, label: string, code: number = 200) {
  const _code = code || 200;
  if (res.status != _code) {
    console.error(`ko - ${label}. Expecting ${_code} but got ${res.status}`);
    console.error(res);
    fail(label + " ko");
  }
}

export function assertCondition(assertion: () => boolean, message: string) {
  const checks: any = {};
  checks[message] = () => assertion;
  const ok = check({}, checks);
  if (!ok) {
    fail(message);
  }
}
