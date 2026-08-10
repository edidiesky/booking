import { describe, it, expect } from "@jest/globals";
import request from "supertest";
import { seedUser } from "./helpers/seeders";
import buildApp from "./helpers/buildApp";
import { makeJwt } from "../setup/fixtures";

const app = buildApp();

describe("GET /api/v1/permissions", () => {
  describe("Happy Path", () => {
    /**
     * 1. It 200s for host:admin
     * 2. It 200s for host:inspector too, the three-way authorize list, not admin-only like create/remove
     */

    it("200s for host:admin", async () => {
      const admin = await seedUser({ userType: "host:admin" });
      const token = makeJwt({ userId: admin.id, userType: "host:admin" });

      const res = await request(app).get("/api/v1/permissions").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it("200s for host:inspector, genuinely allowed to view, not just host:admin", async () => {
      const inspector = await seedUser({ userType: "host:inspector" });
      const token = makeJwt({ userId: inspector.id, userType: "host:inspector" });

      const res = await request(app).get("/api/v1/permissions").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  describe("Failure Path", () => {
    /**
     * 1. It 403s host:staff, confirmed absent from this route's three-way allowlist
     */

    it("403s host:staff, not in the three-way allowlist", async () => {
      const staff = await seedUser({ userType: "host:staff" });
      const token = makeJwt({ userId: staff.id, userType: "host:staff" });

      const res = await request(app).get("/api/v1/permissions").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });
});

describe("POST /api/v1/permissions/role/add", () => {
  describe("Failure Path", () => {
    /**
     * 1. It 403s a real host:admin token, this mutation is platform:admin only,
     *    a stricter gate than the GET routes above, host:admin can view but not modify
     */

    it("403s a real host:admin token, view access doesn't imply modify access here", async () => {
      const admin = await seedUser({ userType: "host:admin" });
      const token = makeJwt({ userId: admin.id, userType: "host:admin" });

      const res = await request(app)
        .post("/api/v1/permissions/role/add")
        .set("Authorization", `Bearer ${token}`)
        .send({ roleId: "00000000-0000-0000-0000-000000000000", permissionId: "00000000-0000-0000-0000-000000000000" });

      expect(res.status).toBe(403);
    });
  });
});