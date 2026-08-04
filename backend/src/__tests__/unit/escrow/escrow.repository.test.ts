import { describe, it, expect, jest, beforeEach } from "@jest/globals";

jest.mock("@booking/shared", () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
}));

import { query, queryOne } from "@booking/shared";
import { escrowRepository } from "../../../domains/escrow/escrow.repository";

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>;

function makeEscrowRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "escrow-1",
    booking_id: "booking-1",
    tenant_id: "tenant-1",
    amount_ngn: 50000,
    platform_fee_ngn: 5000,
    host_payout_ngn: 45000,
    status: "held",
    held_at: new Date(),
    created_at: new Date(),
    ...overrides,
  };
}

describe("escrowRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getStatsForTenant", () => {
    it("maps the aggregate row into the EscrowStats shape", async () => {
      mockQueryOne.mockResolvedValue({
        held_count: "3",
        held_amount: 150000,
        released_count: "1",
        released_amount: 45000,
        refunded_count: "0",
        refunded_amount: 0,
      } as never);

      const result = await escrowRepository.getStatsForTenant("tenant-1");

      expect(result.held.count).toBe(3);
      expect(result.held.amountNgn).toBe(150000);
    });
  });

  describe("listByTenant", () => {
    it("passes tenantId, page, and offset through to the query", async () => {
      mockQuery.mockResolvedValue([makeEscrowRow()] as never);

      await escrowRepository.listByTenant("tenant-1", 2, 10);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("FROM escrow_ledger"),
        expect.arrayContaining(["tenant-1"]),
      );
    });
  });
});
