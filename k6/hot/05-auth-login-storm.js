/** Hot: login including failures — rate limit + bcrypt pressure */
import http from "k6/http";
import { sleep, check } from "k6";
import { baseUrl, vus, duration, jsonHeaders } from "../lib/config.js";
import { not5xx } from "../lib/checks.js";
import { authStorm } from "../lib/thresholds.js";

export const options = {
  scenarios: {
    storm: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "20s", target: vus() },
        { duration: duration(), target: vus() },
        { duration: "15s", target: 0 },
      ],
    },
  },
  thresholds: authStorm,
};

export default function () {
  const res = http.post(
    `${baseUrl()}/api/v1/auth/login`,
    JSON.stringify({
      email: `storm-${__VU}@example.com`,
      password: "wrong",
    }),
    { headers: jsonHeaders() },
  );
  not5xx(res);
  check(res, {
    "401 or 429": (r) => r.status === 401 || r.status === 429,
  });
  sleep(0.15);
}
