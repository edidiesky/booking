/**
 * Critical: PSP webhook → confirm booking.
 * Requires valid signed body for your PSP (or test bypass endpoint).
 */
import http from "k6/http";
import { sleep } from "k6";
import { baseUrl, vus, duration } from "../lib/config.js";
import { statusOneOf, not5xx } from "../lib/checks.js";
import { moneyPath } from "../lib/thresholds.js";

export const options = {
  vus: Math.min(vus(), 5), // webhooks should stay low concurrency
  duration: duration(),
  thresholds: moneyPath,
};

export default function () {
  const path = __ENV.WEBHOOK_PATH || "/api/v1/webhooks/paystack";
  const body =
    __ENV.WEBHOOK_BODY ||
    JSON.stringify({
      event: "charge.success",
      data: { reference: __ENV.PAYMENT_REF || `k6-ref-${__VU}` },
    });
  const sig = __ENV.WEBHOOK_SIG || "";

  const res = http.post(`${baseUrl()}${path}`, body, {
    headers: {
      "Content-Type": "application/json",
      ...(sig ? { "x-paystack-signature": sig } : {}),
    },
  });

  statusOneOf(res, [200, 201, 400, 401, 409], "webhook handled");
  not5xx(res);
  sleep(0.5);
}
