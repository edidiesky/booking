/**
 * Critical: login + session issue (success path needs real credentials).
 * Default uses wrong password to stress auth without polluting sessions;
 * set LOGIN_EMAIL + LOGIN_PASSWORD for success path.
 */
import http from "k6/http";
import { sleep, check } from "k6";
import { baseUrl, vus, duration, jsonHeaders } from "../lib/config.js";
import { not5xx } from "../lib/checks.js";
import { authStorm } from "../lib/thresholds.js";

export const options = {
  vus: vus(),
  duration: duration(),
  thresholds: authStorm,
};

export default function () {
  const email = __ENV.LOGIN_EMAIL || `k6-user-${__VU}@example.com`;
  const password = __ENV.LOGIN_PASSWORD || "WrongPass123!";

  const res = http.post(
    `${baseUrl()}/api/v1/auth/login`,
    JSON.stringify({ email, password }),
    { headers: jsonHeaders() },
  );

  not5xx(res);
  check(res, {
    "auth response": (r) =>
      [200, 401, 403, 429].indexOf(r.status) !== -1,
  });
  sleep(0.25);
}
