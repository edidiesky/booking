/** Hot+critical: many VUs reserve same room/dates — contention */
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
import { writeCritical } from "../lib/thresholds.js";

export const options = {
  vus: vus(),
  duration: duration(),
  thresholds: writeCritical,
};

export default function () {
  const token = guestToken();
  if (!token || !propertyId() || !roomTypeId()) {
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

  not5xx(res);
  check(res, {
    "contention-safe status": (r) =>
      [200, 201, 409, 422, 429].indexOf(r.status) !== -1,
  });
  sleep(0.2);
}
