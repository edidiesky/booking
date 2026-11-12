import { PoolClient } from "pg";

export type AccountType =
  | "gateway_clearing" | "escrow_held" | "platform_revenue"
  | "host_payable" | "cash_paid_out" | "refund_payable"
  | "chargeback_loss" | "host_clawback_receivable";

export type LedgerTransactionType =
  | "payment_received" | "escrow_release" | "payout" | "refund"
  | "chargeback" | "chargeback_recovered_from_host";

export interface LedgerEntryInput {
  accountType: AccountType;
  /** null = platform-wide account (gateway_clearing, platform_revenue ...) */
  tenantId: string | null;
  debitNgn?: number;
  creditNgn?: number;
}

/**
 * Writes to the monolith's ledger tables (migration 059): no tenant_id column on
 * transactions/entries; tenant is carried by the account.
 */
export const ledgerRepository = {
  async getOrCreateAccount(client: PoolClient, tenantId: string | null, accountType: AccountType): Promise<string> {
    const find = () =>
      client.query<{ id: string }>(
        `SELECT id FROM ledger_accounts WHERE account_type = $1 AND tenant_id IS NOT DISTINCT FROM $2`,
        [accountType, tenantId],
      );
    const found = await find();
    if (found.rows[0]) return found.rows[0].id;

    // uq_ledger_account (NULLS NOT DISTINCT) makes concurrent creation safe.
    await client.query(
      `INSERT INTO ledger_accounts (tenant_id, account_type) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [tenantId, accountType],
    );
    return (await find()).rows[0]!.id;
  },

  async findTransaction(client: PoolClient, bookingId: string, type: LedgerTransactionType) {
    const r = await client.query<{ id: string }>(
      `SELECT id FROM ledger_transactions WHERE booking_id = $1 AND transaction_type = $2 LIMIT 1`,
      [bookingId, type],
    );
    return r.rows[0]?.id ?? null;
  },

  async recordTransaction(
    client: PoolClient,
    transactionType: LedgerTransactionType,
    entries: LedgerEntryInput[],
    ctx: { bookingId?: string; paymentId?: string; metadata?: Record<string, unknown> },
  ): Promise<string> {
    const txn = await client.query<{ id: string }>(
      `INSERT INTO ledger_transactions (transaction_type, booking_id, payment_id, metadata)
       VALUES ($1, $2, $3, $4::jsonb) RETURNING id`,
      [transactionType, ctx.bookingId ?? null, ctx.paymentId ?? null, JSON.stringify(ctx.metadata ?? {})],
    );
    const transactionId = txn.rows[0]!.id;

    for (const e of entries) {
      const debit = e.debitNgn ?? 0;
      const credit = e.creditNgn ?? 0;
      // chk_debit_xor_credit rejects 0/0 rows: a 0% platform fee must simply have no fee line.
      if (debit === 0 && credit === 0) continue;
      const accountId = await this.getOrCreateAccount(client, e.tenantId, e.accountType);
      await client.query(
        `INSERT INTO ledger_entries (ledger_transaction_id, account_id, debit_ngn, credit_ngn)
         VALUES ($1, $2, $3, $4)`,
        [transactionId, accountId, debit, credit],
      );
    }
    return transactionId;
  },
};
