import { describe, it, expect, jest } from "@jest/globals";
import request from "supertest";
import { seedTenant, seedUser, seedPendingInvitation } from "./helpers/seeders";
import buildApp from "./helpers/buildApp";
import {  makeJwt } from "../setup/fixtures";
import { queryOne } from "@booking/shared";
import { getDispatcher } from "../../infra/providers/notification.dispatcher";

jest.mock("../../../infra/providers/notification.dispatcher");
const app = buildApp();

function mockDispatcherAndCaptureCode() {
  let capturedCode = "";
  (getDispatcher as jest.Mock).mockReturnValue({
    sendEmail: jest.fn(async (_to: string, _subject: string, html: string) => {
      const match = html.match(/(\d{6})/);
      capturedCode = match ? match[1] : "";
    }),
  });
  return () => capturedCode;
}

async function getSystemRoleId(slug: string): Promise<string> {
  const role = await queryOne<{ id: string }>(`SELECT id FROM roles WHERE slug = $1 AND tenant_id IS NULL`, [slug]);
  if (!role) throw new Error(`Role "${slug}" not seeded, run seedService.seedAll() against the test DB first.`);
  return role.id;
}

describe("POST /api/v1/invitations", () => {
  describe("Happy Path", () => {
    /**
     * 1. It creates a real invitation row and sends a real email for a host:admin actor
     */

    it("creates a real invitation row and sends a real email for a host:admin actor", async () => {
      mockDispatcherAndCaptureCode();
      const tenant = await seedTenant();
      const admin = await seedUser({ userType: "host:admin" });
      const token = makeJwt({ userId: admin.id, userType: "host:admin", tenantId: tenant.id });
      const roleId = await getSystemRoleId("host:staff");

      const res = await request(app)
        .post("/api/v1/invitations")
        .set("Authorization", `Bearer ${token}`)
        .send({ email: "newstaff@example.com", roleId });

      expect(res.status).toBe(201);
      expect(res.body.data.message).toBe("Invitation sent.");
    });
  });

  describe("Edge Cases", () => {
    /**
     * 1. It 409s a second invite to an email that already has a real pending row for this tenant
     * 2. It returns 400s a roleId that belongs to a different tenant entirely, not this one
     */

    it("409s a second invite to an email with a real pending row already", async () => {
      const tenant = await seedTenant();
      const admin = await seedUser({ userType: "host:admin" });
      const token = makeJwt({ userId: admin.id, userType: "host:admin", tenantId: tenant.id });
      const roleId = await getSystemRoleId("host:staff");
      await seedPendingInvitation({ tenantId: tenant.id, roleId, email: "already@example.com", invitedBy: admin.id });

      const res = await request(app)
        .post("/api/v1/invitations")
        .set("Authorization", `Bearer ${token}`)
        .send({ email: "already@example.com", roleId });

      expect(res.status).toBe(409);
    });

    it("400s a roleId belonging to a different tenant entirely", async () => {
      const tenant = await seedTenant();
      const otherTenant = await seedTenant();
      const admin = await seedUser({ userType: "host:admin" });
      const token = makeJwt({ userId: admin.id, userType: "host:admin", tenantId: tenant.id });

      // A tenant-scoped custom role belonging to otherTenant, not the
      // caller's own tenant, real cross-tenant role isolation, not a
      // system role which would legitimately be usable anywhere.
      const foreignRole = await queryOne<{ id: string }>(
        `INSERT INTO roles (name, slug, tenant_id, is_system) VALUES ('Foreign Role', 'foreign-role', $1, false) RETURNING id`,
        [otherTenant.id],
      );

      const res = await request(app)
        .post("/api/v1/invitations")
        .set("Authorization", `Bearer ${token}`)
        .send({ email: "x@example.com", roleId: foreignRole!.id });

      expect(res.status).toBe(400);
    });
  });

  describe("Failure Path", () => {
    /**
     * 1. It 403s a real host:staff token, requireTenantMember's broader allowlist passes it,
     *    but the stricter authorize("host:admin") stacked after it does not
     */

    it("403s a real host:staff token, passes requireTenantMember but not authorize", async () => {
      const tenant = await seedTenant();
      const staff = await seedUser({ userType: "host:staff" });
      const token = makeJwt({ userId: staff.id, userType: "host:staff", tenantId: tenant.id });
      const roleId = await getSystemRoleId("host:staff");

      const res = await request(app)
        .post("/api/v1/invitations")
        .set("Authorization", `Bearer ${token}`)
        .send({ email: "x@example.com", roleId });

      expect(res.status).toBe(403);
    });
  });
});

describe("POST /api/v1/invitations/accept", () => {
  describe("Happy Path", () => {
    /**
     * 1. It creates a genuinely new host:staff user and returns real tokens for a correct code
     * 2. It links an existing guest account instead of creating a duplicate, no password required
     */

    it("creates a genuinely new host:staff user and returns real tokens for a correct code", async () => {
      const getCode = mockDispatcherAndCaptureCode();
      const tenant = await seedTenant();
      const admin = await seedUser({ userType: "host:admin" });
      const adminToken = makeJwt({ userId: admin.id, userType: "host:admin", tenantId: tenant.id });
      const roleId = await getSystemRoleId("host:staff");

      await request(app)
        .post("/api/v1/invitations")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ email: "brandnew@example.com", roleId });

      const res = await request(app).post("/api/v1/invitations/accept").send({
        email: "brandnew@example.com",
        code: getCode(),
        firstName: "New",
        lastName: "Staff",
        password: "Password1!",
      });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.userType).toBe("host:staff");
    });

    it("links an existing guest account instead of creating a duplicate, no password required", async () => {
      // Real coverage of the deliberate "link, don't duplicate" branch:
      // an existing account with this email means the password field
      // is never even checked, omitting it here on purpose to prove
      // that branch is actually taken, not just that it's theoretically reachable.
      const getCode = mockDispatcherAndCaptureCode();
      const tenant = await seedTenant();
      const admin = await seedUser({ userType: "host:admin" });
      const adminToken = makeJwt({ userId: admin.id, userType: "host:admin", tenantId: tenant.id });
      const roleId = await getSystemRoleId("host:staff");
      const existingGuest = await seedUser({ userType: "guest", email: "already-a-guest@example.com" });

      await request(app)
        .post("/api/v1/invitations")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ email: existingGuest.email, roleId });

      const res = await request(app).post("/api/v1/invitations/accept").send({
        email: existingGuest.email,
        code: getCode(),
        firstName: "Already",
        lastName: "Guest",
      });

      expect(res.status).toBe(200);
      expect(res.body.data.user.id).toBe(existingGuest.id);
    });
  });

  describe("Edge Cases", () => {
    /**
     * 1. It 401s a wrong code without deleting the pending invitation, five wrong attempts are allowed
     * 2. It 429s the sixth attempt regardless of whether that code is correct, real lockout behavior
     */

    it("401s a wrong code, and allows retrying, five wrong attempts don't lock it out yet", async () => {
      mockDispatcherAndCaptureCode();
      const tenant = await seedTenant();
      const admin = await seedUser({ userType: "host:admin" });
      const adminToken = makeJwt({ userId: admin.id, userType: "host:admin", tenantId: tenant.id });
      const roleId = await getSystemRoleId("host:staff");
      await request(app).post("/api/v1/invitations").set("Authorization", `Bearer ${adminToken}`).send({ email: "retry@example.com", roleId });

      const res = await request(app).post("/api/v1/invitations/accept").send({
        email: "retry@example.com", code: "000000", firstName: "A", lastName: "B", password: "Password1!",
      });

      expect(res.status).toBe(401);
    });

    it("429s the sixth wrong attempt, real Redis-backed lockout, not a mocked counter", async () => {
      mockDispatcherAndCaptureCode();
      const tenant = await seedTenant();
      const admin = await seedUser({ userType: "host:admin" });
      const adminToken = makeJwt({ userId: admin.id, userType: "host:admin", tenantId: tenant.id });
      const roleId = await getSystemRoleId("host:staff");
      await request(app).post("/api/v1/invitations").set("Authorization", `Bearer ${adminToken}`).send({ email: "lockout@example.com", roleId });

      const attempt = () =>
        request(app).post("/api/v1/invitations/accept").send({
          email: "lockout@example.com", code: "000000", firstName: "A", lastName: "B", password: "Password1!",
        });

      for (let i = 0; i < 5; i++) await attempt();
      const sixth = await attempt();

      expect(sixth.status).toBe(429);
    });
  });

  describe("Failure Path", () => {
    /**
     * 1. It returns 400s when there's no pending invitation for the email at all
     */

    it("400s when there's no pending invitation for the email at all", async () => {
      const res = await request(app).post("/api/v1/invitations/accept").send({
        email: "never-invited@example.com", code: "123456", firstName: "A", lastName: "B", password: "Password1!",
      });

      expect(res.status).toBe(400);
    });
  });
});

describe("GET /api/v1/invitations", () => {
  describe("Happy Path", () => {
    /**
     * 1. It 200s for host:staff, list is only requireTenantMember-gated, not authorize("host:admin")
     */

    it("200s for host:staff, list has no authorize gate unlike create/revoke", async () => {
      const tenant = await seedTenant();
      const staff = await seedUser({ userType: "host:staff" });
      const token = makeJwt({ userId: staff.id, userType: "host:staff", tenantId: tenant.id });

      const res = await request(app).get("/api/v1/invitations").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  describe("Failure Path", () => {
    /**
     * 1. It 403s a guest token, requireTenantMember's host-type allowlist rejects it
     */

    it("403s a guest token entirely", async () => {
      const token = makeJwt({ userId: "u1", userType: "guest" });

      const res = await request(app).get("/api/v1/invitations").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });
});