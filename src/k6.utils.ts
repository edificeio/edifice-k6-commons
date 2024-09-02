import { check, fail } from "k6";

export function assertOk(res: any, label: string, code: number = 200) {
  const _code = code || 200;
  if (res.status != _code) {
    console.error(`ko - ${label}. Expecting ${_code} but got ${res.status}`);
    console.error(res);
    fail(label + " ko");
  }
}

export function assertKo(res: any, message: string, code: number = 500) {
  assertCondition(
    () => res && res.code === code,
    `[${res.request.method}]${res.url} returns code ${code}: ${message} `,
  );
}
export function checkReturnCode(res: any, message: string, code: number = 500) {
  const checks: any = {};
  checks[`${message} (expects ${code})`] = () => {
    const ok = res && res.status === code;
    if (!ok) {
      console.warn("Expected ", code, " but got ", res.status);
      console.warn(res);
    }
    return ok;
  };
  return check({}, checks);
}

export function assertCondition(assertion: () => boolean, message: string) {
  const checks: any = {};
  checks[message] = () => assertion;
  const ok = check({}, checks);
  if (!ok) {
    fail(message);
  }
}
