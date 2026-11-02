/**
 * Hot: hammer a sensitive auth route to observe 429 + headers.
 * Validates gateway identity + limiter under abuse.
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
  const res = http.post(
    `${baseUrl()}/api/v1/auth/login`,
    JSON.stringify({
      email: "rl-hammer@example.com",
      password: "wrong",
    }),
    { headers: jsonHeaders() },
  );
  not5xx(res);
  check(res, {
    "eventually rate limited or unauthorized": (r) =>
      r.status === 401 || r.status === 429,
  });
  sleep(0.05);
}
