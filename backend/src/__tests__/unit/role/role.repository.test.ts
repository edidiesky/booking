import { describe, it, expect, jest, beforeEach } from "@jest/globals";

jest.mock("@booking/shared", () => ({ query: jest.fn(), queryOne: jest.fn() }));
jest.mock("../../utils/metrics", () => ({ trackError: jest.fn() }));
jest.mock("../../context/requestContext", () => ({ requestContext: { get: jest.fn(() => undefined) } }));
jest.mock("../../utils/logger", () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn() },
}));

import { query, queryOne } from "@booking/shared";
import { trackError } from "../../../utils/metrics";
import { roleRepository } from "../../../domains/role/role.repository";

const mockQuery      = query      as jest.MockedFunction<typeof query>;
const mockQueryOne   = queryOne   as jest.MockedFunction<typeof queryOne>;
const mockTrackError = trackError as jest.MockedFunction<typeof trackError>;

describe("roleRepository", () => {
  beforeEach(() => {jest.clearAllMocks()});

  describe("findAllForTenant", () => {
    it("includes both system roles (tenant_id IS NULL) and this tenant's own, real RLS-adjacent logic worth pinning", async () => {
      mockQuery.mockResolvedValue([] as never);

      await roleRepository.findAllForTenant("tenant-1");

      const [sql, params] = mockQuery.mock.calls[0] as [string, unknown[]];
      expect(sql).toContain("tenant_id IS NULL OR tenant_id = $1");
      expect(params).toEqual(["tenant-1"]);
    });
  });

  describe("findAllSystem", () => {
    it("never includes a tenant_id filter param, platform-wide only", async () => {
      mockQuery.mockResolvedValue([] as never);

      await roleRepository.findAllSystem();

      const [, params] = mockQuery.mock.calls[0] as [string, unknown[] | undefined];
      expect(params).toBeUndefined();
    });
  });

  describe("seed", () => {
    it("upserts each role individually, scoped to system roles only (tenant_id IS NULL in the conflict target)", async () => {
      mockQuery.mockResolvedValue([] as never);

      await roleRepository.seed([
        { name: "Admin", slug: "admin", description: "Full access", is_system: true },
        { name: "Staff", slug: "staff", description: "Limited access", is_system: true },
      ] as never);

      expect(mockQuery).toHaveBeenCalledTimes(2);
      const [sql] = mockQuery.mock.calls[0] as [string, unknown[]];
      expect(sql).toContain("ON CONFLICT (slug) WHERE tenant_id IS NULL");
    });
  });

  describe("create", () => {
    it("defaults is_system to false for a tenant-created custom role", async () => {
      mockQueryOne.mockResolvedValue({ id: "role-1", is_system: false } as never);

      await roleRepository.create({ name: "Custodian", slug: "custodian", description: "x", tenant_id: "tenant-1" });

      const [, params] = mockQueryOne.mock.calls[0] as [string, unknown[]];
      expect(params).toEqual(["Custodian", "custodian", "x", false, "tenant-1"]);
    });

    it("tracks the failure and rethrows on a duplicate slug", async () => {
      mockQueryOne.mockRejectedValue(new Error("duplicate key value violates unique constraint"));

      await expect(
        roleRepository.create({ name: "X", slug: "dupe", description: "x", tenant_id: "tenant-1" }),
      ).rejects.toThrow(/duplicate key/);

      expect(mockTrackError).toHaveBeenCalledWith("role_create_failed", "role_repository", "medium");
    });
  });
});