/**
 * Critical: payment initialize for pending_payment booking.
 * Env: GUEST_TOKEN, BOOKING_ID (pending_payment)
 */
import http from "k6/http";
import { sleep } from "k6";
import { baseUrl, guestToken, vus, duration, jsonHeaders } from "../lib/config.js";
import { statusOneOf, not5xx } from "../lib/checks.js";
import { moneyPath } from "../lib/thresholds.js";

export const options = {
  vus: vus(),
  duration: duration(),
  thresholds: moneyPath,
};

export default function () {
  const token = guestToken();
  const bookingId = __ENV.BOOKING_ID || "";
  if (!token || !bookingId) {
    console.warn("Set GUEST_TOKEN and BOOKING_ID");
    sleep(1);
    return;
  }

  const key = __ENV.IDEMPOTENCY_KEY || `pay-init-${__VU}-${__ITER}`;
  const res = http.post(
    `${baseUrl()}/api/v1/payments/initialize`,
    JSON.stringify({ bookingId }),
    {
      headers: {
        ...jsonHeaders(token),
        "Idempotency-Key": key,
      },
    },
  );

  statusOneOf(res, [200, 201, 409, 422, 429], "pay init outcome");
  not5xx(res);
  sleep(0.3);
}
