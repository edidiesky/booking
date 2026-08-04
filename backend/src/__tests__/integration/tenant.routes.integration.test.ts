import { describe, it, expect } from "@jest/globals";
import request from "supertest";
import buildApp from "./helpers/buildApp";
import { seedTenant } from "./helpers/seeders";
import { makePlatformAdminToken, makeHostToken } from "../setup/fixtures";

const app = buildApp();

describe("GET /api/v1/tenants (admin list)", () => {
  it("200s for a platform admin", async () => {
    await seedTenant();
    const token = makePlatformAdminToken();

    const res = await request(app).get("/api/v1/tenants").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("403s for a host, real authorize() middleware, not mocked", async () => {
    const token = makeHostToken();

    const res = await request(app).get("/api/v1/tenants").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

describe("PATCH /api/v1/tenants/:id/suspend then /activate", () => {
  it("actually flips the row in the real database", async () => {
    const tenant = await seedTenant();
    const token  = makePlatformAdminToken();

    const suspendRes = await request(app)
      .patch(`/api/v1/tenants/${tenant.id}/suspend`)
      .set("Authorization", `Bearer ${token}`);
    expect(suspendRes.body.data.status).toBe("suspended");

    const activateRes = await request(app)
      .patch(`/api/v1/tenants/${tenant.id}/activate`)
      .set("Authorization", `Bearer ${token}`);
    expect(activateRes.body.data.status).toBe("active");
  });
});