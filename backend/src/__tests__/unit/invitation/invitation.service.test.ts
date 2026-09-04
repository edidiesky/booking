import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import bcrypt from "bcryptjs";
import { invitationService } from "../../../domains/invitation/invitation.service";
import { invitationRepository } from "../../../domains/invitation/invitation.repository";
import { roleRepository } from "../../../domains/role/role.repository";
import { tenantRepository } from "../../../domains/tenant/tenant.repository";
import { expectAppError } from "../../helpers/expectAppError";

jest.mock("bcryptjs");
jest.mock("crypto", () => ({ randomInt: jest.fn(() => 123456) }));
jest.mock("uuid", () => ({ v4: jest.fn(() => "notif-1") }));

jest.mock("../../../config/redis", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn().mockResolvedValue("OK" as never),
    del: jest.fn().mockResolvedValue(1 as never),
  },
}));
import redisClient from "../../../config/redis";
const redis = redisClient as unknown as {
  get: jest.Mock;
  set: jest.Mock;
  del: jest.Mock;
};

jest.mock("../../../domains/invitation/invitation.repository", () => ({
  invitationRepository: {
    findPendingByTenantAndEmail: jest.fn(),
    create: jest.fn().mockResolvedValue(undefined as never),
  },
}));
jest.mock("../../../domains/role/role.repository", () => ({
  roleRepository: { findById: jest.fn() },
}));
jest.mock("../../../domains/tenant/tenant.repository", () => ({
  tenantRepository: { findById: jest.fn() },
}));
jest.mock("../../../domains/auth/auth.repository", () => ({
  userRepository: { findByEmail: jest.fn(), create: jest.fn() },
}));
jest.mock("../../../domains/profile/profile.repository", () => ({
  profileRepository: {
    create: jest.fn().mockResolvedValue(undefined as never),
  },
}));
jest.mock("../../../domains/user-role/user-role.repository", () => ({
  userRoleRepository: {
    assign: jest.fn().mockResolvedValue(undefined as never),
  },
}));
jest.mock("../../../domains/auth/auth.service", () => ({
  authService: {},
}));
jest.mock("../../../domains/audit/audit.repository", () => ({
  auditRepository: {
    log: jest.fn().mockResolvedValue(undefined as never),
  },
}));
jest.mock("../../../domains/audit/auditEvent.repository", () => ({
  auditEventRepository: {
    record: jest.fn().mockResolvedValue(undefined as never),
  },
}));
jest.mock("@booking/shared", () => ({
  withTransaction: jest.fn(async (fn: (c: object) => Promise<unknown>) =>
    fn({}),
  ),
  AppError: {
    badRequest: (m: string) => Object.assign(new Error(m), { statusCode: 400 }),
    notFound: (m: string) => Object.assign(new Error(m), { statusCode: 404 }),
    conflict: (m: string) => Object.assign(new Error(m), { statusCode: 409 }),
  },
}));
jest.mock("../../../messaging/publisher", () => ({
  publishNotifyInvitation: jest.fn(),
}));
jest.mock("../../../utils/logger", () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));
jest.mock("../../../context/requestContext", () => ({
  requestContext: { get: jest.fn().mockReturnValue({ requestId: "req-1" }) },
}));

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedInviteRepo = invitationRepository as jest.Mocked<
  typeof invitationRepository
>;
const mockedRoleRepo = roleRepository as jest.Mocked<typeof roleRepository>;
const mockedTenantRepo = tenantRepository as jest.Mocked<
  typeof tenantRepository
>;

describe("invitationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedBcrypt.hash.mockResolvedValue("$2b$10$hash" as never);
  });

  describe("create", () => {
    const tenantId = "tenant-1";
    const invitedBy = "host-1";

    it("rejects missing email", async () => {
      await expectAppError(
        invitationService.create(tenantId, invitedBy, { roleId: "role-1" }),
        400,
        /email/i,
      );
    });

    it("rejects missing roleId", async () => {
      await expectAppError(
        invitationService.create(tenantId, invitedBy, {
          email: "staff@test.com",
        }),
        400,
        /role/i,
      );
    });

    it("rejects invalid role for tenant", async () => {
      mockedRoleRepo.findById.mockResolvedValue({
        id: "role-1",
        name: "Staff",
        tenant_id: "other",
        slug: "host:staff",
      } as never);
      await expectAppError(
        invitationService.create(tenantId, invitedBy, {
          email: "staff@test.com",
          roleId: "role-1",
        }),
        400,
        /Invalid role/i,
      );
    });

    it("rejects missing tenant", async () => {
      mockedRoleRepo.findById.mockResolvedValue({
        id: "role-1",
        name: "Staff",
        tenant_id: null,
        slug: "host:staff",
      } as never);
      mockedTenantRepo.findById.mockResolvedValue(null as never);
      await expectAppError(
        invitationService.create(tenantId, invitedBy, {
          email: "staff@test.com",
          roleId: "role-1",
        }),
        404,
      );
    });

    it("rejects pending Redis invite", async () => {
      mockedRoleRepo.findById.mockResolvedValue({
        id: "role-1",
        name: "Staff",
        tenant_id: null,
        slug: "host:staff",
      } as never);
      mockedTenantRepo.findById.mockResolvedValue({
        id: tenantId,
        name: "Hotel",
        status: "active",
      } as never);
      redis.get.mockResolvedValue("{}" as never);
      await expectAppError(
        invitationService.create(tenantId, invitedBy, {
          email: "staff@test.com",
          roleId: "role-1",
        }),
        409,
        /already pending/i,
      );
    });

    it("creates invitation on success", async () => {
      mockedRoleRepo.findById.mockResolvedValue({
        id: "role-1",
        name: "Staff",
        tenant_id: null,
        slug: "host:staff",
      } as never);
      mockedTenantRepo.findById.mockResolvedValue({
        id: tenantId,
        name: "Hotel",
        status: "active",
      } as never);
      redis.get.mockResolvedValue(null as never);
      mockedInviteRepo.findPendingByTenantAndEmail.mockResolvedValue(
        null as never,
      );
      const result = await invitationService.create(tenantId, invitedBy, {
        email: "Staff@Test.com",
        roleId: "role-1",
      });
      expect(result.message).toMatch(/Invitation sent/i);
      expect(redis.set).toHaveBeenCalled();
      expect(mockedInviteRepo.create).toHaveBeenCalled();
    });
  });

  describe("accept", () => {
    it("rejects missing email/code", async () => {
      await expectAppError(
        invitationService.accept({ firstName: "A", lastName: "B" }),
        400,
        /Email and invitation code/i,
      );
    });

    it("rejects expired Redis state", async () => {
      redis.get.mockResolvedValue(null as never);
      await expectAppError(
        invitationService.accept({
          email: "staff@test.com",
          code: "123456",
          firstName: "Sam",
          lastName: "Staff",
          password: "Password1!",
        }),
        400,
      );
    });
  });
});
