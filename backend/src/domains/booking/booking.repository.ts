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
  propertyName?:  string;
  propertyCity?:  string;
  roomTypeName?:  string;
  roomTypeImage?: string;
}

function generateBookingRef(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `BK-${ts}-${rand}`;
}

function ctx() {
  return requestContext.get() ?? {};
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
                u.email AS guest_email, p.images AS property_name, rt.name AS room_type_name
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
};
