import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import {
  availabilityRepository,
  type AvailabilitySlot,
  type BookingLock,
} from "../../../domains/availability/availability.repository";
import type { PoolClient } from "pg";

jest.mock("@booking/shared", () => ({ query: jest.fn() }));
jest.mock("../../../utils/metrics", () => ({
  availabilityLockCounter: { inc: jest.fn() },
  trackError: jest.fn(),
}));
jest.mock("../../../utils/logger", () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));
jest.mock("../../../context/requestContext", () => ({
  requestContext: { get: jest.fn().mockReturnValue({}) },
}));

const { query } = jest.requireMock("@booking/shared") as { query: jest.Mock };

function makeClient(rows: Record<string, unknown>[] = []): PoolClient {
  return {
    query: jest.fn().mockResolvedValue({ rows } as never),
  } as unknown as PoolClient;
}

describe("availabilityRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("isAvailable", () => {
    it("returns true when capacity is enough", async () => {
      const client = makeClient([{ nights_available: "2" }]);
      const result = await availabilityRepository.isAvailable(
        "rt-1",
        "2026-09-10",
        "2026-09-12",
        1,
        client,
      );
      expect(result).toBe(true);
      expect(client.query).toHaveBeenCalledWith(
        expect.stringContaining("FOR UPDATE OF ac"),
        ["rt-1", "2026-09-10", "2026-09-12", 1],
      );
    });

    it("returns false when capacity is insufficient", async () => {
      const client = makeClient([{ nights_available: "1" }]);
      const result = await availabilityRepository.isAvailable(
        "rt-1",
        "2026-09-10",
        "2026-09-12",
        1,
        client,
      );
      expect(result).toBe(false);
    });
  });

  describe("acquireLock", () => {
    it("inserts lock and returns row", async () => {
      const lock: BookingLock = {
        id: "lock-1",
        room_type_id: "rt-1",
        check_in: "2026-09-10",
        check_out: "2026-09-12",
        rooms_held: 1,
        session_id: "session-1",
        expires_at: new Date().toISOString(),
      };
      const client = makeClient([lock]);
      const result = await availabilityRepository.acquireLock(
        {
          roomTypeId: "rt-1",
          checkIn: "2026-09-10",
          checkOut: "2026-09-12",
          roomsHeld: 1,
          sessionId: "session-1",
        },
        client,
      );
      expect(result).toEqual(lock);
    });
  });

  describe("releaseLock", () => {
    it("deletes by session_id", async () => {
      query.mockResolvedValue(undefined as never);
      await availabilityRepository.releaseLock("session-1");
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM booking_locks"),
        ["session-1"],
      );
    });
  });

  describe("decrementAvailability / incrementAvailability", () => {
    it("decrements", async () => {
      const client = makeClient();
      await availabilityRepository.decrementAvailability(
        "rt-1",
        "2026-09-10",
        "2026-09-12",
        2,
        client,
      );
      expect(client.query).toHaveBeenCalledWith(
        expect.stringContaining("available_count = available_count - $1"),
        [2, "rt-1", "2026-09-10", "2026-09-12"],
      );
    });

    it("increments", async () => {
      const client = makeClient();
      await availabilityRepository.incrementAvailability(
        "rt-1",
        "2026-09-10",
        "2026-09-12",
        1,
        client,
      );
      expect(client.query).toHaveBeenCalledWith(
        expect.stringContaining("available_count = available_count + $1"),
        [1, "rt-1", "2026-09-10", "2026-09-12"],
      );
    });
  });

  describe("getAvailability", () => {
    it("returns net available slots", async () => {
      const slots: AvailabilitySlot[] = [
        {
          id: "slot-1",
          room_type_id: "rt-1",
          tenant_id: "tenant-1",
          date: "2026-09-10",
          available_count: 3,
          price_override_ngn: null,
          is_blocked: false,
        },
      ];
      query.mockResolvedValue(slots as never);
      const result = await availabilityRepository.getAvailability(
        "rt-1",
        "2026-09-10",
        "2026-09-12",
      );
      expect(result).toEqual(slots);
    });
  });

  describe("purgeExpiredLocks", () => {
    it("returns deleted count", async () => {
      query.mockResolvedValue([{ count: "5" }] as never);
      expect(await availabilityRepository.purgeExpiredLocks()).toBe(5);
    });

    it("returns 0 on failure", async () => {
      query.mockRejectedValue(new Error("db down") as never);
      expect(await availabilityRepository.purgeExpiredLocks()).toBe(0);
    });
  });
});
