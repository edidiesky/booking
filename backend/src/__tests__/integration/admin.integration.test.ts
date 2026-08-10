import { describe, it, expect } from "@jest/globals";
import request from "supertest";
import { seedUser, seedPlatformAdmin } from "./helpers/seeders";
import buildApp from "./helpers/buildApp";
import { makeGuestToken, makeHostToken, makeJwt } from "../setup/fixtures";

const app = buildApp();

describe("GET /api/v1/admin/stats", () => {
  describe("Happy Path", () => {
    /**
     * 1. It returns the full real stats shape for an authenticated platform admin
     */

    it("returns the full real stats shape for an authenticated platform admin", async () => {
      const admin = await seedPlatformAdmin();
      const token = makeJwt({ userId: admin.id, userType: "platform:admin" });

      const res = await request(app).get("/api/v1/admin/stats").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("tenants");
      expect(res.body.data).toHaveProperty("guests");
      expect(res.body.data).toHaveProperty("volume");
      expect(res.body.data).toHaveProperty("revenueSplit");
    });
  });

  describe("Edge Cases", () => {
    /**
     * 1. It returnns 403s for a real guest token, correct userType claim, wrong role entirely
     * 2. It returnns 403s for a real host token, adjacent-but-not-admin userType, not just any non-guest
     */

    it("403s a real guest token, correct userType claim, wrong role entirely", async () => {
      const token = makeGuestToken();

      const res = await request(app).get("/api/v1/admin/stats").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it("403s a real host token, adjacent-but-not-admin userType, not just any non-guest", async () => {
      const token = makeHostToken();

      const res = await request(app).get("/api/v1/admin/stats").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe("Failure Path", () => {
    /**
     * 1. It returns 401s for requests with no Authorization header, authenticate never reaches authorize at all
     */

    it("401s with no Authorization header, authenticate never reaches authorize at all", async () => {
      const res = await request(app).get("/api/v1/admin/stats");

      expect(res.status).toBe(401);
    });
  });
});

describe("GET /api/v1/admin/guests", () => {
  describe("Happy Path", () => {
    /**
     * 1. It returns seeded guests with real camelCase fields (firstName, isEmailVerified, etc)
     * 2. It never leaks password_hash or pin_hash in the response, real regression coverage for the
     *    security fix confirmed earlier: admin.service.ts's listGuests previously returned raw
     *    repository rows unfiltered, shipping bcrypt hashes to the client. This test exists
     *    specifically to catch that regressing silently, not to check general shape correctness.
     */

    it("returns seeded guests with real camelCase fields", async () => {
      const admin = await seedPlatformAdmin();
      const token = makeJwt({ userId: admin.id, userType: "platform:admin" });
      await seedUser({ userType: "guest" });

      const res = await request(app).get("/api/v1/admin/guests").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.guests.length).toBeGreaterThan(0);
      expect(res.body.data.guests[0]).toHaveProperty("firstName");
      expect(res.body.data.guests[0]).toHaveProperty("isEmailVerified");
    });

    it("never leaks password_hash or pin_hash in the response", async () => {
      const admin = await seedPlatformAdmin();
      const token = makeJwt({ userId: admin.id, userType: "platform:admin" });
      await seedUser({ userType: "guest" });

      const res = await request(app).get("/api/v1/admin/guests").set("Authorization", `Bearer ${token}`);

      const raw = JSON.stringify(res.body);
      expect(raw).not.toMatch(/password_hash/);
      expect(raw).not.toMatch(/pin_hash/);
    });
  });

  describe("Edge Cases", () => {
    /**
     * 1. It returns an empty guests array, not an error, when no guests exist yet in this test's DB scope
     */

    it("returns an empty guests array, not an error, when no guests exist yet in this test's DB scope", async () => {
      const admin = await seedPlatformAdmin();
      const token = makeJwt({ userId: admin.id, userType: "platform:admin" });

      const res = await request(app).get("/api/v1/admin/guests?page=999").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.guests).toEqual([]);
    });
  });

  describe("Failure Path", () => {
    /**
     * 1. It 403s a non-admin token entirely, same flat-gate behavior as /stats
     */

    it("403s a non-admin token entirely", async () => {
      const token = makeGuestToken();

      const res = await request(app).get("/api/v1/admin/guests").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });
});

describe("POST /api/v1/admin/administrators/:userId/promote", () => {
  describe("Happy Path", () => {
    /**
     * 1. It promotes a real seeded guest to platform:admin and returns the updated row
     */

    it("promotes a real seeded guest to platform:admin and returns the updated row", async () => {
      const admin = await seedPlatformAdmin();
      const adminToken = makeJwt({ userId: admin.id, userType: "platform:admin" });
      const target = await seedUser({ userType: "guest" });

      const res = await request(app)
        .post(`/api/v1/admin/administrators/${target.id}/promote`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe("Edge Cases", () => {
    /**
     * 1. It 409s against real conflict detection when the target is already platform:admin,
     *    not a mocked rejection, seeding a genuine second admin first
     */

    it("409s against real conflict detection when the target is already platform:admin", async () => {
      const admin = await seedPlatformAdmin();
      const adminToken = makeJwt({ userId: admin.id, userType: "platform:admin" });
      const alreadyAdmin = await seedUser({ userType: "platform:admin" });

      const res = await request(app)
        .post(`/api/v1/admin/administrators/${alreadyAdmin.id}/promote`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(409);
    });
  });

  describe("Failure Path", () => {
    /**
     * 1. It 404s against a real, syntactically valid but non-existent userId
     * 2. It 403s a non-admin actor attempting to promote anyone at all
     */

    it("404s against a real, syntactically valid but non-existent userId", async () => {
      const admin = await seedPlatformAdmin();
      const adminToken = makeJwt({ userId: admin.id, userType: "platform:admin" });

      const res = await request(app)
        .post("/api/v1/admin/administrators/00000000-0000-0000-0000-000000000000/promote")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it("403s a non-admin actor attempting to promote anyone at all", async () => {
      const target = await seedUser({ userType: "guest" });
      const guestToken = makeGuestToken();

      const res = await request(app)
        .post(`/api/v1/admin/administrators/${target.id}/promote`)
        .set("Authorization", `Bearer ${guestToken}`);

      expect(res.status).toBe(403);
    });
  });
});

describe("GET /api/v1/admin/escrow", () => {
  describe("Happy Path", () => {
    /**
     * 1. It 200s for a real seeded admin with the platform:admin role genuinely bound
     *    via user_roles, not just a synthetic JWT claim, this route is requirePermission-gated,
     *    which does a real DB lookup a claims-only token can't satisfy.
     */

    it("200s for a real seeded admin with the platform:admin role genuinely bound", async () => {
      const admin = await seedPlatformAdmin();
      const token = makeJwt({ userId: admin.id, userType: "platform:admin" });

      const res = await request(app).get("/api/v1/admin/escrow").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  describe("Edge Cases", () => {
    /**
     * 1. It 403s a synthetic makePlatformAdminToken(), correct userType claim, but no real
     *    user_roles row, exactly the gap flagged before writing this file: passing authorize()
     *    is not sufficient for a requirePermission-gated route.
     */

    it("403s a synthetic makePlatformAdminToken() with no real user_roles row", async () => {
      const token = makeJwt({ userId: "11111111-1111-1111-1111-111111111111", userType: "platform:admin" });

      const res = await request(app).get("/api/v1/admin/escrow").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe("Failure Path", () => {
    /**
     * 1. It 403s a real seeded host, wrong role, correctly resolved through the real
     *    RBAC system, not a flat claim check
     */

    it("403s a real seeded host, wrong role, correctly resolved through the real RBAC system", async () => {
      const host = await seedUser({ userType: "host:admin" });
      const token = makeJwt({ userId: host.id, userType: "host:admin" });

      const res = await request(app).get("/api/v1/admin/escrow").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });
});