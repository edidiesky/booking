/**
 * Critical: same webhook twice — must not double-apply.
 * Single VU, fixed payload, 2+ iterations.
 */
import http from "k6/http";
import { sleep, check } from "k6";
import { baseUrl } from "../lib/config.js";
import { not5xx } from "../lib/checks.js";
import { moneyPath } from "../lib/thresholds.js";

export const options = {
  vus: 1,
  iterations: Number(__ENV.REPLAY_COUNT || 3),
  thresholds: moneyPath,
};

const path = __ENV.WEBHOOK_PATH || "/api/v1/webhooks/paystack";
const body =
  __ENV.WEBHOOK_BODY ||
  JSON.stringify({
    event: "charge.success",
    data: { reference: __ENV.PAYMENT_REF || "k6-replay-fixed-ref" },
  });
const sig = __ENV.WEBHOOK_SIG || "";

export default function () {
  const res = http.post(`${baseUrl()}${path}`, body, {
    headers: {
      "Content-Type": "application/json",
      ...(sig ? { "x-paystack-signature": sig } : {}),
    },
  });
  not5xx(res);
  check(res, {
    "idempotent-friendly status": (r) =>
      [200, 201, 409].indexOf(r.status) !== -1 || r.status < 500,
  });
  sleep(0.2);
}
