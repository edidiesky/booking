import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { makeTenant, TENANT_ID } from "../../setup/fixtures";

jest.mock("@booking/shared", () => ({ query: jest.fn(), queryOne: jest.fn() }));

import { query, queryOne } from "@booking/shared";
import { tenantRepository } from "../../../domains/tenant/tenant.repository";

const mockQuery    = query    as jest.MockedFunction<typeof query>;
const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>;

describe("tenantRepository", () => {
  beforeEach(() => {jest.clearAllMocks()});

  describe("findBySlug", () => {
    it("looks up by slug, not id", async () => {
      mockQueryOne.mockResolvedValue(makeTenant() as never);

      await tenantRepository.findBySlug("grand-hotel");

      expect(mockQueryOne).toHaveBeenCalledWith(expect.stringContaining("WHERE slug"), ["grand-hotel"]);
    });
  });

  describe("updateStatus", () => {
    it("passes the target status through as a plain param", async () => {
      mockQueryOne.mockResolvedValue(makeTenant({ status: "suspended" }) as never);

      const result = await tenantRepository.updateStatus(TENANT_ID, "suspended");

      expect(result?.status).toBe("suspended");
      expect(mockQueryOne).toHaveBeenCalledWith(expect.any(String), [TENANT_ID, "suspended"]);
    });

    it("returns null for an id that doesn't exist", async () => {
      mockQueryOne.mockResolvedValue(null);

      const result = await tenantRepository.updateStatus("missing-id", "active");

      expect(result).toBeNull();
    });
  });

  describe("listAll", () => {
    it("applies page/limit as offset/limit params", async () => {
      mockQuery.mockResolvedValue([makeTenant()] as never);

      await tenantRepository.listAll(2, 10);

      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [10, 10]); // limit=10, offset=(page-1)*limit=10
    });

    it("defaults to page 1, limit 20 when called with no args", async () => {
      mockQuery.mockResolvedValue([] as never);

      await tenantRepository.listAll();

      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [20, 0]);
    });
  });

  describe("slugExists", () => {
    it("returns true when a row is found", async () => {
      mockQueryOne.mockResolvedValue({ id: TENANT_ID } as never);
      expect(await tenantRepository.slugExists("grand-hotel")).toBe(true);
    });

    it("returns false when nothing matches", async () => {
      mockQueryOne.mockResolvedValue(null);
      expect(await tenantRepository.slugExists("nonexistent")).toBe(false);
    });
  });
});