/**
 * Ledger unit tests — invariant-last (sum debits = sum credits per transaction).
 * Mocks ledgerRepository.recordTransaction to capture entries and assert balance.
 */
import { describe, it, expect, jest, beforeEach } from "@jest/globals";

const recordTransaction = jest.fn();
const getLockedBookingBalance = jest.fn();

jest.mock("../../../domains/ledger/ledger.repository", () => ({
  ledgerRepository: {
    recordTransaction: (...args: unknown[]) => recordTransaction(...args),
    getLockedBookingBalance: (...args: unknown[]) =>
      getLockedBookingBalance(...args),
  },
}));

import { ledgerService } from "../../../domains/ledger/ledger.service";
import { AppError } from "../../../utils/AppError";

type Entry = {
  accountType: string;
  tenantId: string | null;
  debitNgn?: number;
  creditNgn?: number;
};

function sumDebits(entries: Entry[]): number {
  return entries.reduce((s, e) => s + (e.debitNgn ?? 0), 0);
}
function sumCredits(entries: Entry[]): number {
  return entries.reduce((s, e) => s + (e.creditNgn ?? 0), 0);
}

const client = { query: jest.fn() } as never;

describe("ledgerService — double-entry invariants", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    recordTransaction.mockResolvedValue("txn-1" as never);
  });

  it("payment_received: debits == credits", async () => {
    await ledgerService.recordPaymentReceived(
      client,
      "b1",
      "p1",
      "t1",
      50_000,
    );
    const entries = recordTransaction.mock.calls[0]![2] as Entry[];
    expect(sumDebits(entries)).toBe(sumCredits(entries));
    expect(sumDebits(entries)).toBe(50_000);
  });

  it("escrow_release: total splits into host + platform, balanced", async () => {
    await ledgerService.recordEscrowRelease(client, "b1", "t1", 50_000, 5_000);
    const entries = recordTransaction.mock.calls[0]![2] as Entry[];
    expect(sumDebits(entries)).toBe(sumCredits(entries));
    expect(sumDebits(entries)).toBe(50_000);
  });

  it("escrow_release rejects platform fee > total", async () => {
    await expect(
      ledgerService.recordEscrowRelease(client, "b1", "t1", 1_000, 2_000),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(recordTransaction).not.toHaveBeenCalled();
  });

  it("payout: balanced host_payable → cash_paid_out", async () => {
    await ledgerService.recordPayout(client, "b1", "t1", 45_000);
    const entries = recordTransaction.mock.calls[0]![2] as Entry[];
    expect(sumDebits(entries)).toBe(sumCredits(entries));
  });

  it("refund: scoped to booking held balance (blocks over-refund)", async () => {
    getLockedBookingBalance.mockResolvedValue(10_000 as never);
    await expect(
      ledgerService.recordRefund(client, "b1", "t1", 20_000),
    ).rejects.toBeTruthy();
    // if implementation allows partial path, adjust; invariant: no record when over
  });
});
