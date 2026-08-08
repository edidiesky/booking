import { PoolClient } from "pg";
import { query, queryOne } from "@booking/shared";
import { BookingStatus } from "../../types";
import { requestContext } from "../../context/requestContext";
import { trackError } from "../../utils/metrics";
import logger from "../../utils/logger";

export interface Booking {
  id: string;
  booking_ref: string;
  tenant_id: string;
  property_id: string;
  room_type_id: string;
  guest_user_id: string;
  rooms_count: number;
  check_in: string;
  check_out: string;
  nights: number;
  guest_count: number;
  total_amount_ngn: number;
  platform_fee_ngn: number;
  host_payout_ngn: number;
  status: BookingStatus;
  cancellation_reason?: string;
  cancelled_at?: Date;
  special_requests?: string;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
  receipt_url: string;
  room_type_images?: string[];
  // Joined columns from listByTenant/listByGuest (property_name, etc. via
  // `AS` aliases in the SQL), declared here with their real names, not the
  // camelCase versions that were silently always undefined before.
  property_name?: string;
  property_city?: string;
  room_type_name?: string;
  room_type_quantity?: number;
  room_types_image?: string[];
  guest_first_name?: string;
  guest_last_name?: string;
  tenant_name?: string;
}

function generateBookingRef(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `BK-${ts}-${rand}`;
}

function ctx() {
  return requestContext.get() ?? {};
}

export interface BookingStats {
  confirmedCount: number;
  checkedInCount: number;
  checkedOutCount: number;
  cancelledCount: number;
  pendingCount: number;
  currentMonthRevenueNgn: number;
  previousMonthRevenueNgn: number;
  revenueGrowthPct: number;
}

export const bookingRepository = {
  async create(
    data: {
      tenantId: string;
      propertyId: string;
      roomTypeId: string;
      guestUserId: string;
      roomsCount: number;
      checkIn: string;
      checkOut: string;
      guestCount: number;
      totalAmountNgn: number;
      platformFeeNgn: number;
      hostPayoutNgn: number;
      specialRequests?: string;
      metadata?: Record<string, unknown>;
    },
    client: PoolClient,
  ): Promise<Booking> {
    const bookingRef = generateBookingRef();
    try {
      const row = (
        await client.query(
          `INSERT INTO bookings
           (booking_ref, tenant_id, property_id, room_type_id, guest_user_id,
            rooms_count, check_in, check_out, guest_count,
            total_amount_ngn, platform_fee_ngn, host_payout_ngn,
            special_requests, metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7::date,$8::date,$9,$10,$11,$12,$13,$14::jsonb)
         RETURNING *`,
          [
            bookingRef,
            data.tenantId,
            data.propertyId,
            data.roomTypeId,
            data.guestUserId,
            data.roomsCount,
            data.checkIn,
            data.checkOut,
            data.guestCount,
            data.totalAmountNgn,
            data.platformFeeNgn,
            data.hostPayoutNgn,
            data.specialRequests ?? null,
            JSON.stringify(data.metadata ?? {}),
          ],
        )
      ).rows[0] as Booking;

      logger.info("booking_repository_create", {
        event: "booking_repository_create",
        bookingId: row.id,
        bookingRef: row.booking_ref,
        tenantId: data.tenantId,
        ...ctx(),
      });

      return row;
    } catch (err) {
      trackError("booking_create_failed", "booking_repository", "high");
      logger.error("booking_repository_create_failed", {
        event: "booking_repository_create_failed",
        tenantId: data.tenantId,
        error: (err as Error).message,
        ...ctx(),
      });
      throw err;
    }
  },
  async updateReceiptUrl(id: string, receiptUrl: string): Promise<void> {
    await query(
      `UPDATE bookings SET receipt_url = $1, updated_at = now() WHERE id = $2`,
      [receiptUrl, id],
    );
  },

  async findById(id: string): Promise<Booking | null> {
    try {
      return await queryOne<Booking>(`SELECT * FROM bookings WHERE id = $1`, [
        id,
      ]);
    } catch (err) {
      trackError("booking_find_failed", "booking_repository", "medium");
      logger.error("booking_repository_find_by_id_failed", {
        event: "booking_repository_find_by_id_failed",
        id,
        error: (err as Error).message,
        ...ctx(),
      });
      throw err;
    }
  },

  async findByRef(ref: string): Promise<Booking | null> {
    try {
      return await queryOne<Booking>(
        `SELECT * FROM bookings WHERE booking_ref = $1`,
        [ref],
      );
    } catch (err) {
      trackError("booking_find_failed", "booking_repository", "medium");
      throw err;
    }
  },

  async updateStatus(
    id: string,
    status: BookingStatus,
    extra?: Partial<Pick<Booking, "cancellation_reason" | "cancelled_at">>,
    client?: PoolClient,
  ): Promise<Booking | null> {
    const fields = ["status = $1", "updated_at = now()"];
    const values: unknown[] = [status];
    let idx = 2;

    if (extra?.cancellation_reason) {
      fields.push(`cancellation_reason = $${idx++}`);
      values.push(extra.cancellation_reason);
    }
    if (extra?.cancelled_at) {
      fields.push(`cancelled_at = $${idx++}`);
      values.push(extra.cancelled_at);
    }

    values.push(id);
    const sql = `UPDATE bookings SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`;

    try {
      const row = client
        ? (((await client.query(sql, values)).rows[0] as Booking | null) ??
          null)
        : await queryOne<Booking>(sql, values);

      logger.info("booking_repository_status_updated", {
        event: "booking_repository_status_updated",
        bookingId: id,
        status,
        ...ctx(),
      });

      return row;
    } catch (err) {
      trackError("booking_update_failed", "booking_repository", "high");
      logger.error("booking_repository_status_update_failed", {
        event: "booking_repository_status_update_failed",
        bookingId: id,
        status,
        error: (err as Error).message,
        ...ctx(),
      });
      throw err;
    }
  },

  async listByGuest(
    guestUserId: string,
    page = 1,
    limit = 20,
  ): Promise<Booking[]> {
    const offset = (page - 1) * limit;
    try {
      return await query<Booking>(
        `SELECT b.*, p.name AS property_name, rt.name AS room_type_name,
         rt.images AS room_type_images
         FROM bookings b
         JOIN properties p  ON p.id  = b.property_id
         JOIN room_types rt ON rt.id = b.room_type_id
         WHERE b.guest_user_id = $1
         ORDER BY b.created_at DESC LIMIT $2 OFFSET $3`,
        [guestUserId, limit, offset],
      );
    } catch (err) {
      trackError("booking_list_failed", "booking_repository", "medium");
      throw err;
    }
  },

  async listByTenant(
    tenantId: string,
    opts: { status?: BookingStatus; page?: number; limit?: number } = {},
  ): Promise<Booking[]> {
    const { status, page = 1, limit = 20 } = opts;
    const offset = (page - 1) * limit;
    const params: unknown[] = [tenantId, limit, offset];
    const where = status ? `AND b.status = $${params.push(status)}` : "";

    try {
      return await query<Booking>(
        `SELECT b.*, u.first_name AS guest_first_name, u.last_name AS guest_last_name,
                u.email AS guest_email, rt.images AS room_types_image, p.name AS property_name,
                rt.name AS room_type_name, rt.quantity AS room_type_quantity
         FROM bookings b
         JOIN users      u  ON u.id  = b.guest_user_id
         JOIN properties p  ON p.id  = b.property_id
         JOIN room_types rt ON rt.id = b.room_type_id
         WHERE b.tenant_id = $1 ${where}
         ORDER BY b.created_at DESC LIMIT $2 OFFSET $3`,
        params,
      );
    } catch (err) {
      trackError("booking_list_failed", "booking_repository", "medium");
      throw err;
    }
  },

  async countByTenant(
    tenantId: string,
    status?: BookingStatus,
  ): Promise<number> {
    const params: unknown[] = [tenantId];
    const where = status ? `AND status = $${params.push(status)}` : "";
    try {
      const row = await queryOne<{ count: string }>(
        `SELECT COUNT(*) AS count FROM bookings WHERE tenant_id = $1 ${where}`,
        params,
      );
      return parseInt(row?.count ?? "0", 10);
    } catch (err) {
      trackError("booking_count_failed", "booking_repository", "low");
      throw err;
    }
  },

  // Atomic: one query, all status counts + month-over-month revenue growth
  // in a single consistent snapshot.
  async getStatsForTenant(tenantId: string): Promise<BookingStats> {
    const row = await queryOne<{
      confirmed_count: string;
      checked_in_count: string;
      checked_out_count: string;
      cancelled_count: string;
      pending_count: string;
      current_month_revenue: number;
      previous_month_revenue: number;
    }>(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'confirmed')        AS confirmed_count,
         COUNT(*) FILTER (WHERE status = 'checked_in')       AS checked_in_count,
         COUNT(*) FILTER (WHERE status = 'checked_out')      AS checked_out_count,
         COUNT(*) FILTER (WHERE status = 'cancelled')        AS cancelled_count,
         COUNT(*) FILTER (WHERE status = 'pending_payment')  AS pending_count,
         COALESCE(SUM(total_amount_ngn) FILTER (
           WHERE status IN ('confirmed', 'checked_in', 'checked_out')
             AND created_at >= date_trunc('month', now())
         ), 0) AS current_month_revenue,
         COALESCE(SUM(total_amount_ngn) FILTER (
           WHERE status IN ('confirmed', 'checked_in', 'checked_out')
             AND created_at >= date_trunc('month', now()) - interval '1 month'
             AND created_at <  date_trunc('month', now())
         ), 0) AS previous_month_revenue
       FROM bookings
       WHERE tenant_id = $1`,
      [tenantId],
    );

    const current = Number(row?.current_month_revenue ?? 0);
    const previous = Number(row?.previous_month_revenue ?? 0);
    const growthPct =
      previous === 0
        ? current > 0
          ? 100
          : 0
        : ((current - previous) / previous) * 100;

    return {
      confirmedCount: Number(row?.confirmed_count ?? 0),
      checkedInCount: Number(row?.checked_in_count ?? 0),
      checkedOutCount: Number(row?.checked_out_count ?? 0),
      cancelledCount: Number(row?.cancelled_count ?? 0),
      pendingCount: Number(row?.pending_count ?? 0),
      currentMonthRevenueNgn: current,
      previousMonthRevenueNgn: previous,
      revenueGrowthPct: Math.round(growthPct * 10) / 10,
    };
  },

  async listAllForAdmin(
    opts: { status?: BookingStatus; page?: number; limit?: number } = {},
  ): Promise<Booking[]> {
    const { status, page = 1, limit = 20 } = opts;
    const offset = (page - 1) * limit;
    const params: unknown[] = [limit, offset];
    const whereClause = status
      ? `WHERE b.status = $${params.push(status)}`
      : "";

    return query<Booking>(
      `SELECT b.*, t.name AS tenant_name,
            u.first_name AS guest_first_name, u.last_name AS guest_last_name, u.email AS guest_email,
            p.name AS property_name, rt.name AS room_type_name
     FROM bookings b
     JOIN tenants    t  ON t.id  = b.tenant_id
     JOIN users      u  ON u.id  = b.guest_user_id
     JOIN properties p  ON p.id  = b.property_id
     JOIN room_types rt ON rt.id = b.room_type_id
     ${whereClause}
     ORDER BY b.created_at DESC LIMIT $1 OFFSET $2`,
      params,
    );
  },

  async listForDateRange(
    startDate: string,
    endDate: string,
  ): Promise<Booking[]> {
    return query<Booking>(
      `SELECT b.*, t.name AS tenant_name,
            u.first_name AS guest_first_name, u.last_name AS guest_last_name,
            p.name AS property_name, rt.name AS room_type_name
     FROM bookings b
     JOIN tenants    t  ON t.id  = b.tenant_id
     JOIN users      u  ON u.id  = b.guest_user_id
     JOIN properties p  ON p.id  = b.property_id
     JOIN room_types rt ON rt.id = b.room_type_id
     WHERE b.check_in <= $2 AND b.check_out >= $1
       AND b.status NOT IN ('cancelled')
     ORDER BY b.check_in ASC`,
      [startDate, endDate],
    );
  },

  async getRevenueTrend(
    tenantId: string,
    days: number,
  ): Promise<{ day: string; hostPayout: number; platformFee: number }[]> {
    const rows = await query<{
      day: string;
      host_payout: string;
      platform_fee: string;
    }>(
      `WITH days AS (
       SELECT generate_series(
         date_trunc('day', now() - ($2 || ' days')::interval),
         date_trunc('day', now()),
         '1 day'::interval
       ) AS day
     )
     SELECT days.day,
            COALESCE(SUM(b.host_payout_ngn), 0) AS host_payout,
            COALESCE(SUM(b.platform_fee_ngn), 0) AS platform_fee
     FROM days
     LEFT JOIN bookings b
       ON date_trunc('day', b.created_at) = days.day
       AND b.tenant_id = $1
       AND b.status IN ('confirmed', 'checked_in', 'checked_out')
     GROUP BY days.day
     ORDER BY days.day ASC`,
      [tenantId, days],
    );
    return rows.map((r) => ({
      day: r.day,
      hostPayout: Number(r.host_payout),
      platformFee: Number(r.platform_fee),
    }));
  },
  async getPlatformStats(): Promise<
    Omit<
      BookingStats,
      "revenueGrowthPct" | "currentMonthRevenueNgn" | "previousMonthRevenueNgn"
    >
  > {
    const row = await queryOne<{
      confirmed_count: string;
      checked_in_count: string;
      checked_out_count: string;
      cancelled_count: string;
      pending_count: string;
    }>(
      `SELECT
       COUNT(*) FILTER (WHERE status = 'confirmed')       AS confirmed_count,
       COUNT(*) FILTER (WHERE status = 'checked_in')      AS checked_in_count,
       COUNT(*) FILTER (WHERE status = 'checked_out')     AS checked_out_count,
       COUNT(*) FILTER (WHERE status = 'cancelled')       AS cancelled_count,
       COUNT(*) FILTER (WHERE status = 'pending_payment') AS pending_count
     FROM bookings`,
    );
    return {
      confirmedCount: Number(row?.confirmed_count ?? 0),
      checkedInCount: Number(row?.checked_in_count ?? 0),
      checkedOutCount: Number(row?.checked_out_count ?? 0),
      cancelledCount: Number(row?.cancelled_count ?? 0),
      pendingCount: Number(row?.pending_count ?? 0),
    };
  },

  async getRevenueSplitPlatformWide(): Promise<{
    hostPayoutNgn: number;
    platformFeeNgn: number;
  }> {
    const row = await queryOne<{ host_payout: number; platform_fee: number }>(
      `SELECT
       COALESCE(SUM(host_payout_ngn), 0)  AS host_payout,
       COALESCE(SUM(platform_fee_ngn), 0) AS platform_fee
     FROM bookings
     WHERE status IN ('confirmed', 'checked_in', 'checked_out')
       AND created_at >= date_trunc('month', now())`,
    );
    return {
      hostPayoutNgn: Number(row?.host_payout ?? 0),
      platformFeeNgn: Number(row?.platform_fee ?? 0),
    };
  },

  async getRevenueTrendPlatformWide(
    days: number,
  ): Promise<{ day: string; hostPayout: number; platformFee: number }[]> {
    const rows = await query<{
      day: string;
      host_payout: string;
      platform_fee: string;
    }>(
      `WITH days AS (
       SELECT generate_series(
         date_trunc('day', now() - ($1 || ' days')::interval),
         date_trunc('day', now()),
         '1 day'::interval
       ) AS day
     )
     SELECT days.day,
            COALESCE(SUM(b.host_payout_ngn), 0)  AS host_payout,
            COALESCE(SUM(b.platform_fee_ngn), 0) AS platform_fee
     FROM days
     LEFT JOIN bookings b
       ON date_trunc('day', b.created_at) = days.day
       AND b.status IN ('confirmed', 'checked_in', 'checked_out')
     GROUP BY days.day
     ORDER BY days.day ASC`,
      [days],
    );
    return rows.map((r) => ({
      day: r.day,
      hostPayout: Number(r.host_payout),
      platformFee: Number(r.platform_fee),
    }));
  },
};
