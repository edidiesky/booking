/**
 * Critical: payment initialize for pending_payment booking.
 * Bookings are seeded in setup(); each VU gets its own.
 * Env: GUEST_TOKEN, PROPERTY_ID, ROOM_TYPE_ID (see k6/.env.k6)
 */
import http from "k6/http";
import { sleep } from "k6";
import { baseUrl, guestToken, vus, duration, jsonHeaders } from "../lib/config.js";
import { statusOneOf, not5xx } from "../lib/checks.js";
import { moneyPath } from "../lib/thresholds.js";
import { seedBookings } from "../lib/seed-bookings.js";

export const options = {
  vus: vus(),
  duration: duration(),
  thresholds: moneyPath,
};

export function setup() {
  const count = Number(__ENV.VUS || 10);
  const bookingIds = seedBookings(count);
  console.log(`Seeded ${bookingIds.length} bookings for ${count} VUs`);
  return { bookingIds };
}

export default function (data) {
  const token = guestToken();
  const bookingId = data.bookingIds[__VU - 1];

  if (!token || !bookingId) {
    console.warn(`VU ${__VU}: missing token or booking`);
    sleep(1);
    return;
  }

  const key = `pay-init-${__VU}-${__ITER}`;
  const res = http.post(
    `${baseUrl()}/api/v1/payments/initialize`,
    JSON.stringify({
      bookingId,
      gateway: "paystack",
      callbackUrl: "https://example.com/k6-callback",
    }),
    {
      headers: {
        ...jsonHeaders(token),
        "Idempotency-Key": key,
      },
    },
  );

  statusOneOf(res, [200, 201, 409, 429], "pay init outcome");
  not5xx(res);
  sleep(0.3);
}