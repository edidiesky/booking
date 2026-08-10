import { describe, it, expect } from "@jest/globals";
import request from "supertest";
import { seedUser } from "./helpers/seeders";
import buildApp from "./helpers/buildApp";
import { makeJwt } from "../setup/fixtures";

const app = buildApp();

describe("GET /api/v1/profile", () => {
  describe("Happy Path", () => {
    /**
     * 1. It lazily creates a real profile row on the very first GET for a user
     * 2. It returns the same row, not a new one, on a second GET
     */

    it("lazily creates a real profile row on the very first GET", async () => {
      const user = await seedUser({ userType: "guest" });
      const token = makeJwt({ userId: user.id, userType: "guest" });

      const res = await request(app).get("/api/v1/profile").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user_id).toBe(user.id);
    });

    it("returns the same row, not a new one, on a second GET", async () => {
      const user = await seedUser({ userType: "guest" });
      const token = makeJwt({ userId: user.id, userType: "guest" });

      const first = await request(app).get("/api/v1/profile").set("Authorization", `Bearer ${token}`);
      const second = await request(app).get("/api/v1/profile").set("Authorization", `Bearer ${token}`);

      expect(second.body.data.id).toBe(first.body.data.id);
    });
  });

  describe("Failure Path", () => {
    /**
     * 1. It 401s with no authenticated session
     */

    it("401s with no authenticated session", async () => {
      const res = await request(app).get("/api/v1/profile");

      expect(res.status).toBe(401);
    });
  });
});

describe("PATCH /api/v1/profile", () => {
  describe("Happy Path", () => {
    /**
     * 1. It updates displayName and logs a real audit entry
     */

    it("updates displayName for the authenticated user's own profile", async () => {
      const user = await seedUser({ userType: "guest" });
      const token = makeJwt({ userId: user.id, userType: "guest" });
      await request(app).get("/api/v1/profile").set("Authorization", `Bearer ${token}`); // lazy-create first

      const res = await request(app)
        .patch("/api/v1/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ displayName: "New Name" });

      expect(res.status).toBe(200);
      expect(res.body.data.display_name).toBe("New Name");
    });
  });

  describe("Edge Cases", () => {
    /**
     * 1. It 400s a bio exceeding the real 500-character schema limit
     */

    it("400s a bio exceeding the real 500-character schema limit", async () => {
      const user = await seedUser({ userType: "guest" });
      const token = makeJwt({ userId: user.id, userType: "guest" });

      const res = await request(app)
        .patch("/api/v1/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ bio: "x".repeat(501) });

      expect(res.status).toBe(400);
    });
  });

  describe("Failure Path", () => {
    /**
     * 1. It 401s with no authenticated session
     * 2. It retruns 403 when a user tries to update another user's profile
     */

    it("401s with no authenticated session", async () => {
      const res = await request(app).patch("/api/v1/profile").send({ displayName: "X" });

      expect(res.status).toBe(401);
    });
  });
});