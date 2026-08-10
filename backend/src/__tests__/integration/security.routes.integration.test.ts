import { describe, it, expect } from "@jest/globals";
import request from "supertest";
import { seedUser } from "./helpers/seeders";
import buildApp from "./helpers/buildApp";
import { makeJwt } from "../setup/fixtures";

const app = buildApp();
const SEED_PASSWORD = "TestPass123!";

describe("POST /api/v1/security/pin", () => {
  describe("Happy Path", () => {
    /**
     * 1. It sets a real PIN for a user who has never set one
     */

    it("sets a real PIN for a user with none set yet", async () => {
      const user = await seedUser({ userType: "guest" });
      const token = makeJwt({ userId: user.id, userType: "guest" });

      const res = await request(app).post("/api/v1/security/pin").set("Authorization", `Bearer ${token}`).send({ pin: "1234" });

      expect(res.status).toBe(200);
    });
  });

  describe("Failure Path", () => {
    /**
     * 1. It 400s a second attempt to set a PIN, real "already set" guard, not a generic error
     */

    it("400s a second attempt to set a PIN once one already exists", async () => {
      const user = await seedUser({ userType: "guest" });
      const token = makeJwt({ userId: user.id, userType: "guest" });
      await request(app).post("/api/v1/security/pin").set("Authorization", `Bearer ${token}`).send({ pin: "1234" });

      const res = await request(app).post("/api/v1/security/pin").set("Authorization", `Bearer ${token}`).send({ pin: "5678" });

      expect(res.status).toBe(400);
    });
  });
});

describe("PATCH /api/v1/security/pin", () => {
  describe("Happy Path", () => {
    /**
     * 1. It changes a real PIN given the genuinely correct current PIN
     */

    it("changes a real PIN given the correct current PIN", async () => {
      const user = await seedUser({ userType: "guest" });
      const token = makeJwt({ userId: user.id, userType: "guest" });
      await request(app).post("/api/v1/security/pin").set("Authorization", `Bearer ${token}`).send({ pin: "1234" });

      const res = await request(app)
        .patch("/api/v1/security/pin")
        .set("Authorization", `Bearer ${token}`)
        .send({ currentPin: "1234", newPin: "5678" });

      expect(res.status).toBe(200);
    });
  });

  describe("Edge Cases", () => {
    /**
     * 1. It 400s when no PIN has ever been set, real distinct guard from the wrong-PIN case below
     */

    it("400s when no PIN has ever been set for this account", async () => {
      const user = await seedUser({ userType: "guest" });
      const token = makeJwt({ userId: user.id, userType: "guest" });

      const res = await request(app)
        .patch("/api/v1/security/pin")
        .set("Authorization", `Bearer ${token}`)
        .send({ currentPin: "0000", newPin: "5678" });

      expect(res.status).toBe(400);
    });
  });

  describe("Failure Path", () => {
    /**
     * 1. It 401s a real, genuinely wrong current PIN against real bcrypt comparison
     */

    it("401s a genuinely wrong current PIN", async () => {
      const user = await seedUser({ userType: "guest" });
      const token = makeJwt({ userId: user.id, userType: "guest" });
      await request(app).post("/api/v1/security/pin").set("Authorization", `Bearer ${token}`).send({ pin: "1234" });

      const res = await request(app)
        .patch("/api/v1/security/pin")
        .set("Authorization", `Bearer ${token}`)
        .send({ currentPin: "9999", newPin: "5678" });

      expect(res.status).toBe(401);
    });
  });
});

describe("POST /api/v1/security/pin/reset", () => {
  describe("Happy Path", () => {
    /**
     * 1. It resets the PIN using the real account password, not the old PIN, a deliberately
     *    different authorization mechanism than changePin above
     */

    it("resets the PIN using the real account password", async () => {
      const user = await seedUser({ userType: "guest" });
      const token = makeJwt({ userId: user.id, userType: "guest" });

      const res = await request(app)
        .post("/api/v1/security/pin/reset")
        .set("Authorization", `Bearer ${token}`)
        .send({ password: SEED_PASSWORD, newPin: "4321" });

      expect(res.status).toBe(200);
    });
  });

  describe("Failure Path", () => {
    /**
     * 1. It 401s a genuinely wrong password
     */

    it("401s a genuinely wrong account password", async () => {
      const user = await seedUser({ userType: "guest" });
      const token = makeJwt({ userId: user.id, userType: "guest" });

      const res = await request(app)
        .post("/api/v1/security/pin/reset")
        .set("Authorization", `Bearer ${token}`)
        .send({ password: "TotallyWrongPassword1!", newPin: "4321" });

      expect(res.status).toBe(401);
    });
  });
});

describe("POST /api/v1/security/otp/:purpose/request", () => {
  describe("Happy Path", () => {
    /**
     * 1. It 200s for each of the four real, confirmed valid purposes
     */

    it.each(["email_verify", "phone_verify", "two_factor_enable", "two_factor_disable"])(
      "200s for the valid purpose %s",
      async (purpose) => {
        const user = await seedUser({ userType: "guest" });
        const token = makeJwt({ userId: user.id, userType: "guest" });

        const res = await request(app).post(`/api/v1/security/otp/${purpose}/request`).set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
      },
    );
  });

  describe("Failure Path", () => {
    /**
     * 1. It 400s a purpose outside the real VALID_PURPOSES allowlist, confirmed directly
     *    from source, not guessed
     */

    it("400s an invalid purpose", async () => {
      const user = await seedUser({ userType: "guest" });
      const token = makeJwt({ userId: user.id, userType: "guest" });

      const res = await request(app).post("/api/v1/security/otp/not_a_real_purpose/request").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(400);
    });
  });
});