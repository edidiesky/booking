/**
 * Idempotency lease + snapshot semantics (pure), matching payment-service design.
 */

type IdemStatus = "processing" | "completed" | "failed";

interface IdemRow {
  key: string;
  status: IdemStatus;
  claimedBy: string | null;
  leaseExpiresAt: number | null;
  responseSnapshot: unknown | null;
}

export class IdempotencyConflictError extends Error {
  status = 409;
  constructor(message: string) {
    super(message);
    this.name = "IdempotencyConflictError";
  }
}

export class InMemoryIdempotencyStore {
  private rows = new Map<string, IdemRow>();

  claim(key: string, claimedBy: string, leaseMs: number): IdemRow {
    const now = Date.now();
    const existing = this.rows.get(key);
    if (!existing) {
      const row: IdemRow = {
        key,
        status: "processing",
        claimedBy,
        leaseExpiresAt: now + leaseMs,
        responseSnapshot: null,
      };
      this.rows.set(key, row);
      return row;
    }
    if (existing.status === "completed" && existing.responseSnapshot) {
      return existing;
    }
    if (
      existing.status === "processing" &&
      existing.leaseExpiresAt !== null &&
      existing.leaseExpiresAt > now
    ) {
      throw new IdempotencyConflictError("Request already in progress");
    }
    existing.status = "processing";
    existing.claimedBy = claimedBy;
    existing.leaseExpiresAt = now + leaseMs;
    return existing;
  }

  complete(key: string, snapshot: unknown): void {
    const row = this.rows.get(key);
    if (!row) return;
    row.status = "completed";
    row.responseSnapshot = snapshot;
    row.leaseExpiresAt = null;
    row.claimedBy = null;
  }

  fail(key: string): void {
    const row = this.rows.get(key);
    if (!row) return;
    row.status = "failed";
    row.leaseExpiresAt = null;
    row.claimedBy = null;
  }
}

describe("payment idempotency", () => {
  let store: InMemoryIdempotencyStore;

  beforeEach(() => {
    store = new InMemoryIdempotencyStore();
  });

  it("first claim creates processing row", () => {
    const row = store.claim("pay:b1:paystack", "w1", 30_000);
    expect(row.status).toBe("processing");
  });

  it("completed key returns snapshot without re-work", () => {
    store.claim("k1", "w1", 30_000);
    store.complete("k1", { paymentId: "p1" });
    const row = store.claim("k1", "w2", 30_000);
    expect(row.status).toBe("completed");
    expect(row.responseSnapshot).toEqual({ paymentId: "p1" });
  });

  it("concurrent claim while lease active conflicts", () => {
    store.claim("k1", "w1", 60_000);
    expect(() => store.claim("k1", "w2", 60_000)).toThrow(
      IdempotencyConflictError,
    );
  });

  it("expired lease allows reclaim", () => {
    store.claim("k1", "w1", -1);
    const row = store.claim("k1", "w2", 30_000);
    expect(row.claimedBy).toBe("w2");
    expect(row.status).toBe("processing");
  });

  it("failed key can be retried", () => {
    store.claim("k1", "w1", 30_000);
    store.fail("k1");
    const row = store.claim("k1", "w2", 30_000);
    expect(row.status).toBe("processing");
  });
});
