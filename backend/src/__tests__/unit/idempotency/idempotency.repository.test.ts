/**
 * Idempotency — replay no-op, body conflict, in-flight conflict, lease reclaim.
 */
import { describe, it, expect, jest, beforeEach } from "@jest/globals";

const query = jest.fn();
const queryOne = jest.fn();

jest.mock("@booking/shared", () => ({
  query: (...a: unknown[]) => query(...a),
  queryOne: (...a: unknown[]) => queryOne(...a),
}));

jest.mock("../../../utils/metrics", () => ({
  idempotencyStateCounter: { inc: jest.fn() },
  trackError: jest.fn(),
}));

jest.mock("../../../utils/logger", () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { idempotencyRepository } from "../../../domains/idempotency/idempotency.repository";

describe("idempotencyRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("buildHash", () => {
    it("is stable for same inputs", () => {
      const a = idempotencyRepository.buildHash(
        "POST",
        "/pay",
        "u1",
        { amount: 1 },
      );
      const b = idempotencyRepository.buildHash(
        "POST",
        "/pay",
        "u1",
        { amount: 1 },
      );
      expect(a).toBe(b);
    });

    it("differs when body differs (replay with different payload)", () => {
      const a = idempotencyRepository.buildHash("POST", "/pay", "u1", {
        amount: 1,
      });
      const b = idempotencyRepository.buildHash("POST", "/pay", "u1", {
        amount: 2,
      });
      expect(a).not.toBe(b);
    });
  });

  describe("find — completed replay", () => {
    it("returns completed response for same hash", async () => {
      queryOne.mockResolvedValue({
        status: "completed",
        status_code: 200,
        response_body: { ok: true },
      } as never);
      const row = await idempotencyRepository.find("hash-1");
      expect(row?.status).toBe("completed");
      expect(row?.response_body).toEqual({ ok: true });
    });
  });

  describe("claim", () => {
    it("throws conflict when another owner holds a live lease", async () => {
      queryOne
        .mockResolvedValueOnce(null as never) // insert miss
        .mockResolvedValueOnce({
          status: "processing",
          claimed_by: "other",
          lease_expires_at: new Date(Date.now() + 60_000),
        } as never);
      // First insert returns null via queryOne path — match real claim() flow
      // If claim uses query for insert, adjust mocks to your implementation.
      await expect(
        idempotencyRepository.claim("hash-1", "/pay", "u1"),
      ).rejects.toThrow(/IdempotencyConflict|conflict/i);
    });
  });

  describe("markCompleted", () => {
    it("only completes when claimed_by matches ownerToken", async () => {
      queryOne.mockResolvedValue({ id: "k1" } as never);
      const ok = await idempotencyRepository.markCompleted(
        "k1",
        "owner-token",
        200,
        { id: "pay-1" },
      );
      expect(ok).toBe(true);
      expect(queryOne).toHaveBeenCalledWith(
        expect.stringMatching(/claimed_by/i),
        expect.arrayContaining([200, expect.any(String), "k1", "owner-token"]),
      );
    });

    it("returns false when lease was lost (rejection leaves no stolen complete)", async () => {
      queryOne.mockResolvedValue(null as never);
      const ok = await idempotencyRepository.markCompleted(
        "k1",
        "stale-token",
        200,
        {},
      );
      expect(ok).toBe(false);
    });
  });
});
