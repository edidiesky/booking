/** Hot: GET /auth/me — JWT + session-version on every dashboard request */
import http from "k6/http";
import { sleep } from "k6";
import { baseUrl, guestToken, hostToken, vus, duration, jsonHeaders } from "../lib/config.js";
import { statusOneOf, not5xx } from "../lib/checks.js";
import { readHeavy } from "../lib/thresholds.js";

export const options = {
  vus: vus(),
  duration: duration(),
  thresholds: readHeavy,
};

export default function () {
  const token = guestToken() || hostToken();
  if (!token) {
    sleep(1);
    return;
  }
  const res = http.get(`${baseUrl()}/api/v1/auth/me`, {
    headers: jsonHeaders(token),
  });
  statusOneOf(res, [200, 401], "me");
  not5xx(res);
  sleep(0.05);
}
