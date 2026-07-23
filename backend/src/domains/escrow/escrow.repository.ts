import { PoolClient } from "pg";
import { query, queryOne } from "@booking/shared";
import { EscrowStatus } from "../../types";
import { publishEscrowReleased, publishEscrowRefunded } from "../../messaging/publisher";
import { escrowHeldGauge } from "../../utils/metrics";
import logger from "../../utils/logger";

export interface EscrowRecord {
  id:                string;
  booking_id:        string;
  tenant_id:         string;
  amount_ngn:        number;
  platform_fee_ngn:  number;
  host_payout_ngn:   number;
  status:            EscrowStatus;
  held_at:           Date;
  released_at?:      Date;
  refunded_at?:      Date;
  refund_amount_ngn?: number;
  created_at:        Date;
  updated_at:        Date;
}

export const escrowRepository = {
  async create(data: {
    bookingId:      string;
    tenantId:       string;
    amountNgn:      number;
    platformFeeNgn: number;
    hostPayoutNgn:  number;
  }, client: PoolClient): Promise<EscrowRecord> {
    const row = (await client.query(
      `INSERT INTO escrow_ledger (booking_id, tenant_id, amount_ngn, platform_fee_ngn, host_payout_ngn)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [data.bookingId, data.tenantId, data.amountNgn, data.platformFeeNgn, data.hostPayoutNgn]
    )).rows[0] as EscrowRecord;

    escrowHeldGauge.inc({ tenant_id: data.tenantId }, data.hostPayoutNgn);
    logger.info("escrow_held", { event: "escrow_held", bookingId: data.bookingId, amount: data.amountNgn });
    return row;
  },

  async findByBookingId(bookingId: string): Promise<EscrowRecord | null> {
    return queryOne<EscrowRecord>(`SELECT * FROM escrow_ledger WHERE booking_id = $1`, [bookingId]);
  },

  async release(bookingId: string, client: PoolClient): Promise<EscrowRecord | null> {
    const row = (await client.query(
      `UPDATE escrow_ledger
       SET status = 'released', released_at = now(), updated_at = now()
       WHERE booking_id = $1 AND status = 'held'
       RETURNING *`,
      [bookingId]
    )).rows[0] as EscrowRecord | undefined;

    if (row) {
      escrowHeldGauge.dec({ tenant_id: row.tenant_id }, Number(row.host_payout_ngn));
      publishEscrowReleased({ escrowId: row.id, bookingId, tenantId: row.tenant_id, hostPayoutNgn: Number(row.host_payout_ngn) });
      logger.info("escrow_released", { event: "escrow_released", bookingId, hostPayout: row.host_payout_ngn });
    }

    return row ?? null;
  },

  async initiateRefund(bookingId: string, refundAmount: number, client: PoolClient): Promise<EscrowRecord | null> {
    const escrow = (await client.query(
      `SELECT * FROM escrow_ledger WHERE booking_id = $1 AND status = 'held'`, [bookingId]
    )).rows[0] as EscrowRecord | undefined;

    if (!escrow) return null;

    const status: EscrowStatus = refundAmount >= Number(escrow.amount_ngn) ? "refunded" : "partially_refunded";

    const row = (await client.query(
      `UPDATE escrow_ledger
       SET status = $1, refunded_at = now(), refund_amount_ngn = $2, updated_at = now()
       WHERE booking_id = $3 AND status = 'held'
       RETURNING *`,
      [status, refundAmount, bookingId]
    )).rows[0] as EscrowRecord;

    escrowHeldGauge.dec({ tenant_id: escrow.tenant_id }, Number(escrow.host_payout_ngn));
    publishEscrowRefunded({ escrowId: row.id, bookingId, tenantId: row.tenant_id, hostPayoutNgn: Number(row.host_payout_ngn), refundAmountNgn: refundAmount });

    logger.info("escrow_refund_initiated", { event: "escrow_refund_initiated", bookingId, refundAmount, status });
    return row;
  },

  async listByTenant(tenantId: string, page = 1, limit = 20): Promise<EscrowRecord[]> {
    const offset = (page - 1) * limit;
    return query<EscrowRecord>(
      `SELECT e.*, b.booking_ref, b.check_in, b.check_out
       FROM escrow_ledger e
       JOIN bookings b ON b.id = e.booking_id
       WHERE e.tenant_id = $1
       ORDER BY e.created_at DESC LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    );
  },

  // Single atomic query: per-status counts/sums plus month-over-month
  // growth, computed with FILTER clauses so it's one round trip and one
  // consistent snapshot, instead of firing a separate COUNT/SUM per status
  // (which is also not atomic, values could be read from different
  // moments in time if writes land between queries).
  async getStatsForTenant(tenantId: string): Promise<EscrowStats> {
    const row = await queryOne<{
      held_count: string;
      held_amount: number;
      released_count: string;
      released_amount: number;
      refunded_count: string;
      refunded_amount: number;
      current_month_volume: number;
      previous_month_volume: number;
    }>(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'held')     AS held_count,
         COALESCE(SUM(amount_ngn)      FILTER (WHERE status = 'held'), 0)      AS held_amount,
         COUNT(*) FILTER (WHERE status = 'released') AS released_count,
         COALESCE(SUM(host_payout_ngn) FILTER (WHERE status = 'released'), 0)  AS released_amount,
         COUNT(*) FILTER (WHERE status IN ('refunded', 'partially_refunded')) AS refunded_count,
         COALESCE(SUM(refund_amount_ngn) FILTER (WHERE status IN ('refunded', 'partially_refunded')), 0) AS refunded_amount,
         COALESCE(SUM(amount_ngn) FILTER (
           WHERE created_at >= date_trunc('month', now())
         ), 0) AS current_month_volume,
         COALESCE(SUM(amount_ngn) FILTER (
           WHERE created_at >= date_trunc('month', now()) - interval '1 month'
             AND created_at <  date_trunc('month', now())
         ), 0) AS previous_month_volume
       FROM escrow_ledger
       WHERE tenant_id = $1`,
      [tenantId],
    );

    const heldCount      = Number(row?.held_count ?? 0);
    const releasedCount  = Number(row?.released_count ?? 0);
    const refundedCount  = Number(row?.refunded_count ?? 0);
    const currentVolume  = Number(row?.current_month_volume ?? 0);
    const previousVolume = Number(row?.previous_month_volume ?? 0);

    // Growth as % change month over month. Guard div-by-zero: if there was
    // no volume last month, treat any current volume as +100% rather than
    // Infinity/NaN, and 0-to-0 as 0% rather than NaN.
    const volumeGrowthPct =
      previousVolume === 0
        ? (currentVolume > 0 ? 100 : 0)
        : ((currentVolume - previousVolume) / previousVolume) * 100;

    return {
      held:      { count: heldCount,     amountNgn: Number(row?.held_amount ?? 0) },
      released:  { count: releasedCount, amountNgn: Number(row?.released_amount ?? 0) },
      refunded:  { count: refundedCount, amountNgn: Number(row?.refunded_amount ?? 0) },
      currentMonthVolumeNgn:  currentVolume,
      previousMonthVolumeNgn: previousVolume,
      volumeGrowthPct: Math.round(volumeGrowthPct * 10) / 10,
    };
  },
};

export interface EscrowStats {
  held:     { count: number; amountNgn: number };
  released: { count: number; amountNgn: number };
  refunded: { count: number; amountNgn: number };
  currentMonthVolumeNgn:  number;
  previousMonthVolumeNgn: number;
  volumeGrowthPct: number;
}