import type { PoolClient } from "pg";

export type AccountType =
  | "gateway_clearing"
  | "escrow_held"
  | "platform_revenue"
  | "host_payable"
  | "cash_paid_out"
  | "refund_payable"
  | "chargeback_loss"
  | "host_clawback_receivable";

export type LedgerTransactionType =
  | "payment_received"
  | "escrow_release"
  | "payout"
  | "refund"
  | "chargeback"
  | "chargeback_recovered_from_host";

export interface LedgerEntryInput {
  accountType: AccountType;
  tenantId: string | null;
  debitNgn?: number;
  creditNgn?: number;
}

export const ledgerRepository = {
  async getOrCreateAccount(
    tenantId: string | null,
    accountType: AccountType,
    client: PoolClient,
  ): Promise<string> {
    const existing = await client.query<{ id: string }>(
      `SELECT id FROM ledger_accounts
       WHERE account_type = $1 AND tenant_id IS NOT DISTINCT FROM $2`,
      [accountType, tenantId],
    );
    if (existing.rows[0]) return existing.rows[0].id;

    const created = await client.query<{ id: string }>(
      `INSERT INTO ledger_accounts (tenant_id, account_type)
       VALUES ($1, $2) RETURNING id`,
      [tenantId, accountType],
    );
    return created.rows[0]!.id;
  },

  /**
   * Serializes refunds/chargebacks for this booking+account.
   * Balance = credits - debits (liability-style for escrow_held / host_payable).
   */
  async getLockedBookingBalance(
    bookingId: string,
    accountType: AccountType,
    client: PoolClient,
  ): Promise<number> {
    await client.query(
      `SELECT le.id
       FROM ledger_entries le
       JOIN ledger_transactions lt ON lt.id = le.ledger_transaction_id
       JOIN ledger_accounts la ON la.id = le.account_id
       WHERE lt.booking_id = $1 AND la.account_type = $2
       FOR UPDATE OF le`,
      [bookingId, accountType],
    );

    const result = await client.query<{ balance: string }>(
      `SELECT COALESCE(SUM(le.credit_ngn) - SUM(le.debit_ngn), 0) AS balance
       FROM ledger_entries le
       JOIN ledger_transactions lt ON lt.id = le.ledger_transaction_id
       JOIN ledger_accounts la ON la.id = le.account_id
       WHERE lt.booking_id = $1 AND la.account_type = $2`,
      [bookingId, accountType],
    );
    return Number(result.rows[0]?.balance ?? 0);
  },

  async recordTransaction(
    client: PoolClient,
    transactionType: LedgerTransactionType,
    entries: LedgerEntryInput[],
    context: {
      bookingId?: string;
      paymentId?: string;
      metadata?: Record<string, unknown>;
    },
  ): Promise<string> {
    const txn = await client.query<{ id: string }>(
      `INSERT INTO ledger_transactions (transaction_type, booking_id, payment_id, metadata)
       VALUES ($1, $2, $3, $4::jsonb)
       RETURNING id`,
      [
        transactionType,
        context.bookingId ?? null,
        context.paymentId ?? null,
        JSON.stringify(context.metadata ?? {}),
      ],
    );
    const transactionId = txn.rows[0]!.id;

    for (const entry of entries) {
      if ((entry.debitNgn ?? 0) === 0 && (entry.creditNgn ?? 0) === 0) {
        continue;
      }
      const accountId = await this.getOrCreateAccount(
        entry.tenantId,
        entry.accountType,
        client,
      );
      await client.query(
        `INSERT INTO ledger_entries
           (ledger_transaction_id, account_id, debit_ngn, credit_ngn)
         VALUES ($1, $2, $3, $4)`,
        [transactionId, accountId, entry.debitNgn ?? 0, entry.creditNgn ?? 0],
      );
    }

    return transactionId;
  },
};
