/**
 * Critical: same Idempotency-Key + body replayed — one side effect.
 * Env: GUEST_TOKEN, PROPERTY_ID, ROOM_TYPE_ID, fixed IDEMPOTENCY_KEY
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
  jsonHeaders,
} from "../lib/config.js";
import { not5xx } from "../lib/checks.js";
import { moneyPath } from "../lib/thresholds.js";

export const options = {
  vus: 1,
  iterations: Number(__ENV.REPLAY_COUNT || 5),
  thresholds: moneyPath,
};

const key = __ENV.IDEMPOTENCY_KEY || "k6-fixed-idem-key-reserve-1";

export default function () {
  const token = guestToken();
  if (!token || !propertyId() || !roomTypeId()) {
    sleep(1);
    return;
  }

  const body = JSON.stringify({
    propertyId: propertyId(),
    roomTypeId: roomTypeId(),
    checkIn: checkIn(),
    checkOut: checkOut(),
    roomsCount: 1,
    guestCount: 1,
  });

  const res = http.post(`${baseUrl()}/api/v1/bookings`, body, {
    headers: {
      ...jsonHeaders(token),
      "Idempotency-Key": key,
    },
  });

  not5xx(res);
  check(res, {
    "idempotent status": (r) =>
      [200, 201, 409].indexOf(r.status) !== -1,
  });
  sleep(0.2);
}
