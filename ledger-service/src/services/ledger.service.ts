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

export interface ReleaseEscrowInput {
  bookingId: string;
  tenantId: string;
  paymentId?: string;
  totalAmountNgn: number;
  platformFeeNgn: number;
}

export interface RefundInput {
  bookingId: string;
  tenantId: string;
  paymentId?: string;
  /** Gross refund amount in NGN (usually full payment amount). */
  amountNgn: number;
}

export const ledgerService = {
  /**
   * Exactly-once per booking (serialised by an advisory lock + unique index):
   *   1. makes sure the money is IN escrow (payment_received) - the monolith posts it when IT
   *      confirms the booking; when it did not, escrow_held would otherwise go negative;
   *   2. posts escrow_release;
   *   3. writes the outbox event in the SAME transaction (previously a separate connection after
   *      commit: a failure there failed the saga step AFTER the ledger had been written).
   */
  async recordEscrowRelease(client: PoolClient, input: ReleaseEscrowInput) {
    const { bookingId, tenantId, paymentId, totalAmountNgn, platformFeeNgn } = input;
    if (!(totalAmountNgn > 0)) throw new LedgerValidationError("totalAmountNgn must be positive");
    if (platformFeeNgn < 0 || platformFeeNgn > totalAmountNgn) {
      throw new LedgerValidationError("platformFeeNgn must be between 0 and totalAmountNgn inclusive");
    }

    await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [`ledger:${bookingId}`]);

    const already = await ledgerRepository.findTransaction(client, bookingId, "escrow_release");
    if (already) return { transactionId: already, idempotent: true };

    // Integer kobo arithmetic: no floating point drift between host share and fee.
    const totalKobo = ngnToKobo(totalAmountNgn);
    const feeKobo = ngnToKobo(platformFeeNgn);
    const total = koboToNgn(totalKobo);
    const fee = koboToNgn(feeKobo);
    const host = koboToNgn(totalKobo - feeKobo);

    if (!(await ledgerRepository.findTransaction(client, bookingId, "payment_received"))) {
      await ledgerRepository.recordTransaction(
        client,
        "payment_received",
        [
          { accountType: "gateway_clearing", tenantId: null, debitNgn: total },
          { accountType: "escrow_held", tenantId, creditNgn: total },
        ],
        { bookingId, paymentId, metadata: { source: "ledger-service" } },
      );
    }

    const transactionId = await ledgerRepository.recordTransaction(
      client,
      "escrow_release",
      [
        { accountType: "escrow_held", tenantId, debitNgn: total },
        { accountType: "host_payable", tenantId, creditNgn: host },
        { accountType: "platform_revenue", tenantId: null, creditNgn: fee },
      ],
      { bookingId, paymentId, metadata: { totalAmountNgn: total, platformFeeNgn: fee, hostAmountNgn: host } },
    );

    // Event type the monolith relay already knows (booking.escrow_released had no publisher).
    await client.query(`INSERT INTO outbox_events (event_type, payload) VALUES ('escrow.released', $1::jsonb)`, [
      JSON.stringify({
        bookingId, tenantId, totalAmountNgn: total, platformFeeNgn: fee,
        hostPayoutNgn: host, transactionId,
      }),
    ]);

    return { transactionId, idempotent: false };
  },

  async releaseEscrowWithPool(pool: Pool, input: ReleaseEscrowInput) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await this.recordEscrowRelease(client, input);
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

  /**
   * Exactly-once refund journal for a booking still in escrow (pre check-out).
   * Reverses payment_received: debit escrow_held, credit gateway_clearing.
   * Idempotent on (booking_id, transaction_type='refund').
   *
   * Does NOT handle post-escrow-release clawback from host_payable — that is an
   * admin/ops path (transaction_type chargeback / host_clawback).
   */
  async recordRefund(client: PoolClient, input: RefundInput) {
    const { bookingId, tenantId, paymentId, amountNgn } = input;
    if (!(amountNgn > 0)) {
      throw new LedgerValidationError("amountNgn must be positive");
    }

    await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [
      `ledger:refund:${bookingId}`,
    ]);

    const already = await ledgerRepository.findTransaction(
      client,
      bookingId,
      "refund",
    );
    if (already) return { transactionId: already, idempotent: true };

    const amount = koboToNgn(ngnToKobo(amountNgn));

    // Prefer reversing escrow_held when payment was received into escrow.
    // If payment_received never posted, still record refund against gateway_clearing
    // so the books show money left the system.
    const entries = [
      { accountType: "escrow_held" as const, tenantId, debitNgn: amount },
      {
        accountType: "gateway_clearing" as const,
        tenantId: null,
        creditNgn: amount,
      },
    ];

    const transactionId = await ledgerRepository.recordTransaction(
      client,
      "refund",
      entries,
      {
        bookingId,
        paymentId,
        metadata: { amountNgn: amount, source: "ledger-service" },
      },
    );

    await client.query(
      `INSERT INTO outbox_events (event_type, payload) VALUES ('payment.refunded', $1::jsonb)`,
      [
        JSON.stringify({
          bookingId,
          tenantId,
          paymentId: paymentId ?? null,
          amountNgn: amount,
          transactionId,
        }),
      ],
    );

    return { transactionId, idempotent: false };
  },

  async refundWithPool(pool: Pool, input: RefundInput) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await this.recordRefund(client, input);
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
