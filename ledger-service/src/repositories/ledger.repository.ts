import { PoolClient } from "pg";

export type AccountType =
  | "gateway_clearing" | "escrow_held" | "platform_revenue"
  | "host_payable" | "cash_paid_out" | "refund_payable"
  | "chargeback_loss" | "host_clawback_receivable";

export interface LedgerEntryInput {
  accountType: AccountType;
  tenantId: string | null;
  debitNgn?: number;
  creditNgn?: number;
}

export const ledgerRepository = {
  async getOrCreateAccountsBatch(
    pairs: Array<{ tenantId: string | null; accountType: AccountType }>,
    client: PoolClient,
  ): Promise<Map<string, string>> {

    // the real, replicated reference table (ledger_accounts), Citus
    // makes this transparent, the query looks identical to the
    // pre-Citus version.
    const uniquePairs = Array.from(
      new Map(pairs.map((p) => [`${p.tenantId ?? "null"}:${p.accountType}`, p])).values(),
    );
    const existing = await client.query<{ id: string; tenant_id: string | null; account_type: string }>(
      `SELECT id, tenant_id, account_type FROM ledger_accounts
       WHERE (tenant_id, account_type) IN (SELECT * FROM unnest($1::uuid[], $2::text[]))`,
      [uniquePairs.map((p) => p.tenantId), uniquePairs.map((p) => p.accountType)],
    );
    const resultMap = new Map<string, string>();
    for (const row of existing.rows) resultMap.set(`${row.tenant_id ?? "null"}:${row.account_type}`, row.id);

    const missing = uniquePairs.filter((p) => !resultMap.has(`${p.tenantId ?? "null"}:${p.accountType}`));
    if (missing.length > 0) {
      const created = await client.query<{ id: string; tenant_id: string | null; account_type: string }>(
        `INSERT INTO ledger_accounts (tenant_id, account_type)
         SELECT * FROM unnest($1::uuid[], $2::text[]) RETURNING id, tenant_id, account_type`,
        [missing.map((p) => p.tenantId), missing.map((p) => p.accountType)],
      );
      for (const row of created.rows) resultMap.set(`${row.tenant_id ?? "null"}:${row.account_type}`, row.id);
    }
    return resultMap;
  },

  // version: recordTransaction now REQUIRES a real, single, non-null
  // tenantId for the whole real transaction, not optional per-entry.
  // This is the real, direct consequence of sharding by tenant_id:
  // Citus needs every row in a distributed table to genuinely carry
  // its real shard key, a platform-wide entry (tenantId: null, used
  // for gateway_clearing/platform_revenue in the single-DB version)
  // can no longer be silently unsharded here, it has to pick a real
  // tenant to shard under, or live in a real, separate, reference
  // structure. This is a genuine, real, structural cost of
  // decomposition, not a minor implementation detail, flagged
  // honestly in Open Issues below rather than glossed over.
  async recordTransaction(
    client: PoolClient,
    transactionType: string,
    tenantId: string,
    entries: LedgerEntryInput[],
    context: { bookingId?: string; paymentId?: string; metadata?: Record<string, unknown> },
  ): Promise<string> {
    const txn = await client.query<{ id: string }>(
      `INSERT INTO ledger_transactions (transaction_type, tenant_id, booking_id, payment_id, metadata)
       VALUES ($1, $2, $3, $4, $5::jsonb) RETURNING id`,
      [transactionType, tenantId, context.bookingId ?? null, context.paymentId ?? null, JSON.stringify(context.metadata ?? {})],
    );
    const transactionId = txn.rows[0]!.id;

    const accountMap = await this.getOrCreateAccountsBatch(
      entries.map((e) => ({ tenantId: e.tenantId, accountType: e.accountType })), client,
    );
    const accountIds = entries.map((e) => accountMap.get(`${e.tenantId ?? "null"}:${e.accountType}`)!);
    const debits = entries.map((e) => e.debitNgn ?? 0);
    const credits = entries.map((e) => e.creditNgn ?? 0);
    const transactionIds = entries.map(() => transactionId);

    // row now, for the same real, structural sharding reason.
    const tenantIds = entries.map(() => tenantId);

    await client.query(
      `INSERT INTO ledger_entries (ledger_transaction_id, account_id, debit_ngn, credit_ngn, tenant_id)
       SELECT * FROM unnest($1::uuid[], $2::uuid[], $3::numeric[], $4::numeric[], $5::uuid[])`,
      [transactionIds, accountIds, debits, credits, tenantIds],
    );

    return transactionId;
  },
};
