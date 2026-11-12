/**
 * Overlap: full money path outline.
 * Steps: reserve → pay init → (optional webhook).
 * Needs GUEST_TOKEN, PROPERTY_ID, ROOM_TYPE_ID; webhook vars optional.
 */
import http from "k6/http";
import { sleep, check } from "k6";
import {
  baseUrl,
  guestToken,
  propertyId,
  roomTypeId,
  checkIn,
  checkOut,
  vus,
  duration,
  jsonHeaders,
} from "../lib/config.js";
import { not5xx } from "../lib/checks.js";
import { moneyPath } from "../lib/thresholds.js";

export const options = {
  vus: Math.min(vus(), 10),
  duration: duration(),
  thresholds: moneyPath,
};

export default function () {
  const token = guestToken();
  if (!token || !propertyId() || !roomTypeId()) {
    sleep(1);
    return;
  }

  const headers = jsonHeaders(token);
  const reserve = http.post(
    `${baseUrl()}/api/v1/bookings`,
    JSON.stringify({
      propertyId: propertyId(),
      roomTypeId: roomTypeId(),
      checkIn: checkIn(),
      checkOut: checkOut(),
      roomsCount: 1,
      guestCount: 1,
    }),
    { headers },
  );
  not5xx(reserve);

  let bookingId = "";
  try {
    const body = JSON.parse(reserve.body);
    bookingId = body?.data?.bookingId || body?.bookingId || "";
  } catch (_) {}

  if (bookingId && (reserve.status === 200 || reserve.status === 201)) {
    const pay = http.post(
      `${baseUrl()}/api/v1/payments/initialize`,
      JSON.stringify({ bookingId }),
      {
        headers: {
          ...headers,
          "Idempotency-Key": `k6-pay-${bookingId}`,
        },
      },
    );
    not5xx(pay);
    check(pay, {
      "pay init ok or conflict": (r) =>
        [200, 201, 409, 422].indexOf(r.status) !== -1,
    });
  }

  sleep(0.5);
}
