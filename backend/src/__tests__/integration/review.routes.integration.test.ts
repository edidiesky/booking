import { describe, it, expect } from "@jest/globals";
import request from "supertest";
import { seedTenant, seedProperty, seedRoomType, seedUser, seedBooking } from "./helpers/seeders";
import buildApp from "./helpers/buildApp";
import { makeGuestToken, makeJwt } from "../setup/fixtures";

const app = buildApp();

describe("POST /api/v1/reviews", () => {
  describe("Happy Path", () => {
    /**
     * 1. It creates a real review for a genuinely checked_out booking owned by the requester
     */

    it("creates a real review for a checked_out booking owned by the requester", async () => {
      const tenant = await seedTenant();
      const property = await seedProperty({ tenantId: tenant.id });
      const roomType = await seedRoomType({ propertyId: property.id, tenantId: tenant.id });
      const guest = await seedUser({ userType: "guest" });
      const booking = await seedBooking({
        tenantId: tenant.id, propertyId: property.id, roomTypeId: roomType.id,
        guestUserId: guest.id, status: "checked_out",
      });
      const token = makeJwt({ userId: guest.id, userType: "guest" });

      const res = await request(app)
        .post("/api/v1/reviews")
        .set("Authorization", `Bearer ${token}`)
        .send({ bookingId: booking.id, rating: 5, title: "Great stay", comment: "Loved it." });

      expect(res.status).toBe(201);
      expect(res.body.data.rating).toBe(5);
    });
  });

  describe("Edge Cases", () => {
    /**
     * 1. It 409s a booking that hasn't been checked out yet, real server-side eligibility check,
     *    the comment in the source is explicit: never trust a client-supplied verified flag
     * 2. It 409s a genuine second review attempt on the same booking
     */

    it("409s a booking that hasn't been checked out yet", async () => {
      const tenant = await seedTenant();
      const property = await seedProperty({ tenantId: tenant.id });
      const roomType = await seedRoomType({ propertyId: property.id, tenantId: tenant.id });
      const guest = await seedUser({ userType: "guest" });
      const booking = await seedBooking({
        tenantId: tenant.id, propertyId: property.id, roomTypeId: roomType.id,
        guestUserId: guest.id, status: "confirmed",
      });
      const token = makeJwt({ userId: guest.id, userType: "guest" });

      const res = await request(app)
        .post("/api/v1/reviews")
        .set("Authorization", `Bearer ${token}`)
        .send({ bookingId: booking.id, rating: 5, title: "Too early", comment: "Not checked out yet." });

      expect(res.status).toBe(409);
    });

    it("409s a genuine second review attempt on the same booking", async () => {
      const tenant = await seedTenant();
      const property = await seedProperty({ tenantId: tenant.id });
      const roomType = await seedRoomType({ propertyId: property.id, tenantId: tenant.id });
      const guest = await seedUser({ userType: "guest" });
      const booking = await seedBooking({
        tenantId: tenant.id, propertyId: property.id, roomTypeId: roomType.id,
        guestUserId: guest.id, status: "checked_out",
      });
      const token = makeJwt({ userId: guest.id, userType: "guest" });
      const payload = { bookingId: booking.id, rating: 4, title: "First", comment: "First review." };

      await request(app).post("/api/v1/reviews").set("Authorization", `Bearer ${token}`).send(payload);
      const second = await request(app).post("/api/v1/reviews").set("Authorization", `Bearer ${token}`).send(payload);

      expect(second.status).toBe(409);
    });
  });

  describe("Failure Path", () => {
    /**
     * 1. It 403s a real guest attempting to review a different guest's booking
     */

    it("403s a real guest attempting to review a different guest's booking", async () => {
      const tenant = await seedTenant();
      const property = await seedProperty({ tenantId: tenant.id });
      const roomType = await seedRoomType({ propertyId: property.id, tenantId: tenant.id });
      const owner = await seedUser({ userType: "guest" });
      const booking = await seedBooking({
        tenantId: tenant.id, propertyId: property.id, roomTypeId: roomType.id,
        guestUserId: owner.id, status: "checked_out",
      });
      const otherGuest = await seedUser({ userType: "guest" });
      const token = makeJwt({ userId: otherGuest.id, userType: "guest" });

      const res = await request(app)
        .post("/api/v1/reviews")
        .set("Authorization", `Bearer ${token}`)
        .send({ bookingId: booking.id, rating: 1, title: "Not mine", comment: "Shouldn't work." });

      expect(res.status).toBe(403);
    });
  });
});

describe("GET /api/v1/reviews/room-types/:roomTypeId", () => {
  describe("Happy Path", () => {
    /**
     * 1. It 200s with no Authorization header, genuinely public per the route file's own comment
     */

    it("200s with no Authorization header, genuinely public", async () => {
      const tenant = await seedTenant();
      const property = await seedProperty({ tenantId: tenant.id });
      const roomType = await seedRoomType({ propertyId: property.id, tenantId: tenant.id });

      const res = await request(app).get(`/api/v1/reviews/room-types/${roomType.id}`);

      expect(res.status).toBe(200);
    });
  });
});

describe("POST /api/v1/reviews/:reviewId/helpful", () => {
  describe("Edge Cases", () => {
    /**
     * 1. It responds without any Authorization header at all, this route has no authenticate
     *    middleware whatsoever, confirmed from the route file, not assumed. Worth a real product
     *    decision on whether unlimited anonymous voting is intentional, this test documents
     *    current behavior, it doesn't bless it as correct.
     */

    it("responds with no Authorization header, route genuinely has no auth gate", async () => {
      const res = await request(app).post("/api/v1/reviews/00000000-0000-0000-0000-000000000000/helpful").send({});

      expect(res.status).not.toBe(401);
    });
  });
});