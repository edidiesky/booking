import { Pool, PoolClient } from "pg";
import { ledgerRepository } from "../repositories/ledger.repository";

export class LedgerValidationError extends Error {
  status = 400;
  constructor(message: string) {
    super(message);
    this.name = "LedgerValidationError";
  }
}

export function ngnToKobo(ngn: number): number {
  return Math.round(Number(ngn) * 100);
}

export function koboToNgn(kobo: number): number {
  return kobo / 100;
}

export const ledgerService = {
  async recordEscrowRelease(
    client: PoolClient,
    bookingId: string,
    tenantId: string,
    totalAmountNgn: number,
    platformFeeNgn: number,
  ) {
    if (!(totalAmountNgn > 0)) {
      throw new LedgerValidationError("totalAmountNgn must be positive");
    }
    if (platformFeeNgn < 0 || platformFeeNgn > totalAmountNgn) {
      throw new LedgerValidationError(
        "platformFeeNgn must be between 0 and totalAmountNgn inclusive",
      );
    }

    // Integer kobo math for host share
    const totalKobo = ngnToKobo(totalAmountNgn);
    const feeKobo = ngnToKobo(platformFeeNgn);
    const hostKobo = totalKobo - feeKobo;
    const total = koboToNgn(totalKobo);
    const fee = koboToNgn(feeKobo);
    const host = koboToNgn(hostKobo);

    try {
      const txId = await ledgerRepository.recordTransaction(
        client,
        "escrow_release",
        tenantId,
        [
          { accountType: "escrow_held", tenantId, debitNgn: total },
          { accountType: "host_payable", tenantId, creditNgn: host },
          { accountType: "platform_revenue", tenantId, creditNgn: fee },
        ],
        {
          bookingId,
          metadata: { bookingId, totalAmountNgn: total, platformFeeNgn: fee },
        },
      );
      return { transactionId: txId, idempotent: false };
    } catch (err) {
      if ((err as { code?: string }).code === "23505") {
        const existing = await client.query<{ id: string }>(
          `SELECT id FROM ledger_transactions
           WHERE tenant_id = $1 AND transaction_type = 'escrow_release'
             AND metadata->>'bookingId' = $2 LIMIT 1`,
          [tenantId, bookingId],
        );
        if (existing.rows[0]) {
          return { transactionId: existing.rows[0].id, idempotent: true };
        }
      }
      throw err;
    }
  },

  async releaseEscrowWithPool(
    pool: Pool,
    input: {
      bookingId: string;
      tenantId: string;
      totalAmountNgn: number;
      platformFeeNgn: number;
    },
  ) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await this.recordEscrowRelease(
        client,
        input.bookingId,
        input.tenantId,
        input.totalAmountNgn,
        input.platformFeeNgn,
      );
      await client.query("COMMIT");
      return result;
    } catch (err) {
      try {
        await client.query("ROLLBACK");
      } catch {
        /* ignore */
      }
      throw err;
    } finally {
      client.release();
    }
  },
};
