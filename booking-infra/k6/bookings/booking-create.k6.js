import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";

const bookingDuration = new Trend("booking_create_duration_ms", true);
const bookingFailRate = new Rate("booking_create_fail_rate");
const bookingConflictRate = new Rate("booking_conflict_rate");
const bookingCount = new Counter("booking_create_count");

export const options = {
  stages: [
    { duration: "1m", target: 5 },
    { duration: "2m", target: 15 },
    { duration: "2m", target: 30 },
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    booking_create_duration_ms: ["p(90)<200", "p(99)<700"],
    booking_create_fail_rate: ["rate<0.01"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:4000";

// Fixed, pre-seeded property/room type, not created fresh per run.
// Creating a real property per test run is possible but pollutes the
// database with load-test artifacts on every execution, a stable seeded
// fixture avoids that at the cost of needing a one-time setup step
// outside this script.
const PROPERTY_ID = __ENV.LOAD_TEST_PROPERTY_ID;
const ROOM_TYPE_ID = __ENV.LOAD_TEST_ROOM_TYPE_ID;
const GUEST_TOKEN = __ENV.LOAD_TEST_GUEST_TOKEN;

if (!PROPERTY_ID || !ROOM_TYPE_ID || !GUEST_TOKEN) {
  throw new Error(
    "LOAD_TEST_PROPERTY_ID, LOAD_TEST_ROOM_TYPE_ID, and LOAD_TEST_GUEST_TOKEN must be set. " +
    "This script does not create its own fixtures, see the comment above."
  );
}

// Spreads check-in dates across roughly a 2-year future window so
// concurrent VUs mostly land on different date ranges. This does not
// eliminate collisions, it makes them rare enough that a real bug isn't
// masked by expected inventory contention, and lets booking_conflict_rate
// stay separate from booking_create_fail_rate so a spike in real errors
// is visible instead of being averaged into "expected" 409s.
function randomFutureDateRange() {
  const daysOut = 30 + Math.floor(Math.random() * 700);
  const stayLength = 1 + Math.floor(Math.random() * 5);
  const checkIn = new Date(Date.now() + daysOut * 86400000);
  const checkOut = new Date(checkIn.getTime() + stayLength * 86400000);
  const fmt = (d) => d.toISOString().split("T")[0];
  return { checkIn: fmt(checkIn), checkOut: fmt(checkOut) };
}

export default function () {
  const { checkIn, checkOut } = randomFutureDateRange();

  const payload = JSON.stringify({
    propertyId: PROPERTY_ID,
    roomTypeId: ROOM_TYPE_ID,
    checkIn,
    checkOut,
    roomsCount: 1,
    guestCount: 1 + Math.floor(Math.random() * 2),
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GUEST_TOKEN}`,
    },
    timeout: "10s",
  };

  const start = Date.now();
  const res = http.post(`${BASE_URL}/api/v1/bookings`, payload, params);
  const duration = Date.now() - start;

  bookingDuration.add(duration);
  bookingCount.add(1);

  const isConflict = res.status === 409;
  bookingConflictRate.add(isConflict);

  const success = check(res, {
    "status is 201 or an expected 409 conflict": (r) => r.status === 201 || r.status === 409,
    "201 responses have a booking id and pending_payment status": (r) => {
      if (r.status !== 201) return true; // not applicable, don't fail a real 201-check on a 409
      try {
        const data = JSON.parse(r.body).data;
        return data?.id !== undefined && data?.status === "pending_payment";
      } catch {
        return false;
      }
    },
  });

  bookingFailRate.add(!success);

  if (!success) {
    console.error(`FAIL status=${res.status} body=${res.body?.slice(0, 300)}`);
  }

  sleep(1);
}