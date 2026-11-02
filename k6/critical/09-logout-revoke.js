/**
 * Critical: logout / logout-all.
 * Env: GUEST_TOKEN or HOST_TOKEN
 */
import http from "k6/http";
import { sleep } from "k6";
import { baseUrl, guestToken, hostToken, vus, duration, jsonHeaders } from "../lib/config.js";
import { statusOneOf, not5xx } from "../lib/checks.js";
import { writeCritical } from "../lib/thresholds.js";

export const options = {
  vus: Math.min(vus(), 5),
  duration: duration(),
  thresholds: writeCritical,
};

export default function () {
  const token = guestToken() || hostToken();
  if (!token) {
    sleep(1);
    return;
  }

  const mode = __ENV.LOGOUT_MODE || "me"; // me | all
  const path =
    mode === "all"
      ? `${baseUrl()}/api/v1/auth/logout-all`
      : `${baseUrl()}/api/v1/auth/logout`;

  const res = http.post(path, JSON.stringify({}), {
    headers: jsonHeaders(token),
  });

  statusOneOf(res, [200, 204, 401], "logout outcome");
  not5xx(res);
  sleep(0.5);
}
