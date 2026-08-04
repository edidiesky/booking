import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";

const loginDuration = new Trend("login_duration_ms", true);
const loginFailRate = new Rate("login_fail_rate");
const loginCount = new Counter("login_count");

export const options = {
  stages: [
    { duration: "1m", target: 10 },
    { duration: "2m", target: 25 },
    { duration: "2m", target: 50 },
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    login_duration_ms: ["p(90)<300", "p(99)<700"],
    login_fail_rate: ["rate<0.01"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:4000";

const TEST_ACCOUNTS = (__ENV.TEST_ACCOUNTS_JSON
  ? JSON.parse(__ENV.TEST_ACCOUNTS_JSON)
  : [{ email: "k6-loadtest-1@example.com", password: "REPLACE_ME" }]
);

export default function () {
  const account = TEST_ACCOUNTS[Math.floor(Math.random() * TEST_ACCOUNTS.length)];

  const payload = JSON.stringify({
    email: account.email,
    password: account.password,
  });

  const params = {
    headers: { "Content-Type": "application/json" },
    timeout: "10s",
  };

  const start = Date.now();
  const res = http.post(`${BASE_URL}/api/v1/auth/login`, payload, params);
  const duration = Date.now() - start;

  loginDuration.add(duration);
  loginCount.add(1);

  const success = check(res, {
    "status is 200": (r) => r.status === 200,
    "has accessToken or a 2FA challenge": (r) => {
      try {
        const body = JSON.parse(r.body).data;
        return body?.accessToken !== undefined || body?.twoFactorRequired === true;
      } catch {
        return false;
      }
    },
  });

  loginFailRate.add(!success);

  if (!success) {
    console.error(`FAIL status=${res.status} body=${res.body?.slice(0, 300)}`);
  }

  sleep(1);
}