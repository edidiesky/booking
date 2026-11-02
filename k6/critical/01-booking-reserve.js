/**
 * Critical: booking reserve — hold inventory for dates.
 * Failure modes under load: oversell, lost lock, lock never released.
 */
import http from "k6/http";
import { sleep } from "k6";
import { baseUrl, guestToken, propertyId, roomTypeId, checkIn, checkOut, vus, duration, jsonHeaders } from "../lib/config.js";
import { statusOneOf, not5xx } from "../lib/checks.js";
import { writeCritical } from "../lib/thresholds.js";

export const options = {
  vus: vus(),
  duration: duration(),
  thresholds: writeCritical,
};

export default function () {
  const token = guestToken();
  if (!token || !propertyId() || !roomTypeId()) {
    console.warn("Set GUEST_TOKEN, PROPERTY_ID, ROOM_TYPE_ID");
    sleep(1);
    return;
  }

  const res = http.post(
    `${baseUrl()}/api/v1/bookings`,
    JSON.stringify({
      propertyId: propertyId(),
      roomTypeId: roomTypeId(),
      checkIn: checkIn(),
      checkOut: checkOut(),
      roomsCount: 1,
      guestCount: 1,
    }),
    { headers: jsonHeaders(token) },
  );

  // 201 created, 409 conflict (sold out / lock), 429 rate limit — all acceptable under contention
  statusOneOf(res, [201, 200, 409, 422, 429], "reserve accepted or contended");
  not5xx(res, "reserve not 5xx");
  sleep(0.3);
}
