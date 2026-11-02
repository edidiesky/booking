/**
 * Overlap: refresh after logout — expect 401 once session-version bumped.
 * Flow: login (optional) → logout → refresh with old token.
 * Env: REFRESH_TOKEN from a session you already revoked, or automate with LOGIN_*.
 */
import http from "k6/http";
import { sleep, check } from "k6";
import { baseUrl, jsonHeaders } from "../lib/config.js";
import { not5xx } from "../lib/checks.js";
import { writeCritical } from "../lib/thresholds.js";

export const options = {
  vus: 1,
  iterations: Number(__ENV.ITERS || 5),
  thresholds: writeCritical,
};

export default function () {
  const refresh = __ENV.REFRESH_TOKEN || "";
  if (!refresh) {
    console.warn("Set REFRESH_TOKEN from a revoked session to assert 401");
    sleep(1);
    return;
  }

  const res = http.post(
    `${baseUrl()}/api/v1/auth/refresh`,
    JSON.stringify({ refreshToken: refresh }),
    { headers: jsonHeaders() },
  );
  not5xx(res);
  check(res, {
    "revoked refresh rejected": (r) => r.status === 401 || r.status === 403,
  });
  sleep(0.3);
}
