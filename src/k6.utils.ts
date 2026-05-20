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

/**
 * @param name Name of the check, used for logging
 * @param actual Value to test against true
 * @returns true if the actual value is true, false otherwise. Logs an error if the check fails.
 */
export function checkTrue(name: string, actual: boolean) {
  const ok = check(
    {},
    {
      [`${name}`]: () => actual === true,
    },
  );
  if (!ok) {
    console.error(`Was expecting ${name} to be true`);
  }
  return ok;
}
/**
 * @param name Name of the check, used for logging.
 * @param actual Value to test against false
 * @returns true if the actual value is false, false otherwise. Logs an error if the check fails.
 */
export function checkFalse(name: string, actual: boolean) {
  const ok = check(
    {},
    {
      [`${name}`]: () => actual === false,
    },
  );
  if (!ok) {
    console.error(`Was expecting ${name} to be false`);
  }
  return ok;
}

/**
 * @param name Name of the check, used for logging.
 * @param expected Value to test against actual
 * @param actual Value to test against actual
 * @returns true if the actual value is === to the expected value, false otherwise. Logs an error if the check fails.
 */
export function checkEquals(name: string, expected: any, actual: any) {
  const ok = check(
    {},
    {
      [`${name}`]: () => expected === actual,
    },
  );
  if (!ok) {
    console.error(
      `Was expecting ${name} to equal ${expected} but got ${actual}`,
    );
  }
  return ok;
}
/**
 *
 * @param name Name of the check, used for logging
 * @param expected Value to test against actual
 * @param actual Value to test against actual
 * @returns true if the actual value is !== to the expected value, false otherwise. Logs an error if the check fails.
 */
export function checkNotEquals(name: string, expected: any, actual: any) {
  const ok = check(
    {},
    {
      [`${name}`]: () => expected !== actual,
    },
  );
  if (!ok) {
    console.error(
      `Was expecting ${name} to not equal ${expected} but got ${actual}`,
    );
  }
  return ok;
}

/**
 * @param name Name of the check, used for logging
 * @param expected Value to test against actual
 * @param actual Value to test against actual
 * @returns true if the actual value is >= to the expected value, false otherwise. Logs an error if the check fails.
 */
export function checkGte(name: string, expected: number, actual: number) {
  const ok = check(
    {},
    {
      [`${name}`]: () => actual >= expected,
    },
  );
  if (!ok) {
    console.error(
      `Was expecting ${name} to be greater than or equal to ${expected} but got ${actual}`,
    );
  }
  return ok;
}

/**
 * @param name Name of the check, used for logging
 * @param array Array to test against the predicate
 * @param predicate Function that tests each item in the array
 * @returns true if at least one item in the array satisfies the predicate, false otherwise. Logs an error if the check fails.
 */
export function checkContains(
  name: string,
  array: any[],
  predicate: (item: any) => boolean,
) {
  return checkTrue(name, array.some(predicate));
}

/**
 * @param name Name of the check, used for logging
 * @param array Array to test against the predicate
 * @param predicate Function that tests each item in the array
 * @returns true if no item in the array satisfies the predicate, false otherwise. Logs an error if the check fails.
 */
export function checkNotContains(
  name: string,
  array: any[],
  predicate: (item: any) => boolean,
) {
  return checkFalse(name, array.some(predicate));
}
