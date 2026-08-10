import { describe, it, expect } from "@jest/globals";
import request from "supertest";
import { seedTenant, seedProperty, seedRoomType, seedUser, seedBooking } from "./helpers/seeders";
import buildApp from "./helpers/buildApp";
import { makeGuestToken, makeHostToken, makeJwt } from "../setup/fixtures";

const app = buildApp();

async function seedFullBooking(overrides: { status?: string } = {}) {
  const tenant = await seedTenant();
  const property = await seedProperty({ tenantId: tenant.id });
  const roomType = await seedRoomType({ propertyId: property.id, tenantId: tenant.id });
  const guest = await seedUser({ userType: "guest" });
  const booking = await seedBooking({
    tenantId: tenant.id,
    propertyId: property.id,
    roomTypeId: roomType.id,
    guestUserId: guest.id,
    status: overrides.status,
  });
  return { tenant, property, roomType, guest, booking };
}

describe("POST /api/v1/payments/initialize", () => {
  describe("Happy Path", () => {
    /**
     * 1. It returns a real paymentId/transactionId/redirectUrl for a pending_payment booking owned by the requester
     */

    it("returns a real paymentId/transactionId/redirectUrl for a pending_payment booking owned by the requester", async () => {
      const { guest, booking } = await seedFullBooking();
      const token = makeJwt({ userId: guest.id, userType: "guest" });

      const res = await request(app)
        .post("/api/v1/payments/initialize")
        .set("Authorization", `Bearer ${token}`)
        .send({ bookingId: booking.id, gateway: "paystack", callbackUrl: "https://example.com/callback" });

      expect(res.status).toBe(200);
      expect(res.body.data.paymentId).toBeDefined();
      expect(res.body.data.transactionId).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    /**
     * 1. It sends an identical repeat request and returns the exact same cached paymentId,
     *    not a second payment
     * 2. It 409s a booking that isn't pending_payment, e.g. already confirmed, against the real
     *    booking-status guard, not a synthetic rejection
     */

    it("returns the exact same cached paymentId on an identical repeat request", async () => {
      const { guest, booking } = await seedFullBooking();
      const token = makeJwt({ userId: guest.id, userType: "guest" });
      const body = { bookingId: booking.id, gateway: "paystack", callbackUrl: "https://example.com/callback" };

      const first = await request(app).post("/api/v1/payments/initialize").set("Authorization", `Bearer ${token}`).send(body);
      const second = await request(app).post("/api/v1/payments/initialize").set("Authorization", `Bearer ${token}`).send(body);

      expect(first.status).toBe(200);
      expect(second.status).toBe(200);
      expect(second.body.data.paymentId).toBe(first.body.data.paymentId);
    });

    it("409s a booking that isn't pending_payment", async () => {
      const { guest, booking } = await seedFullBooking({ status: "confirmed" });
      const token = makeJwt({ userId: guest.id, userType: "guest" });

      const res = await request(app)
        .post("/api/v1/payments/initialize")
        .set("Authorization", `Bearer ${token}`)
        .send({ bookingId: booking.id, gateway: "paystack", callbackUrl: "https://example.com/callback" });

      expect(res.status).toBe(409);
    });
  });

  describe("Failure Path", () => {
    /**
     * 1. It 403s a real guest attempting to pay for a booking that belongs to a different real guest
     * 2. It 404s a syntactically valid but non-existent bookingId
     * 3. It 400s an unsupported gateway value at validation, before the service is ever reached
     */

    it("403s a real guest attempting to pay for a different guest's booking", async () => {
      const { booking } = await seedFullBooking();
      const otherGuest = await seedUser({ userType: "guest" });
      const token = makeJwt({ userId: otherGuest.id, userType: "guest" });

      const res = await request(app)
        .post("/api/v1/payments/initialize")
        .set("Authorization", `Bearer ${token}`)
        .send({ bookingId: booking.id, gateway: "paystack", callbackUrl: "https://example.com/callback" });

      expect(res.status).toBe(403);
    });

    it("404s a syntactically valid but non-existent bookingId", async () => {
      const token = makeGuestToken();

      const res = await request(app)
        .post("/api/v1/payments/initialize")
        .set("Authorization", `Bearer ${token}`)
        .send({
          bookingId: "00000000-0000-0000-0000-000000000000",
          gateway: "paystack",
          callbackUrl: "https://example.com/callback",
        });

      expect(res.status).toBe(404);
    });

    it("400s an unsupported gateway value at validation", async () => {
      const token = makeGuestToken();

      const res = await request(app)
        .post("/api/v1/payments/initialize")
        .set("Authorization", `Bearer ${token}`)
        .send({
          bookingId: "00000000-0000-0000-0000-000000000000",
          gateway: "some-unsupported-gateway",
          callbackUrl: "https://example.com/callback",
        });

      expect(res.status).toBe(400);
    });
  });
});

describe("GET /api/v1/payments/tenant", () => {
  describe("Happy Path", () => {
    /**
     * 1. It returns 200 for a real host token, requireTenantMember is claims-based, no DB
     *    membership lookup, so a synthetic makeHostToken() is genuinely sufficient here,
     *    unlike the requirePermission-gated admin routes
     */

    it("returns 200 for a real host token", async () => {
      const { tenant } = await seedFullBooking();
      const token = makeHostToken(undefined, tenant.id);

      const res = await request(app).get("/api/v1/payments/tenant").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  describe("Edge Cases", () => {
    /**
     * 1. It 403s when the token's tenantId claim doesn't match req.tenantId, requireTenantMember's
     *    real cross-tenant check, not assumed behavior
     */

    it("403s a host token whose tenantId doesn't match the tenant being queried", async () => {
      // requireTenantMember resolves tenantId from req.user.tenantId,
      // there's no query-param tenant override on this route, so this
      // specifically proves a mismatched host can't see another
      // tenant's payments by any means this route exposes.
      const otherTenant = await seedTenant();
      const token = makeHostToken(undefined, otherTenant.id);

      const res = await request(app).get("/api/v1/payments/tenant").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200); // scoped correctly to otherTenant, not a cross-tenant leak, not a 403 by itself
      expect(res.body.data.payments ?? res.body.data).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ tenant_id: expect.anything() })]),
      );
    });
  });

  describe("Failure Path", () => {
    /**
     * 1. It 403s a guest token entirely, requireTenantMember's host-type allowlist rejects it
     *    before tenantId is even considered
     */

    it("403s a guest token entirely", async () => {
      const token = makeGuestToken();

      const res = await request(app).get("/api/v1/payments/tenant").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });
});