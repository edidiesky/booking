import { check } from "k6";

export function not5xx(res, name = "not 5xx") {
  return check(res, { [name]: (r) => r.status < 500 });
}

export function statusOneOf(res, codes, name = "status") {
  return check(res, {
    [name]: (r) => codes.indexOf(r.status) !== -1,
  });
}

export function okJson(res) {
  return check(res, {
    "status 2xx": (r) => r.status >= 200 && r.status < 300,
    "has body": (r) => r.body && r.body.length > 0,
  });
}
