/**
 * Critical: escrow release / host payout.
 * Env: HOST_TOKEN, BOOKING_ID (or ESCROW_ID per your API)
 */
import http from "k6/http";
import { sleep } from "k6";
import { baseUrl, hostToken, vus, duration, jsonHeaders } from "../lib/config.js";
import { statusOneOf, not5xx } from "../lib/checks.js";
import { moneyPath } from "../lib/thresholds.js";

export const options = {
  vus: Math.min(vus(), 3),
  duration: duration(),
  thresholds: moneyPath,
};

export default function () {
  const token = hostToken();
  const bookingId = __ENV.BOOKING_ID || "";
  if (!token || !bookingId) {
    sleep(1);
    return;
  }

  // Adjust path to your real release endpoint
  const res = http.post(
    `${baseUrl()}/api/v1/escrow/${bookingId}/release`,
    JSON.stringify({}),
    { headers: jsonHeaders(token) },
  );

  statusOneOf(res, [200, 409, 403, 404, 422], "release outcome");
  not5xx(res);
  sleep(0.5);
}
