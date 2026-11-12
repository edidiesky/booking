/**
 * Double-entry style escrow release rules (pure).
 * Mirrors ledger-service money movement invariants.
 */

export class LedgerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LedgerError";
  }
}

interface Entry {
  bookingId: string;
  tenantId: string;
  account: string;
  debit: number;
  credit: number;
}

export class InMemoryLedger {
  private entries: Entry[] = [];
  private released = new Set<string>();

  releaseEscrow(input: {
    bookingId: string;
    tenantId: string;
    totalAmountNgn: number;
    platformFeeNgn: number;
  }): { entries: number } {
    if (input.totalAmountNgn <= 0) {
      throw new LedgerError("totalAmountNgn must be positive");
    }
    if (input.platformFeeNgn < 0 || input.platformFeeNgn > input.totalAmountNgn) {
      throw new LedgerError("invalid platformFeeNgn");
    }
    if (this.released.has(input.bookingId)) {
      throw new LedgerError("escrow already released for booking");
    }

    const hostAmount = input.totalAmountNgn - input.platformFeeNgn;
    this.entries.push(
      {
        bookingId: input.bookingId,
        tenantId: input.tenantId,
        account: "escrow",
        debit: input.totalAmountNgn,
        credit: 0,
      },
      {
        bookingId: input.bookingId,
        tenantId: input.tenantId,
        account: "host_payable",
        debit: 0,
        credit: hostAmount,
      },
      {
        bookingId: input.bookingId,
        tenantId: input.tenantId,
        account: "platform_revenue",
        debit: 0,
        credit: input.platformFeeNgn,
      },
    );
    this.released.add(input.bookingId);
    return { entries: 3 };
  }

  balanceFor(bookingId: string): number {
    return this.entries
      .filter((e) => e.bookingId === bookingId)
      .reduce((sum, e) => sum + e.debit - e.credit, 0);
  }

  wasReleased(bookingId: string): boolean {
    return this.released.has(bookingId);
  }
}

describe("ledger escrow release", () => {
  let ledger: InMemoryLedger;

  beforeEach(() => {
    ledger = new InMemoryLedger();
  });

  it("posts balanced double-entry style legs", () => {
    ledger.releaseEscrow({
      bookingId: "b1",
      tenantId: "t1",
      totalAmountNgn: 10000,
      platformFeeNgn: 1000,
    });
    expect(ledger.balanceFor("b1")).toBe(0);
    expect(ledger.wasReleased("b1")).toBe(true);
  });

  it("rejects duplicate release", () => {
    const input = {
      bookingId: "b1",
      tenantId: "t1",
      totalAmountNgn: 5000,
      platformFeeNgn: 500,
    };
    ledger.releaseEscrow(input);
    expect(() => ledger.releaseEscrow(input)).toThrow(LedgerError);
  });

  it("rejects invalid amounts", () => {
    expect(() =>
      ledger.releaseEscrow({
        bookingId: "b1",
        tenantId: "t1",
        totalAmountNgn: 0,
        platformFeeNgn: 0,
      }),
    ).toThrow(LedgerError);
    expect(() =>
      ledger.releaseEscrow({
        bookingId: "b1",
        tenantId: "t1",
        totalAmountNgn: 100,
        platformFeeNgn: 200,
      }),
    ).toThrow(LedgerError);
  });
});
