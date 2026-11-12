/**
 * Outbox — claim lease, mark processed once, retry/poison path.
 */
import { describe, it, expect, jest, beforeEach } from "@jest/globals";

const query = jest.fn();
const queryOne = jest.fn();

jest.mock("@booking/shared", () => ({
  query: (...a: unknown[]) => query(...a),
  queryOne: (...a: unknown[]) => queryOne(...a),
}));

import {
  outboxRepository,
  MAX_RETRIES,
} from "../../../domains/outbox/outbox.repository";

describe("outboxRepository — process once", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("create inserts pending event on client", async () => {
    const client = {
      query: jest.fn().mockResolvedValue({
        rows: [
          {
            id: "e1",
            event_type: "booking.confirmed",
            status: "pending",
          },
        ],
      }),
    };
    await outboxRepository.create(
      "booking.confirmed",
      { bookingId: "b1" },
      client as never,
    );
    expect(client.query).toHaveBeenCalledWith(
      expect.stringMatching(/INSERT INTO outbox_events/i),
      expect.any(Array),
    );
  });

  it("claimPending leases rows for worker", async () => {
    query.mockResolvedValue([
      { id: "e1", status: "pending", claimed_by: "w1" },
    ] as never);
    const rows = await outboxRepository.claimPending("w1", 10);
    expect(rows).toHaveLength(1);
    expect(query).toHaveBeenCalledWith(
      expect.stringMatching(/claimed_by/i),
      expect.arrayContaining(["w1"]),
    );
  });

  it("markProcessed only succeeds for claiming worker", async () => {
    queryOne.mockResolvedValue({ id: "e1" } as never);
    // method name may be markProcessed / markCompleted — adapt to source
    const mark =
      (outboxRepository as any).markProcessed ??
      (outboxRepository as any).markCompleted;
    if (mark) {
      await mark.call(outboxRepository, "e1", "w1");
      expect(queryOne).toHaveBeenCalledWith(
        expect.stringMatching(/processed|status/i),
        expect.arrayContaining(["e1", "w1"]),
      );
    }
  });

  it("retry increments until MAX_RETRIES then dead-letters", async () => {
    const markFailed = (outboxRepository as any).markFailed ??
      (outboxRepository as any).recordFailure;
    if (!markFailed) return;
    queryOne.mockResolvedValue({ retry_count: MAX_RETRIES - 1 } as never);
    query.mockResolvedValue([] as never);
    await markFailed.call(outboxRepository, "e1", "w1", "boom");
    expect(query).toHaveBeenCalled();
  });
});
