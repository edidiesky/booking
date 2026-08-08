import { PoolClient } from "pg";
import { query, queryOne } from "@booking/shared";
import { PaymentStatus, PaymentGateway } from "../../types";
import { trackError } from "../../utils/metrics";
import { requestContext } from "../../context/requestContext";
import logger from "../../utils/logger";

export interface Payment {
  id: string;
  booking_id: string;
  tenant_id: string;
  guest_user_id: string;
  gateway: PaymentGateway;
  transaction_id?: string;
  amount_ngn: number;
  status: PaymentStatus;
  channel?: string;
  paid_at?: Date;
  refunded_at?: Date;
  idempotency_key: string;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentSummary {
  id: string;
  booking_id: string;
  gateway: PaymentGateway;
  transaction_id: string | null;
  amount_ngn: string;
  status: PaymentStatus;
  channel: string | null;
  paid_at: string | null;
  created_at: string;
  booking_ref: string;
  check_in: string;
  check_out: string;
  receipt_url: string | null;
  guest_first_name: string | null;
  guest_last_name: string | null;
  guest_user_type: string;
  guest_email: string;
  guest_profile_image: string | null;
  room_type_name: string;
  room_type_images: string[];
  tenant_name: string;
}

function ctx() {
  return requestContext.get() ?? {};
}

export const paymentRepository = {
  async create(
    data: {
      bookingId: string;
      tenantId: string;
      guestUserId: string;
      gateway: PaymentGateway;
      transactionId?: string;
      amountNgn: number;
      idempotencyKey: string;
      metadata?: Record<string, unknown>;
    },
    client?: PoolClient,
  ): Promise<Payment> {
    const sql = `
      INSERT INTO payments (booking_id, tenant_id, guest_user_id, gateway, transaction_id, amount_ngn, idempotency_key, metadata)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
      RETURNING *`;
    const params = [
      data.bookingId,
      data.tenantId,
      data.guestUserId,
      data.gateway,
      data.transactionId ?? null,
      data.amountNgn,
      data.idempotencyKey,
      JSON.stringify(data.metadata ?? {}),
    ];

    try {
      const row = client
        ? ((await client.query(sql, params)).rows[0] as Payment)
        : (await queryOne<Payment>(sql, params))!;

      logger.info("payment_repository_create", {
        event: "payment_repository_create",
        paymentId: row.id,
        bookingId: data.bookingId,
        gateway: data.gateway,
        ...ctx(),
      });

      return row;
    } catch (err) {
      trackError("payment_create_failed", "payment_repository", "high");
      logger.error("payment_repository_create_failed", {
        event: "payment_repository_create_failed",
        bookingId: data.bookingId,
        gateway: data.gateway,
        error: (err as Error).message,
        ...ctx(),
      });
      throw err;
    }
  },

  async findByIdempotencyKey(key: string): Promise<Payment | null> {
    try {
      return await queryOne<Payment>(
        `SELECT * FROM payments WHERE idempotency_key = $1`,
        [key],
      );
    } catch (err) {
      trackError("payment_find_failed", "payment_repository", "medium");
      throw err;
    }
  },

  async findByTransactionId(transactionId: string): Promise<Payment | null> {
    try {
      return await queryOne<Payment>(
        `SELECT * FROM payments WHERE transaction_id = $1`,
        [transactionId],
      );
    } catch (err) {
      trackError("payment_find_failed", "payment_repository", "medium");
      throw err;
    }
  },

  async findByBookingId(bookingId: string): Promise<Payment | null> {
    try {
      return await queryOne<Payment>(
        `SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [bookingId],
      );
    } catch (err) {
      trackError("payment_find_failed", "payment_repository", "medium");
      throw err;
    }
  },

  async updateStatus(
    data: {
      id: string;
      status: PaymentStatus;
      transactionId?: string;
      channel?: string;
      paidAt?: Date;
      refundedAt?: Date;
      metadata?: Record<string, unknown>;
    },
    client?: PoolClient,
  ): Promise<Payment | null> {
    const fields: string[] = ["status = $1", "updated_at = now()"];
    const values: unknown[] = [data.status];
    let idx = 2;

    if (data.transactionId !== undefined) {
      fields.push(`transaction_id = $${idx++}`);
      values.push(data.transactionId);
    }
    if (data.channel !== undefined) {
      fields.push(`channel = $${idx++}`);
      values.push(data.channel);
    }
    if (data.paidAt !== undefined) {
      fields.push(`paid_at = $${idx++}`);
      values.push(data.paidAt);
    }
    if (data.refundedAt !== undefined) {
      fields.push(`refunded_at = $${idx++}`);
      values.push(data.refundedAt);
    }
    if (data.metadata !== undefined) {
      fields.push(`metadata = metadata || $${idx++}::jsonb`);
      values.push(JSON.stringify(data.metadata));
    }

    values.push(data.id);
    const sql = `UPDATE payments SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`;

    try {
      const row = client
        ? (((await client.query(sql, values)).rows[0] as Payment | null) ??
          null)
        : await queryOne<Payment>(sql, values);

      logger.info("payment_repository_status_updated", {
        event: "payment_repository_status_updated",
        paymentId: data.id,
        status: data.status,
        ...ctx(),
      });

      return row;
    } catch (err) {
      trackError("payment_update_failed", "payment_repository", "high");
      logger.error("payment_repository_update_failed", {
        event: "payment_repository_update_failed",
        paymentId: data.id,
        status: data.status,
        error: (err as Error).message,
        ...ctx(),
      });
      throw err;
    }
  },

  async listByTenant(
    tenantId: string,
    page = 1,
    limit = 20,
  ): Promise<PaymentSummary[]> {
    const offset = (page - 1) * limit;
    return query<PaymentSummary>(
      `SELECT
       p.id,
       p.booking_id,
       p.gateway,
       p.transaction_id,
       p.amount_ngn,
       p.status,
       p.channel,
       p.paid_at,
       p.created_at,
       b.booking_ref,
       b.check_in,
       b.check_out,
       b.receipt_url,
       u.first_name AS guest_first_name,
       u.last_name  AS guest_last_name, 
       u.user_type  AS guest_user_type, 
       u.email  AS guest_email,
       u.profile_image AS guest_profile_image,
       rt.name AS room_type_name,
       rt.images AS room_type_images
     FROM payments p
     JOIN bookings   b  ON b.id  = p.booking_id
     JOIN room_types rt ON rt.id = b.room_type_id
     JOIN users      u  ON u.id  = p.guest_user_id
     WHERE p.tenant_id = $1
     ORDER BY p.created_at DESC
     LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset],
    );
  },

  // Atomic: one query, all status counts + month-over-month volume growth.
  async getStatsForTenant(tenantId: string): Promise<PaymentStats> {
    const row = await queryOne<{
      success_count: string;
      failed_count: string;
      pending_count: string;
      refunded_count: string;
      current_month_volume: number;
      previous_month_volume: number;
    }>(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'success')  AS success_count,
         COUNT(*) FILTER (WHERE status = 'failed')   AS failed_count,
         COUNT(*) FILTER (WHERE status = 'pending')  AS pending_count,
         COUNT(*) FILTER (WHERE status = 'refunded') AS refunded_count,
         COALESCE(SUM(amount_ngn) FILTER (
           WHERE status = 'success' AND created_at >= date_trunc('month', now())
         ), 0) AS current_month_volume,
         COALESCE(SUM(amount_ngn) FILTER (
           WHERE status = 'success'
             AND created_at >= date_trunc('month', now()) - interval '1 month'
             AND created_at <  date_trunc('month', now())
         ), 0) AS previous_month_volume
       FROM payments
       WHERE tenant_id = $1`,
      [tenantId],
    );

    const current = Number(row?.current_month_volume ?? 0);
    const previous = Number(row?.previous_month_volume ?? 0);
    const growthPct =
      previous === 0
        ? current > 0
          ? 100
          : 0
        : ((current - previous) / previous) * 100;

    return {
      successCount: Number(row?.success_count ?? 0),
      failedCount: Number(row?.failed_count ?? 0),
      pendingCount: Number(row?.pending_count ?? 0),
      refundedCount: Number(row?.refunded_count ?? 0),
      currentMonthVolumeNgn: current,
      previousMonthVolumeNgn: previous,
      volumeGrowthPct: Math.round(growthPct * 10) / 10,
    };
  },

  async listAllForAdmin(page = 1, limit = 20): Promise<PaymentSummary[]> {
    const offset = (page - 1) * limit;
    return query<PaymentSummary>(
      `SELECT
       p.id, p.booking_id, p.gateway, p.transaction_id, p.amount_ngn, p.status, p.channel, p.paid_at, p.created_at,
       t.name AS tenant_name,
       b.booking_ref, b.check_in, b.check_out, b.receipt_url,
       u.first_name AS guest_first_name, u.last_name AS guest_last_name, u.email AS guest_email,
       rt.name AS room_type_name
     FROM payments p
     JOIN tenants    t  ON t.id  = p.tenant_id
     JOIN bookings   b  ON b.id  = p.booking_id
     JOIN users      u  ON u.id  = b.guest_user_id
     JOIN room_types rt ON rt.id = b.room_type_id
     ORDER BY p.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
  },
  async getPlatformVolume(): Promise<{
    currentMonthNgn: number;
    previousMonthNgn: number;
    growthPct: number;
  }> {
    const row = await queryOne<{
      current_month: number;
      previous_month: number;
    }>(
      `SELECT
       COALESCE(SUM(amount_ngn) FILTER (
         WHERE status = 'success' AND created_at >= date_trunc('month', now())
       ), 0) AS current_month,
       COALESCE(SUM(amount_ngn) FILTER (
         WHERE status = 'success'
           AND created_at >= date_trunc('month', now()) - interval '1 month'
           AND created_at <  date_trunc('month', now())
       ), 0) AS previous_month
     FROM payments`,
    );
    const current = Number(row?.current_month ?? 0);
    const previous = Number(row?.previous_month ?? 0);
    const growthPct =
      previous === 0
        ? current > 0
          ? 100
          : 0
        : ((current - previous) / previous) * 100;
    return {
      currentMonthNgn: current,
      previousMonthNgn: previous,
      growthPct: Math.round(growthPct * 10) / 10,
    };
  },
  async countAllForAdmin(): Promise<number> {
    const row = await queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM payments WHERE status = 'success'`,
    );
    return parseInt(row?.count ?? "0", 10);
  },
};

export interface PaymentStats {
  successCount: number;
  failedCount: number;
  pendingCount: number;
  refundedCount: number;
  currentMonthVolumeNgn: number;
  previousMonthVolumeNgn: number;
  volumeGrowthPct: number;
}
// user_type
