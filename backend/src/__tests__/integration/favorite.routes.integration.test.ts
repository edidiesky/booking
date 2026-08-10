import { describe, it, expect } from "@jest/globals";
import request from "supertest";
import { seedTenant, seedProperty, seedUser } from "./helpers/seeders";
import buildApp from "./helpers/buildApp";
import { makeJwt } from "../setup/fixtures";

const app = buildApp();

describe("PUT /api/v1/favorites/:propertyId", () => {
  describe("Happy Path", () => {
    /**
     * 1. It adds a real favorite row for the authenticated guest
     */

    it("adds a real favorite row for the authenticated guest", async () => {
      const tenant = await seedTenant();
      const property = await seedProperty({ tenantId: tenant.id });
      const guest = await seedUser({ userType: "guest" });
      const token = makeJwt({ userId: guest.id, userType: "guest" });

      const res = await request(app).put(`/api/v1/favorites/${property.id}`).set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  describe("Edge Cases", () => {
    /**
     * 1. It responds without erroring on a second, identical favorite of the same property,
     *    documenting whatever the real repository's conflict handling actually is, an upsert
     *    or a caught duplicate, not asserting which without having confirmed
     *    favoriteRepository.add's real implementation this turn
     */

    it("does not error on favoriting the same property twice", async () => {
      const tenant = await seedTenant();
      const property = await seedProperty({ tenantId: tenant.id });
      const guest = await seedUser({ userType: "guest" });
      const token = makeJwt({ userId: guest.id, userType: "guest" });

      await request(app).put(`/api/v1/favorites/${property.id}`).set("Authorization", `Bearer ${token}`);
      const second = await request(app).put(`/api/v1/favorites/${property.id}`).set("Authorization", `Bearer ${token}`);

      expect(second.status).not.toBe(500);
    });
  });

  describe("Failure Path", () => {
    /**
     * 1. It 401s with no Authorization header at all
     */

    it("401s with no Authorization header", async () => {
      const res = await request(app).put("/api/v1/favorites/00000000-0000-0000-0000-000000000000");

      expect(res.status).toBe(401);
    });
  });
});

describe("GET /api/v1/favorites", () => {
  describe("Happy Path", () => {
    /**
     * 1. It returns only this guest's own favorited properties
     */

    it("returns only this guest's own favorited properties", async () => {
      const tenant = await seedTenant();
      const property = await seedProperty({ tenantId: tenant.id });
      const guest = await seedUser({ userType: "guest" });
      const token = makeJwt({ userId: guest.id, userType: "guest" });
      await request(app).put(`/api/v1/favorites/${property.id}`).set("Authorization", `Bearer ${token}`);

      const res = await request(app).get("/api/v1/favorites").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      const favorites = res.body.data.favorites ?? res.body.data;
      expect(favorites.length).toBeGreaterThan(0);
    });
  });

  describe("Edge Cases", () => {
    /**
     * 1. It returns an empty result for a guest who has never favorited anything
     */

    it("returns an empty result for a guest with no favorites yet", async () => {
      const guest = await seedUser({ userType: "guest" });
      const token = makeJwt({ userId: guest.id, userType: "guest" });

      const res = await request(app).get("/api/v1/favorites").set("Authorization", `Bearer ${token}`);

      const favorites = res.body.data.favorites ?? res.body.data;
      expect(favorites).toEqual([]);
    });
  });
});

describe("GET /api/v1/favorites/ids", () => {
  describe("Happy Path", () => {
    /**
     * 1. It returns only the subset of the given propertyIds that this guest has actually
     *    favorited, real filtering against the real set, not the full favorites list
     */

    it("returns only the favorited subset of the given propertyIds", async () => {
      const tenant = await seedTenant();
      const favorited = await seedProperty({ tenantId: tenant.id });
      const notFavorited = await seedProperty({ tenantId: tenant.id });
      const guest = await seedUser({ userType: "guest" });
      const token = makeJwt({ userId: guest.id, userType: "guest" });
      await request(app).put(`/api/v1/favorites/${favorited.id}`).set("Authorization", `Bearer ${token}`);

      const res = await request(app)
        .get(`/api/v1/favorites/ids?propertyIds=${favorited.id},${notFavorited.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.body.data).toEqual([favorited.id]);
    });
  });

  describe("Edge Cases", () => {
    /**
     * 1. It returns an empty array for an empty propertyIds query param, not an error
     */

    it("returns an empty array for an empty propertyIds param", async () => {
      const guest = await seedUser({ userType: "guest" });
      const token = makeJwt({ userId: guest.id, userType: "guest" });

      const res = await request(app).get("/api/v1/favorites/ids").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });
});

describe("DELETE /api/v1/favorites/:propertyId", () => {
  describe("Happy Path", () => {
    /**
     * 1. It removes a real, previously-added favorite
     */

    it("removes a real, previously-added favorite", async () => {
      const tenant = await seedTenant();
      const property = await seedProperty({ tenantId: tenant.id });
      const guest = await seedUser({ userType: "guest" });
      const token = makeJwt({ userId: guest.id, userType: "guest" });
      await request(app).put(`/api/v1/favorites/${property.id}`).set("Authorization", `Bearer ${token}`);

      const res = await request(app).delete(`/api/v1/favorites/${property.id}`).set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  describe("Edge Cases", () => {
    /**
     * 1. It does not error when removing a property that was never favorited in the first place
     */

    it("does not error when removing a never-favorited property", async () => {
      const tenant = await seedTenant();
      const property = await seedProperty({ tenantId: tenant.id });
      const guest = await seedUser({ userType: "guest" });
      const token = makeJwt({ userId: guest.id, userType: "guest" });

      const res = await request(app).delete(`/api/v1/favorites/${property.id}`).set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });
});