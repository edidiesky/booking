import { describe, it, expect, jest, beforeEach } from "@jest/globals";

jest.mock("@booking/shared", () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
}));

import { query, queryOne } from "@booking/shared";
import { tenantRepository } from "../../../domains/tenant/tenant.repository";

const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>;

describe("tenantRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("findById returns tenant", async () => {
    mockQueryOne.mockResolvedValue({
      id: "tenant-1",
      name: "Hotel",
      status: "active",
    } as never);
    const result = await tenantRepository.findById("tenant-1");
    expect(result?.id).toBe("tenant-1");
    expect(mockQueryOne).toHaveBeenCalledWith(
      expect.stringContaining("FROM tenants"),
      ["tenant-1"],
    );
  });

  it("findById returns null when missing", async () => {
    mockQueryOne.mockResolvedValue(null as never);
    expect(await tenantRepository.findById("missing")).toBeNull();
  });
});
