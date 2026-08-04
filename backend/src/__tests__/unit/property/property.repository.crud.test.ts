import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { makeProperty, PROPERTY_ID, TENANT_ID } from "../../setup/fixtures";

jest.mock("@booking/shared", () => ({ query: jest.fn(), queryOne: jest.fn() }));

import { query, queryOne } from "@booking/shared";
import { propertyRepository } from "../../../domains/property/property.repository";

const mockQuery    = query    as jest.MockedFunction<typeof query>;
const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>;

describe("propertyRepository CRUD", () => {
  beforeEach(() => {jest.clearAllMocks()});

  describe("findPropertyById", () => {
    it("scopes to tenantId when provided", async () => {
      mockQueryOne.mockResolvedValue(makeProperty() as never);

      await propertyRepository.findPropertyById(PROPERTY_ID, TENANT_ID);

      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.stringContaining("AND tenant_id"),
        [PROPERTY_ID, TENANT_ID],
      );
    });

    it("omits the tenant filter when tenantId is not provided", async () => {
      mockQueryOne.mockResolvedValue(makeProperty() as never);

      await propertyRepository.findPropertyById(PROPERTY_ID);

      expect(mockQueryOne).toHaveBeenCalledWith(expect.any(String), [PROPERTY_ID]);
    });

    it("returns null when nothing matches", async () => {
      mockQueryOne.mockResolvedValue(null);

      const result = await propertyRepository.findPropertyById("missing-id", TENANT_ID);

      expect(result).toBeNull();
    });
  });

  describe("updateProperty", () => {
    it("builds SET clauses only for provided fields", async () => {
      mockQueryOne.mockResolvedValue(makeProperty({ name: "New Name" }) as never);

      await propertyRepository.updateProperty(PROPERTY_ID, TENANT_ID, { name: "New Name" });

      const [sql, params] = mockQueryOne.mock.calls[0] as [string, unknown[]];
      expect(sql).toContain("name = $1");
      expect(sql).not.toContain("status = $");
      expect(params).toContain("New Name");
    });

    it("returns null when the property doesn't belong to the tenant", async () => {
      mockQueryOne.mockResolvedValue(null);

      const result = await propertyRepository.updateProperty(PROPERTY_ID, "wrong-tenant", { name: "X" });

      expect(result).toBeNull();
    });
  });

  describe("deleteProperty", () => {
    it("scopes the delete to id and tenantId together", async () => {
      mockQuery.mockResolvedValue([] as never);

      await propertyRepository.deleteProperty(PROPERTY_ID, TENANT_ID);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM properties"),
        [PROPERTY_ID, TENANT_ID],
      );
    });
  });
});