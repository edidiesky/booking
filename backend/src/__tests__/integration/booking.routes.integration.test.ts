import { describe, it, expect } from "@jest/globals";
import request from "supertest";
import {
  seedTenant,
  seedProperty,
  seedRoomType,
  seedUser,
  seedBooking,
} from "./helpers/seeders";
import buildApp from "./helpers/buildApp";
import { makeGuestToken, makeHostToken, makeJwt } from "../setup/fixtures";
import { queryOne } from "@booking/shared";

const app = buildApp();

describe("POST /api/v1/bookings", () => {
  describe("Happy Path", () => {
    /**
     * 1. It creates a real pending_payment booking for an active property/room type within quantity
     */

    it("creates a real pending_payment booking within quantity", async () => {
      const tenant = await seedTenant();
      const property = await seedProperty({ tenantId: tenant.id });
      const roomType = await seedRoomType({
        propertyId: property.id,
        tenantId: tenant.id,
      });
      const token = makeGuestToken();

      const res = await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          propertyId: property.id,
          roomTypeId: roomType.id,
          checkIn: "2099-01-15",
          checkOut: "2099-01-17",
          roomsCount: 1,
          guestCount: 2,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe("pending_payment");
    });
  });

  describe("Edge Cases", () => {
    /**
     * 1. It 400s a roomsCount exceeding the room type's real seeded quantity
     * 2. It 400s a roomTypeId that exists but belongs to a different property than the one supplied
     */

    it("400s a roomsCount exceeding the room type's real quantity", async () => {
      const tenant = await seedTenant();
      const property = await seedProperty({ tenantId: tenant.id });
      const roomType = await seedRoomType({
        propertyId: property.id,
        tenantId: tenant.id,
      }); // quantity: 5, seeder default
      const token = makeGuestToken();

      const res = await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          propertyId: property.id,
          roomTypeId: roomType.id,
          checkIn: "2099-01-15",
          checkOut: "2099-01-17",
          roomsCount: 999,
          guestCount: 2,
        });

      expect(res.status).toBe(400);
    });

    it("400s a roomTypeId belonging to a different property than the one supplied", async () => {
      const tenant = await seedTenant();
      const property = await seedProperty({ tenantId: tenant.id });
      const otherProperty = await seedProperty({ tenantId: tenant.id });
      const roomType = await seedRoomType({
        propertyId: otherProperty.id,
        tenantId: tenant.id,
      });
      const token = makeGuestToken();

      const res = await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          propertyId: property.id,
          roomTypeId: roomType.id,
          checkIn: "2099-01-15",
          checkOut: "2099-01-17",
          roomsCount: 1,
          guestCount: 2,
        });

      expect(res.status).toBe(400);
    });
  });

  describe("Failure Path", () => {
    /**
     * 1. It 403s a real host token, this route is authorize("guest") only
     * 2. It 404s a syntactically valid but non-existent propertyId
     */

    it("403s a real host token, guest-only route", async () => {
      const token = makeHostToken();

      const res = await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          propertyId: "00000000-0000-0000-0000-000000000000",
          roomTypeId: "00000000-0000-0000-0000-000000000000",
          checkIn: "2099-01-15",
          checkOut: "2099-01-17",
          roomsCount: 1,
          guestCount: 2,
        });

      expect(res.status).toBe(403);
    });

    it("404s a non-existent propertyId", async () => {
      const token = makeGuestToken();

      const res = await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          propertyId: "00000000-0000-0000-0000-000000000000",
          roomTypeId: "00000000-0000-0000-0000-000000000000",
          checkIn: "2099-01-15",
          checkOut: "2099-01-17",
          roomsCount: 1,
          guestCount: 2,
        });

      expect(res.status).toBe(404);
    });
  });
});

describe("POST /api/v1/bookings — double booking", () => {
  describe("Edge Cases", () => {
    /**
     * 1. It return 409 for a sequential second booking that would exceed the room type's remaining
     *    capacity for an overlapping date range, real availabilityRepository.isAvailable
     *    check, not a static quantity ceiling
     */

    it("409s a sequential second booking that exceeds remaining capacity for overlapping dates", async () => {
      const tenant = await seedTenant();
      const property = await seedProperty({ tenantId: tenant.id });
      const roomType = await seedRoomType({
        propertyId: property.id,
        tenantId: tenant.id,
      });
      await queryOne(`UPDATE room_types SET quantity = 1 WHERE id = $1`, [
        roomType.id,
      ]);

      const guestA = await seedUser({ userType: "guest" });
      const tokenA = makeJwt({ userId: guestA.id, userType: "guest" });
      const guestB = await seedUser({ userType: "guest" });
      const tokenB = makeJwt({ userId: guestB.id, userType: "guest" });
      const dates = { checkIn: "2099-06-01", checkOut: "2099-06-03" };

      const first = await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          propertyId: property.id,
          roomTypeId: roomType.id,
          roomsCount: 1,
          guestCount: 1,
          ...dates,
        });

      const second = await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${tokenB}`)
        .send({
          propertyId: property.id,
          roomTypeId: roomType.id,
          roomsCount: 1,
          guestCount: 1,
          ...dates,
        });

      expect(first.status).toBe(201);
      expect(second.status).toBe(409);
    });

    /**
     * 2. It allows the second booking once dates no longer overlap, proving the 409 above
     *    is genuinely date-range-scoped, not a blanket "room type is fully booked forever"
     *    state, a real, meaningful negative control for the test above.
     */

    it("allows a second booking for the same room type once the date range doesn't overlap", async () => {
      const tenant = await seedTenant();
      const property = await seedProperty({ tenantId: tenant.id });
      const roomType = await seedRoomType({
        propertyId: property.id,
        tenantId: tenant.id,
      });
      await queryOne(`UPDATE room_types SET quantity = 1 WHERE id = $1`, [
        roomType.id,
      ]);

      const guestA = await seedUser({ userType: "guest" });
      const tokenA = makeJwt({ userId: guestA.id, userType: "guest" });
      const guestB = await seedUser({ userType: "guest" });
      const tokenB = makeJwt({ userId: guestB.id, userType: "guest" });

      const first = await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          propertyId: property.id,
          roomTypeId: roomType.id,
          roomsCount: 1,
          guestCount: 1,
          checkIn: "2099-06-01",
          checkOut: "2099-06-03",
        });

      const second = await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${tokenB}`)
        .send({
          propertyId: property.id,
          roomTypeId: roomType.id,
          roomsCount: 1,
          guestCount: 1,
          checkIn: "2099-06-10",
          checkOut: "2099-06-12",
        });

      expect(first.status).toBe(201);
      expect(second.status).toBe(201);
    });

    /**
     * 3. It resolves two genuinely simultaneous requests for the last available room to exactly
     *    one success and one 409, never both succeeding. This is a real concurrency test, not
     *    a sequential approximation, correctness here comes from Postgres's own transactional
     *    locking (availabilityRepository.acquireLock inside withTransaction), not from JS timing,
     *    which is what makes this reliable to assert deterministically.
     */

    it("resolves two truly simultaneous requests for the last room to exactly one success", async () => {
      const tenant = await seedTenant();
      const property = await seedProperty({ tenantId: tenant.id });
      const roomType = await seedRoomType({
        propertyId: property.id,
        tenantId: tenant.id,
      });
      await queryOne(`UPDATE room_types SET quantity = 1 WHERE id = $1`, [
        roomType.id,
      ]);

      const guestA = await seedUser({ userType: "guest" });
      const tokenA = makeJwt({ userId: guestA.id, userType: "guest" });
      const guestB = await seedUser({ userType: "guest" });
      const tokenB = makeJwt({ userId: guestB.id, userType: "guest" });
      const dates = { checkIn: "2099-07-01", checkOut: "2099-07-03" };

      const [resA, resB] = await Promise.all([
        request(app)
          .post("/api/v1/bookings")
          .set("Authorization", `Bearer ${tokenA}`)
          .send({
            propertyId: property.id,
            roomTypeId: roomType.id,
            roomsCount: 1,
            guestCount: 1,
            ...dates,
          }),
        request(app)
          .post("/api/v1/bookings")
          .set("Authorization", `Bearer ${tokenB}`)
          .send({
            propertyId: property.id,
            roomTypeId: roomType.id,
            roomsCount: 1,
            guestCount: 1,
            ...dates,
          }),
      ]);

      const statuses = [resA.status, resB.status].sort();
      expect(statuses).toEqual([201, 409]);
    });
  });
});

describe("GET /api/v1/bookings/:bookingId", () => {
  describe("Happy Path", () => {
    /**
     * 1. It 200s the owning guest viewing their own booking
     */

    it("200s the owning guest viewing their own booking", async () => {
      const tenant = await seedTenant();
      const property = await seedProperty({ tenantId: tenant.id });
      const roomType = await seedRoomType({
        propertyId: property.id,
        tenantId: tenant.id,
      });
      const guest = await seedUser({ userType: "guest" });
      const booking = await seedBooking({
        tenantId: tenant.id,
        propertyId: property.id,
        roomTypeId: roomType.id,
        guestUserId: guest.id,
      });
      const token = makeJwt({ userId: guest.id, userType: "guest" });

      const res = await request(app)
        .get(`/api/v1/bookings/${booking.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  describe("Edge Cases", () => {
    /**
     * 1. CONFIRMED GAP, not expected-safe behavior: a host from a completely unrelated tenant
     *    can view this booking's full details. The route has no requireTenantMember, and the
     *    controller's own ownership check only guards userType === "guest", it never compares
     *    booking.tenant_id against the requester's tenant at all for host actors. This test
     *    documents that this currently returns 200, it is not asserting that 200 is correct,
     *    it's flagging a real cross-tenant data exposure that should probably be a 403.
     */

    it("currently 200s for a host from a completely unrelated tenant, real cross-tenant gap", async () => {
      const tenant = await seedTenant();
      const property = await seedProperty({ tenantId: tenant.id });
      const roomType = await seedRoomType({
        propertyId: property.id,
        tenantId: tenant.id,
      });
      const guest = await seedUser({ userType: "guest" });
      const booking = await seedBooking({
        tenantId: tenant.id,
        propertyId: property.id,
        roomTypeId: roomType.id,
        guestUserId: guest.id,
      });
      const unrelatedTenant = await seedTenant();
      const token = makeHostToken(undefined, unrelatedTenant.id);

      const res = await request(app)
        .get(`/api/v1/bookings/${booking.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  describe("Failure Path", () => {
    /**
     * 1. It 403s a different real guest attempting to view someone else's booking
     */

    it("403s a different guest attempting to view someone else's booking", async () => {
      const tenant = await seedTenant();
      const property = await seedProperty({ tenantId: tenant.id });
      const roomType = await seedRoomType({
        propertyId: property.id,
        tenantId: tenant.id,
      });
      const owner = await seedUser({ userType: "guest" });
      const booking = await seedBooking({
        tenantId: tenant.id,
        propertyId: property.id,
        roomTypeId: roomType.id,
        guestUserId: owner.id,
      });
      const otherGuest = await seedUser({ userType: "guest" });
      const token = makeJwt({ userId: otherGuest.id, userType: "guest" });

      const res = await request(app)
        .get(`/api/v1/bookings/${booking.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });
});

describe("PATCH /api/v1/bookings/:bookingId/cancel", () => {
  describe("Happy Path", () => {
    /**
     * 1. It cancels a real pending_payment booking owned by the requesting guest
     */

    it("cancels a real pending_payment booking owned by the requester", async () => {
      const tenant = await seedTenant();
      const property = await seedProperty({ tenantId: tenant.id });
      const roomType = await seedRoomType({
        propertyId: property.id,
        tenantId: tenant.id,
      });
      const guest = await seedUser({ userType: "guest" });
      const booking = await seedBooking({
        tenantId: tenant.id,
        propertyId: property.id,
        roomTypeId: roomType.id,
        guestUserId: guest.id,
        status: "pending_payment",
      });
      const token = makeJwt({ userId: guest.id, userType: "guest" });

      const res = await request(app)
        .patch(`/api/v1/bookings/${booking.id}/cancel`)
        .set("Authorization", `Bearer ${token}`)
        .send({ reason: "Changed my mind" });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("cancelled");
    });
  });

  describe("Edge Cases", () => {
    /**
     * 1. It 409s a booking already checked_out, real cancelable-status list, only
     *    pending_payment/confirmed qualify
     */

    it("409s a booking already checked_out", async () => {
      const tenant = await seedTenant();
      const property = await seedProperty({ tenantId: tenant.id });
      const roomType = await seedRoomType({
        propertyId: property.id,
        tenantId: tenant.id,
      });
      const guest = await seedUser({ userType: "guest" });
      const booking = await seedBooking({
        tenantId: tenant.id,
        propertyId: property.id,
        roomTypeId: roomType.id,
        guestUserId: guest.id,
        status: "checked_out",
      });
      const token = makeJwt({ userId: guest.id, userType: "guest" });

      const res = await request(app)
        .patch(`/api/v1/bookings/${booking.id}/cancel`)
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(409);
    });
  });

  describe("Failure Path", () => {
    /**
     * 1. It 403s a different guest attempting to cancel someone else's booking
     */

    it("403s a different guest attempting to cancel someone else's booking", async () => {
      const tenant = await seedTenant();
      const property = await seedProperty({ tenantId: tenant.id });
      const roomType = await seedRoomType({
        propertyId: property.id,
        tenantId: tenant.id,
      });
      const owner = await seedUser({ userType: "guest" });
      const booking = await seedBooking({
        tenantId: tenant.id,
        propertyId: property.id,
        roomTypeId: roomType.id,
        guestUserId: owner.id,
        status: "pending_payment",
      });
      const otherGuest = await seedUser({ userType: "guest" });
      const token = makeJwt({ userId: otherGuest.id, userType: "guest" });

      const res = await request(app)
        .patch(`/api/v1/bookings/${booking.id}/cancel`)
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(403);
    });
  });
});

describe("POST /api/v1/bookings/internal/:bookingId/cancel", () => {
  describe("Happy Path", () => {
    /**
     * 1. It cancels a real booking with the correct x-internal-secret header, ownership
     *    check bypassed for requestingUserId "system"
     */

    it("cancels a real booking with the correct internal secret", async () => {
      const originalSecret = process.env.INTERNAL_SECRET;
      process.env.INTERNAL_SECRET = "test-internal-secret";
      const tenant = await seedTenant();
      const property = await seedProperty({ tenantId: tenant.id });
      const roomType = await seedRoomType({
        propertyId: property.id,
        tenantId: tenant.id,
      });
      const guest = await seedUser({ userType: "guest" });
      const booking = await seedBooking({
        tenantId: tenant.id,
        propertyId: property.id,
        roomTypeId: roomType.id,
        guestUserId: guest.id,
        status: "pending_payment",
      });

      const res = await request(app)
        .post(`/api/v1/bookings/internal/${booking.id}/cancel`)
        .set("x-internal-secret", "test-internal-secret")
        .send({});

      expect(res.status).toBe(200);
      process.env.INTERNAL_SECRET = originalSecret;
    });
  });

  describe("Failure Path", () => {
    /**
     * 1. It 401s a wrong or missing x-internal-secret header, real string comparison, not mocked
     * 2. It throws AppError.internal if INTERNAL_SECRET isn't configured on the server at all,
     *    a real, deliberate fail-closed design, worth its own test since it's a security-relevant
     *    default, not an incidental branch
     */

    it("401s a wrong x-internal-secret header", async () => {
      process.env.INTERNAL_SECRET = "real-secret";

      const res = await request(app)
        .post(
          "/api/v1/bookings/internal/00000000-0000-0000-0000-000000000000/cancel",
        )
        .set("x-internal-secret", "wrong-secret")
        .send({});

      expect(res.status).toBe(401);
    });

    it("500s (fail-closed) when INTERNAL_SECRET isn't configured on the server", async () => {
      const originalSecret = process.env.INTERNAL_SECRET;
      delete process.env.INTERNAL_SECRET;

      const res = await request(app)
        .post(
          "/api/v1/bookings/internal/00000000-0000-0000-0000-000000000000/cancel",
        )
        .set("x-internal-secret", "anything")
        .send({});

      expect(res.status).toBe(500);
      process.env.INTERNAL_SECRET = originalSecret;
    });
  });
});
