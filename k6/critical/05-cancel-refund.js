/**
 * Critical: cancel booking (+ refund path when confirmed).
 * Env: GUEST_TOKEN, BOOKING_ID
 */
import http from "k6/http";
import { sleep } from "k6";
import { baseUrl, guestToken, vus, duration, jsonHeaders } from "../lib/config.js";
import { statusOneOf, not5xx } from "../lib/checks.js";
import { moneyPath } from "../lib/thresholds.js";

export const options = {
  vus: Math.min(vus(), 5),
  duration: duration(),
  thresholds: moneyPath,
};

export default function () {
  const token = guestToken();
  const bookingId = __ENV.BOOKING_ID || "";
  if (!token || !bookingId) {
    sleep(1);
    return;
  }

  const res = http.post(
    `${baseUrl()}/api/v1/bookings/${bookingId}/cancel`,
    JSON.stringify({ reason: "k6-load-cancel" }),
    { headers: jsonHeaders(token) },
  );

  statusOneOf(res, [200, 409, 403, 404, 422], "cancel outcome");
  not5xx(res);
  sleep(0.5);
}
