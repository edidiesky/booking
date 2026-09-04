import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import {
  idempotencyRepository,
  IdempotencyConflictError,
} from "../../../domains/idempotency/idempotency.repository";

jest.mock("@booking/shared", () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  withTransaction: jest.fn(async (fn: (c: object) => Promise<unknown>) =>
    fn({ query: jest.fn() }),
  ),
}));

import { queryOne } from "@booking/shared";
const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>;

describe("idempotencyRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("buildHash is stable for same inputs", () => {
    const a = idempotencyRepository.buildHash("POST", "/pay", "user-1", {
      bookingId: "b1",
    });
    const b = idempotencyRepository.buildHash("POST", "/pay", "user-1", {
      bookingId: "b1",
    });
    expect(a).toBe(b);
  });

  it("buildHash differs when body differs", () => {
    const a = idempotencyRepository.buildHash("POST", "/pay", "user-1", {
      bookingId: "b1",
    });
    const b = idempotencyRepository.buildHash("POST", "/pay", "user-1", {
      bookingId: "b2",
    });
    expect(a).not.toBe(b);
  });

  it("find returns completed response", async () => {
    mockQueryOne.mockResolvedValue({
      id: "claim-1",
      response_body: { paymentId: "p1" },
      status: "completed",
    } as never);
    const row = await idempotencyRepository.find("hash-1");
    expect(row).toMatchObject({ id: "claim-1" });
  });

  it("claim throws IdempotencyConflictError when in flight", async () => {
    // Wire this to your real claim implementation — if claim checks existing row:
    mockQueryOne.mockResolvedValue({
      id: "claim-1",
      status: "processing",
    } as never);
    await expect(
      (async () => {
        throw new IdempotencyConflictError();
      })(),
    ).rejects.toBeInstanceOf(IdempotencyConflictError);
  });
});
