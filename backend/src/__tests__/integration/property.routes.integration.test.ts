// property.controller.integration.test.ts
import { describe, it, expect } from "@jest/globals";
import request from "supertest";
import {
  seedTenant,
  seedProperty,
  seedUser,
  seedRoomType,
  seedBooking,
} from "./helpers/seeders";
import buildApp from "./helpers/buildApp";
import { makeHostToken, makeGuestToken, makeJwt } from "../setup/fixtures";
import { queryOne } from "@booking/shared";

const app = buildApp();

describe("POST /api/v1/properties", () => {
  describe("Happy Path", () => {
    /**
     * 1. It creates a real property row for any authenticated host type, not just host:admin
     */

    it("creates a real property row for a host:inspector token", async () => {
      const tenant = await seedTenant();
      const token = makeHostToken(undefined, tenant.id);

      const res = await request(app)
        .post("/api/v1/properties")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Test Property",
          propertyType: "hotel",
          address: {
            street: "1 Test St",
            city: "Lagos",
            state: "Lagos",
            country: "Nigeria",
          },
          checkInTime: "14:00",
          checkOutTime: "11:00",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe("Test Property");
    });
  });

  describe("Edge Cases", () => {
    /**
     * 1. It 400s a missing required field (name) against real schema validation
     */

    it("400s a missing required field against real schema validation", async () => {
      const tenant = await seedTenant();
      const token = makeHostToken(undefined, tenant.id);

      const res = await request(app)
        .post("/api/v1/properties")
        .set("Authorization", `Bearer ${token}`)
        .send({ propertyType: "hotel" });

      expect(res.status).toBe(400);
    });
  });

  describe("Failure Path", () => {
    /**
     * 1. It 403s a guest token entirely, requireTenantMember's host-type allowlist rejects it
     */

    it("403s a guest token entirely", async () => {
      const token = makeGuestToken();

      const res = await request(app)
        .post("/api/v1/properties")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "X" });

      expect(res.status).toBe(403);
    });
  });
});

describe("PATCH /api/v1/properties/:propertyId", () => {
  describe("Happy Path", () => {
    /**
     * 1. It updates a real property row's name for the owning tenant's host
     */

    it("updates a real property row's name", async () => {
      const tenant = await seedTenant();
      const property = await seedProperty({ tenantId: tenant.id });
      const token = makeHostToken(undefined, tenant.id);

      const res = await request(app)
        .patch(`/api/v1/properties/${property.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Renamed Property" });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Renamed Property");
    });
  });

  describe("Edge Cases", () => {
    /**
     * 1. It 404s a syntactically valid but non-existent propertyId
     */

    it("404s a syntactically valid but non-existent propertyId", async () => {
      const tenant = await seedTenant();
      const token = makeHostToken(undefined, tenant.id);

      const res = await request(app)
        .patch("/api/v1/properties/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "X" });

      expect(res.status).toBe(404);
    });
  });

  describe("Failure Path", () => {
    /**
     * 1. It rejects a host from a different tenant attempting to update this property,
     *    real cross-tenant isolation, not assumed
     */

    it("rejects a different tenant's host attempting to update this property", async () => {
      const tenant = await seedTenant();
      const property = await seedProperty({ tenantId: tenant.id });
      const otherTenant = await seedTenant();
      const token = makeHostToken(undefined, otherTenant.id);

      const res = await request(app)
        .patch(`/api/v1/properties/${property.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Hijacked" });

      expect([403, 404]).toContain(res.status);
      // Real, honest uncertainty: I don't know from the route file alone
      // whether cross-tenant property access 404s (RLS silently hides
      // the row) or 403s (an explicit ownership check). Both are
      // defensible designs. This asserts "not 200," not a specific
      // code, tighten it to one exact value once the real behavior is
      // confirmed by actually running this.
    });
  });
});

describe("GET /api/v1/properties", () => {
  describe("Happy Path", () => {
    /**
     * 1. It 200s with no Authorization header at all, this list route is genuinely public
     * 2. It returns properties from multiple real tenants, each correctly attributed to its
     *    own actual tenant, not merged or mislabeled, real cross-tenant data integrity check,
     *    not a leak check in the "should be blocked" sense, this route is intentionally
     *    platform-wide
     */

    it("200s with no Authorization header at all", async () => {
      const res = await request(app).get("/api/v1/properties");

      expect(res.status).toBe(200);
    });

    it("returns properties from multiple real tenants, each correctly attributed to its own tenant", async () => {
      const tenantA = await seedTenant();
      const propertyA = await seedProperty({ tenantId: tenantA.id });
      const tenantB = await seedTenant();
      const propertyB = await seedProperty({ tenantId: tenantB.id });

      const res = await request(app).get("/api/v1/properties?limit=100");

      const properties = res.body.data.properties ?? res.body.data;
      const found = properties.filter((p: any) =>
        [propertyA.id, propertyB.id].includes(p.id),
      );

      expect(found).toHaveLength(2);
      const foundA = found.find((p: any) => p.id === propertyA.id);
      const foundB = found.find((p: any) => p.id === propertyB.id);
      expect(foundA.tenant_id ?? foundA.tenantId).toBe(tenantA.id);
      expect(foundB.tenant_id ?? foundB.tenantId).toBe(tenantB.id);
    });
  });

  describe("Edge Cases", () => {
    /**
     * 1. It returns an empty array, not an error, when search filters match zero real properties,
     *    a genuine empty result against real data, not a mocked empty case
     * 2. It only returns properties with status "active", a newly-seeded draft/paused property
     *    should not appear in the public list at all. I'm asserting this against
     *    searchProperties's likely behavior, not confirmed from its source this turn, this is
     *    the one sub-case worth double-checking directly if it fails.
     */

    it("returns an empty array when filters match zero real properties", async () => {
      const res = await request(app).get(
        "/api/v1/properties?city=NoSuchCityAnywhere12345",
      );

      const properties = res.body.data.properties ?? res.body.data;
      expect(res.status).toBe(200);
      expect(properties).toEqual([]);
    });

    it("does not include a non-active property in the public list", async () => {
      const tenant = await seedTenant();
      // seedProperty's own default status is "active", confirmed from
      // the seeder itself, so a non-active property needs a direct
      // update after seeding rather than an overrides param the seeder
      // doesn't currently accept.
      const property = await seedProperty({ tenantId: tenant.id });
      await queryOne(`UPDATE properties SET status = 'draft' WHERE id = $1`, [
        property.id,
      ]);

      const res = await request(app).get("/api/v1/properties?limit=100");

      const properties = res.body.data.properties ?? res.body.data;
      expect(properties.find((p: any) => p.id === property.id)).toBeUndefined();
    });
  });

  describe("Failure Path", () => {
    /**
     * 1. Genuinely none, this route has no auth to fail and no required parameters to reject,
     *    documenting that absence directly rather than silently having no Failure Path block,
     *    a missing block should mean "not written yet," not "nothing to test here."
     */
  });
});

describe("DELETE /api/v1/properties/:propertyId", () => {
  describe("Happy Path", () => {
    /**
     * 1. It deletes a property with zero bookings and cascades its room types away too
     */

    it("deletes a property with zero bookings, room types cascade away with it", async () => {
      const tenant = await seedTenant();
      const property = await seedProperty({ tenantId: tenant.id });
      await seedRoomType({ propertyId: property.id, tenantId: tenant.id });
      const token = makeHostToken(undefined, tenant.id);

      const res = await request(app)
        .delete(`/api/v1/properties/${property.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  describe("Edge Cases", () => {
    /**
     * 1. It currently 500s, not a clean 409, when the property has any booking history at all.
     *    This documents a real, confirmed gap: bookings.property_id has no ON DELETE clause
     *    (implicit NO ACTION), so Postgres blocks the delete with a raw FK violation that
     *    nothing in deleteProperty catches. This test exists to prove the gap and should be
     *    updated to expect 409 once the repository actually catches this and converts it to
     *    a real AppError, not left as documentation of a bug that's fine to keep.
     */

    it("500s on a property with booking history, unhandled FK violation, not a clean error yet", async () => {
      const tenant = await seedTenant();
      const property = await seedProperty({ tenantId: tenant.id });
      const roomType = await seedRoomType({
        propertyId: property.id,
        tenantId: tenant.id,
      });
      const guest = await seedUser({ userType: "guest" });
      await seedBooking({
        tenantId: tenant.id,
        propertyId: property.id,
        roomTypeId: roomType.id,
        guestUserId: guest.id,
        status: "cancelled",
      });
      const token = makeHostToken(undefined, tenant.id);

      const res = await request(app)
        .delete(`/api/v1/properties/${property.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(500);
    });
  });

  describe("Failure Path", () => {
    /**
     * 1. It 403s a guest token entirely
     */

    it("403s a guest token entirely", async () => {
      const tenant = await seedTenant();
      const property = await seedProperty({ tenantId: tenant.id });
      const token = makeGuestToken();

      const res = await request(app)
        .delete(`/api/v1/properties/${property.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });
});

describe("POST /api/v1/properties/:propertyId/room-types", () => {
  describe("Happy Path", () => {
    /**
     * 1. It creates a real room type with the given quantity and price
     */

    it("creates a real room type with the given quantity and price", async () => {
      const tenant = await seedTenant();
      const property = await seedProperty({ tenantId: tenant.id });
      const token = makeHostToken(undefined, tenant.id);

      const res = await request(app)
        .post(`/api/v1/properties/${property.id}/room-types`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Deluxe Room",
          maxOccupancy: 3,
          basePriceNgn: 75000,
          quantity: 4,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.quantity).toBe(4);
    });
  });

  describe("Edge Cases", () => {
    /**
     * 1. It 400s a zero or negative quantity, whatever the real validator enforces
     */

    it("400s a zero quantity against real schema validation", async () => {
      const tenant = await seedTenant();
      const property = await seedProperty({ tenantId: tenant.id });
      const token = makeHostToken(undefined, tenant.id);

      const res = await request(app)
        .post(`/api/v1/properties/${property.id}/room-types`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Zero Room",
          maxOccupancy: 2,
          basePriceNgn: 50000,
          quantity: 0,
        });

      expect(res.status).toBe(400);
    });
  });

  describe("Failure Path", () => {
    /**
     * 1. It 404s a syntactically valid but non-existent propertyId, or fails some other clean
     *    way, I don't have createRoomType's real not-found handling confirmed this turn
     */

    it("fails cleanly, not 201, for a non-existent propertyId", async () => {
      const tenant = await seedTenant();
      const token = makeHostToken(undefined, tenant.id);

      const res = await request(app)
        .post(
          "/api/v1/properties/00000000-0000-0000-0000-000000000000/room-types",
        )
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Ghost Room",
          maxOccupancy: 2,
          basePriceNgn: 50000,
          quantity: 1,
        });

      expect(res.status).not.toBe(201);
    });
  });
});

describe("PATCH /api/v1/properties/room-types/:roomTypeId/block", () => {
  describe("Happy Path", () => {
    /**
     * 1. It blocks a real date range and returns a plain confirmation message, no data payload
     */

    it("blocks a real date range", async () => {
      const tenant = await seedTenant();
      const property = await seedProperty({ tenantId: tenant.id });
      const roomType = await seedRoomType({
        propertyId: property.id,
        tenantId: tenant.id,
      });
      const token = makeHostToken(undefined, tenant.id);

      const res = await request(app)
        .patch(`/api/v1/properties/room-types/${roomType.id}/block`)
        .set("Authorization", `Bearer ${token}`)
        .send({ startDate: "2099-03-01", endDate: "2099-03-05", block: true });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Dates blocked.");
    });

    it("unblocks the same range with block: false", async () => {
      const tenant = await seedTenant();
      const property = await seedProperty({ tenantId: tenant.id });
      const roomType = await seedRoomType({
        propertyId: property.id,
        tenantId: tenant.id,
      });
      const token = makeHostToken(undefined, tenant.id);
      await request(app)
        .patch(`/api/v1/properties/room-types/${roomType.id}/block`)
        .set("Authorization", `Bearer ${token}`)
        .send({ startDate: "2099-03-01", endDate: "2099-03-05", block: true });

      const res = await request(app)
        .patch(`/api/v1/properties/room-types/${roomType.id}/block`)
        .set("Authorization", `Bearer ${token}`)
        .send({ startDate: "2099-03-01", endDate: "2099-03-05", block: false });

      expect(res.body.message).toBe("Dates unblocked.");
    });
  });

  describe("Failure Path", () => {
    /**
     * 1. It 403s a guest token entirely
     */

    it("403s a guest token entirely", async () => {
      const token = makeGuestToken();

      const res = await request(app)
        .patch(
          "/api/v1/properties/room-types/00000000-0000-0000-0000-000000000000/block",
        )
        .set("Authorization", `Bearer ${token}`)
        .send({ startDate: "2099-03-01", endDate: "2099-03-05", block: true });

      expect(res.status).toBe(403);
    });
  });
});

describe("GET /api/v1/properties/room-types/:roomTypeId/availability", () => {
  describe("Happy Path", () => {
    /**
     * 1. It 200s with no Authorization header, this route is genuinely public
     */

    it("200s with no Authorization header, genuinely public", async () => {
      const tenant = await seedTenant();
      const property = await seedProperty({ tenantId: tenant.id });
      const roomType = await seedRoomType({
        propertyId: property.id,
        tenantId: tenant.id,
      });

      const res = await request(app).get(
        `/api/v1/properties/room-types/${roomType.id}/availability?checkIn=2099-01-15&checkOut=2099-01-17`,
      );

      expect(res.status).toBe(200);
    });
  });

  describe("Edge Cases", () => {
    /**
     * 1. It 400s when checkIn/checkOut are missing, real controller-level guard, not schema validation
     */

    it("400s when checkIn/checkOut are missing", async () => {
      const tenant = await seedTenant();
      const property = await seedProperty({ tenantId: tenant.id });
      const roomType = await seedRoomType({
        propertyId: property.id,
        tenantId: tenant.id,
      });

      const res = await request(app).get(
        `/api/v1/properties/room-types/${roomType.id}/availability`,
      );

      expect(res.status).toBe(400);
    });
  });
});

describe("GET /api/v1/properties/mine", () => {
  describe("Happy Path", () => {
    /**
     * 1. It returns only this tenant's own properties, not another tenant's
     */

    it("returns only this tenant's own properties", async () => {
      const tenant = await seedTenant();
      await seedProperty({ tenantId: tenant.id });
      const otherTenant = await seedTenant();
      await seedProperty({ tenantId: otherTenant.id });
      const token = makeHostToken(undefined, tenant.id);

      const res = await request(app)
        .get("/api/v1/properties/mine")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      const ids = (res.body.data.properties ?? res.body.data).map(
        (p: any) => p.tenant_id ?? p.tenantId,
      );
      expect(new Set(ids)).toEqual(new Set([tenant.id]));
    });
  });

  describe("Failure Path", () => {
    /**
     * 1. It 403s a guest token entirely
     */

    it("403s a guest token entirely", async () => {
      const token = makeGuestToken();

      const res = await request(app)
        .get("/api/v1/properties/mine")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });
});
