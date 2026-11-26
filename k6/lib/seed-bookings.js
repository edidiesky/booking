// k6/lib/seed-bookings.js
import http from "k6/http";
import { sleep } from "k6";
import { baseUrl, guestToken, jsonHeaders } from "./config.js";

function postBooking(i, propertyId, roomTypeId, checkIn, checkOut) {
  return http.post(
    `${baseUrl()}/api/v1/bookings`,
    JSON.stringify({
      propertyId,
      roomTypeId,
      checkIn,
      checkOut,
      roomsCount: 1,
      guestCount: 2,
      specialRequests: "k6 seed",
    }),
    {
      headers: {
        ...jsonHeaders(guestToken()),
        "Idempotency-Key": `seed-${i}-${Date.now()}`,
      },
      tags: { name: "seed_booking" },
    },
  );
}

export function seedBookings(count) {
  const propertyId = __ENV.PROPERTY_ID || "";
  const roomTypeId = __ENV.ROOM_TYPE_ID || "";
  if (!propertyId) throw new Error("PROPERTY_ID must be set in .env.k6");
  if (!roomTypeId) throw new Error("ROOM_TYPE_ID must be set in .env.k6");

  const checkIn = __ENV.CHECK_IN || "2026-12-01";
  const checkOut = __ENV.CHECK_OUT || "2026-12-05";

  const bookingIds = [];

  for (let i = 0; i < count; i++) {
    let res = postBooking(i, propertyId, roomTypeId, checkIn, checkOut);

    if (res.status === 429) {
      const retryAfter = Number(res.headers["Retry-After"] || "5");
      console.log(`seed ${i}: rate-limited, sleeping ${retryAfter}s`);
      sleep(retryAfter);
      res = postBooking(i, propertyId, roomTypeId, checkIn, checkOut);
    }

    if (res.status !== 201 && res.status !== 200) {
      throw new Error(
        `seed ${i}/${count} failed: status=${res.status} body=${res.body}`,
      );
    }

    const body = res.json();
    const bookingId = body?.data?.bookingId;
    if (typeof bookingId !== "string") {
      throw new Error(
        `seed ${i}/${count}: missing data.bookingId. body=${res.body}`,
      );
    }
    bookingIds.push(bookingId);

    // Pace the next request to avoid triggering the limiter again.
    sleep(0.6);
  }

  return bookingIds;
}