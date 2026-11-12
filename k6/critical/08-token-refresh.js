/**
 * Critical: refresh token + session-version enforcement.
 * Env: REFRESH_TOKEN (cookie or body depending on API)
 */
import http from "k6/http";
import { sleep, check } from "k6";
import { baseUrl, vus, duration, jsonHeaders } from "../lib/config.js";
import { not5xx } from "../lib/checks.js";
import { writeCritical } from "../lib/thresholds.js";

export const options = {
  vus: vus(),
  duration: duration(),
  thresholds: writeCritical,
};

export default function () {
  const refresh = __ENV.REFRESH_TOKEN || "";
  if (!refresh) {
    sleep(1);
    return;
  }

  const res = http.post(
    `${baseUrl()}/api/v1/auth/refresh`,
    JSON.stringify({ refreshToken: refresh }),
    { headers: jsonHeaders() },
  );

  not5xx(res);
  // After revoke, expect 401; while valid, 200
  check(res, {
    "refresh handled": (r) => [200, 401, 403].indexOf(r.status) !== -1,
  });
  sleep(0.3);
}
