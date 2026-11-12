/**
 * Worker pattern: process once, retry, poison.
 * Template — wire to your real notification / audit / expiry worker handlers.
 */
import { describe, it, expect, jest } from "@jest/globals";

type Msg = { id: string; attempts: number; body: unknown };

async function processOnce(
  msg: Msg,
  handler: (body: unknown) => Promise<void>,
  maxAttempts = 5,
): Promise<"ack" | "retry" | "dead"> {
  try {
    await handler(msg.body);
    return "ack";
  } catch {
    if (msg.attempts + 1 >= maxAttempts) return "dead";
    return "retry";
  }
}

describe("worker process-once pattern", () => {
  it("acks on success (exactly one handler call)", async () => {
    const handler = jest.fn().mockResolvedValue(undefined as never);
    const outcome = await processOnce({ id: "1", attempts: 0, body: {} }, handler);
    expect(outcome).toBe("ack");
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("retries on transient failure under max attempts", async () => {
    const handler = jest.fn().mockRejectedValue(new Error("timeout") as never);
    const outcome = await processOnce(
      { id: "1", attempts: 1, body: {} },
      handler,
      5,
    );
    expect(outcome).toBe("retry");
  });

  it("dead-letters after max attempts", async () => {
    const handler = jest.fn().mockRejectedValue(new Error("poison") as never);
    const outcome = await processOnce(
      { id: "1", attempts: 4, body: {} },
      handler,
      5,
    );
    expect(outcome).toBe("dead");
  });
});
