import { describe, it, expect } from "@jest/globals";
import request from "supertest";
import { seedUser } from "./helpers/seeders";
import buildApp from "./helpers/buildApp";
import { makeGuestToken } from "../setup/fixtures";

const app = buildApp();
const SEED_PASSWORD = "TestPass123!";


describe("POST /api/v1/auth/register/guest", () => {
  describe("Happy Path", () => {
    /**
     * 1. It creates a real user row and returns tokens for a genuinely new email
     */

    it("creates a real user row and returns tokens for a genuinely new email", async () => {
      const email = `new-${Date.now()}@example.com`;

      const res = await request(app).post("/api/v1/auth/register/guest").send({
        email,
        password: "Password1!",
        firstName: "Jane",
        lastName: "Doe",
      });

      expect(res.status).toBe(201);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe(email);
    });
  });

  describe("Edge Cases", () => {
    /**
     * 1. It 400s on a malformed email, against real validation, not a mock
     * 2. It 400s when the password field is missing entirely
     */

    it("400s on a malformed email, against real validation, not a mock", async () => {
      const res = await request(app).post("/api/v1/auth/register/guest").send({
        email: "not-an-email",
        password: "Password1!",
        firstName: "Jane",
        lastName: "Doe",
      });

      expect(res.status).toBe(400);
    });

    it("400s when the password field is missing entirely", async () => {
      const res = await request(app).post("/api/v1/auth/register/guest").send({
        email: "missing-pw@example.com",
        firstName: "Jane",
        lastName: "Doe",
      });

      expect(res.status).toBe(400);
    });
  });

  describe("Failure Path", () => {
    /**
     * 1. It 409s against real duplicate-email detection, seeding the same email first
     */

    it("409s against real duplicate-email detection, seeding the same email first", async () => {
      const existing = await seedUser();

      const res = await request(app).post("/api/v1/auth/register/guest").send({
        email: existing.email,
        password: "Password1!",
        firstName: "Jane",
        lastName: "Doe",
      });

      expect(res.status).toBe(409);
    });
  });
});

describe("POST /api/v1/auth/login", () => {
  describe("Happy Path", () => {
    /**
     * 1. It returns real tokens for a seeded user's correct email/password
     */

    it("returns real tokens for a seeded user's correct email/password", async () => {
      const user = await seedUser();

      const res = await request(app).post("/api/v1/auth/login").send({
        email: user.email,
        password: SEED_PASSWORD,
      });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.id).toBe(user.id);
    });
  });

  describe("Edge Cases", () => {
    /**
     * 1. It 401s against real bcrypt comparison when the password is wrong, not just a mock rejection
     */

    it("401s against real bcrypt comparison when the password is wrong, not just a mock rejection", async () => {
      const user = await seedUser();

      const res = await request(app).post("/api/v1/auth/login").send({
        email: user.email,
        password: "TotallyWrongPassword1!",
      });

      expect(res.status).toBe(401);
    });
  });

  describe("Failure Path", () => {
    /**
     * 1. It 401s for an email with no matching row at all, not a validation-layer rejection
     */

    it("401s for an email with no matching row at all, not a validation-layer rejection", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "nobody-registered-this@example.com",
        password: "AnyPassword1!",
      });

      expect(res.status).toBe(401);
    });
  });
});

describe("GET /api/v1/auth/me", () => {
  describe("Happy Path", () => {
    /**
     * 1. It returns the token's real claims for a valid guest token
     */

    it("returns the token's real claims for a valid guest token", async () => {
      const token = makeGuestToken();

      const res = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.userType).toBe("guest");
    });
  });

  describe("Edge Cases", () => {
    /**
     * 1. It 401s against real JWT verification for a malformed, non-JWT bearer token
     */

    it("401s against real JWT verification for a malformed, non-JWT bearer token", async () => {
      const res = await request(app).get("/api/v1/auth/me").set("Authorization", "Bearer not-a-real-jwt");

      expect(res.status).toBe(401);
    });
  });

  describe("Failure Path", () => {
    /**
     * 1. It 401s with no Authorization header at all
     */

    it("401s with no Authorization header at all", async () => {
      const res = await request(app).get("/api/v1/auth/me");

      expect(res.status).toBe(401);
    });
  });
});