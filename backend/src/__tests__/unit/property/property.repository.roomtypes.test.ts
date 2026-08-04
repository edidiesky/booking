import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { makeRoomType, PROPERTY_ID, TENANT_ID, ROOM_TYPE_ID } from "../../setup/fixtures";

jest.mock("@booking/shared", () => ({ query: jest.fn(), queryOne: jest.fn(), withTransaction: jest.fn() }));

import { queryOne } from "@booking/shared";
import { propertyRepository } from "../../../domains/property/property.repository";

const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>;

describe("propertyRepository room types", () => {
  beforeEach(() => {jest.clearAllMocks()});

  describe("findRoomTypeById", () => {
    it("returns the matching room type", async () => {
      const roomType = makeRoomType();
      mockQueryOne.mockResolvedValue(roomType as never);

      const result = await propertyRepository.findRoomTypeById(ROOM_TYPE_ID, TENANT_ID);

      expect(result).toEqual(roomType);
    });

    it("returns null for a room type belonging to a different tenant", async () => {
      mockQueryOne.mockResolvedValue(null);

      const result = await propertyRepository.findRoomTypeById(ROOM_TYPE_ID, "other-tenant");

      expect(result).toBeNull();
    });
  });

  describe("createRoomType", () => {
    it("inserts scoped to the given propertyId and tenantId", async () => {
      mockQueryOne.mockResolvedValue(makeRoomType() as never);

      await propertyRepository.createRoomType({
        propertyId: PROPERTY_ID, tenantId: TENANT_ID,
        name: "Standard", maxOccupancy: 2, basePriceNgn: 30000, quantity: 3,
      });

      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO room_types"),
        expect.arrayContaining([PROPERTY_ID, TENANT_ID]),
      );
    });
  });

  describe("updateRoomType", () => {
    it("only sets provided fields, leaves the rest untouched", async () => {
      mockQueryOne.mockResolvedValue(makeRoomType({ base_price_ngn: 60000 }) as never);

      await propertyRepository.updateRoomType(ROOM_TYPE_ID, TENANT_ID, { basePriceNgn: 60000 });

      const [sql] = mockQueryOne.mock.calls[0] as [string, unknown[]];
      expect(sql).toContain("base_price_ngn = $");
      expect(sql).not.toContain("name = $");
    });

    it("returns the unchanged row when no fields are provided (falls through to findRoomTypeById)", async () => {
      const roomType = makeRoomType();
      mockQueryOne.mockResolvedValue(roomType as never);

      const result = await propertyRepository.updateRoomType(ROOM_TYPE_ID, TENANT_ID, {});

      expect(result).toEqual(roomType);
    });
  });
});