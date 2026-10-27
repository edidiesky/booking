import { PoolClient } from "pg";

function generateBookingRef(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `BK-${ts}-${rand}`;
}

/** All dates are plain YYYY-MM-DD strings; stay arithmetic is done in UTC. */
export function eachDate(checkIn: string, checkOut: string): string[] {
  const out: string[] = [];
  const cur = new Date(`${checkIn}T00:00:00.000Z`);
  const end = new Date(`${checkOut}T00:00:00.000Z`);
  while (cur < end) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

// bookings.check_in/out are timestamptz (monolith migration 041). Pin to UTC midnight so a
// non-UTC session TimeZone can never shift the stay by a day.
const AS_UTC_MIDNIGHT = (p: string) => `(${p}::date)::timestamp AT TIME ZONE 'UTC'`;

export const bookingRepository = {
  /**
   * Legacy-compatible availability: net = available_count - SUM(active locks),
   * exactly like the monolith's availabilityRepository.isAvailable. The row lock
   * serialises concurrent reservations of the same room type/dates.
   * Reserving holds inventory with a lock row; the calendar is only decremented
   * when the booking is confirmed (otherwise inventory is counted twice).
   */
  async hasAvailability(
    client: PoolClient,
    roomTypeId: string,
    checkIn: string,
    checkOut: string,
    roomsCount: number,
  ): Promise<boolean> {
    const nights = eachDate(checkIn, checkOut);
    if (nights.length === 0) return false; // never "available" for an empty stay

    // Statement 1: take the row locks. Concurrent reservations of the same room type/dates queue here.
    await client.query(
      `SELECT id FROM availability_calendar
        WHERE room_type_id = $1 AND date >= $2::date AND date < $3::date
        ORDER BY date
        FOR UPDATE`,
      [roomTypeId, checkIn, checkOut],
    );

    // Statement 2: compute availability. It MUST be a separate statement. In READ COMMITTED the
    // booking_locks subquery uses the snapshot of the statement it is in; if the lock wait and the
    // count share one statement, a waiter counts locks from BEFORE the winner committed and both
    // reserve the last room (overbooking - reproduced by the concurrency e2e test).
    const result = await client.query<{ date: string; net: number }>(
      `SELECT ac.date::text AS date,
              ac.available_count - COALESCE(
                (SELECT SUM(bl.rooms_held)
                   FROM booking_locks bl
                  WHERE bl.room_type_id = ac.room_type_id
                    AND bl.expires_at > now()
                    AND bl.check_in  < ac.date + INTERVAL '1 day'
                    AND bl.check_out > ac.date), 0)::int AS net
         FROM availability_calendar ac
        WHERE ac.room_type_id = $1
          AND ac.date >= $2::date
          AND ac.date <  $3::date
          AND ac.is_blocked = false
        ORDER BY ac.date`,
      [roomTypeId, checkIn, checkOut],
    );

    const net = new Map(result.rows.map((r) => [r.date, Number(r.net)]));
    return nights.every((n) => (net.get(n) ?? -1) >= roomsCount);
  },

  async create(
    client: PoolClient,
    data: {
      tenantId: string; propertyId: string; roomTypeId: string; guestUserId: string;
      checkIn: string; checkOut: string; roomsCount: number; guestCount: number;
      totalAmountNgn: number; platformFeeNgn: number; hostPayoutNgn: number;
      specialRequests?: string; metadata?: Record<string, unknown>;
    },
  ) {
    const result = await client.query(
      `INSERT INTO bookings (
         booking_ref, tenant_id, property_id, room_type_id, guest_user_id,
         rooms_count, check_in, check_out, guest_count,
         total_amount_ngn, platform_fee_ngn, host_payout_ngn,
         special_requests, metadata, status
       ) VALUES (
         $1, $2, $3, $4, $5,
         $6, ${AS_UTC_MIDNIGHT("$7")}, ${AS_UTC_MIDNIGHT("$8")}, $9,
         $10, $11, $12,
         $13, $14::jsonb, 'pending_payment'
       ) RETURNING *`,
      [
        generateBookingRef(), data.tenantId, data.propertyId, data.roomTypeId, data.guestUserId,
        data.roomsCount, data.checkIn, data.checkOut, data.guestCount,
        data.totalAmountNgn, data.platformFeeNgn, data.hostPayoutNgn,
        data.specialRequests ?? null, JSON.stringify(data.metadata ?? {}),
      ],
    );
    return result.rows[0];
  },

  async createLock(
    client: PoolClient, roomTypeId: string, checkIn: string, checkOut: string,
    roomsHeld: number, sessionId: string,
  ) {
    await client.query(
      `INSERT INTO booking_locks (room_type_id, check_in, check_out, rooms_held, session_id, expires_at)
       VALUES ($1, $2::date, $3::date, $4, $5, now() + interval '30 minutes')`,
      [roomTypeId, checkIn, checkOut, roomsHeld, sessionId],
    );
  },

  /** Frees every lock that belongs to the booking (ours: booking id; legacy: metadata.sessionId). */
  async deleteLocks(client: PoolClient, sessionIds: string[]) {
    await client.query(`DELETE FROM booking_locks WHERE session_id = ANY($1::text[])`, [sessionIds]);
  },

  /**
   * RLS-safe lookup with no tenant context, via the monolith's SECURITY DEFINER
   * function (migration 074). A plain SELECT returns nothing under FORCE RLS.
   */
  async findById(client: Pick<PoolClient, "query">, bookingId: string) {
    const r = await client.query(`SELECT * FROM public.booking_get_by_id($1)`, [bookingId]);
    return r.rows[0] ?? null;
  },

  /** Row lock on the booking. MUST run after set_config('app.current_tenant_id'). */
  async findByIdForUpdate(client: PoolClient, bookingId: string) {
    const r = await client.query(`SELECT * FROM bookings WHERE id = $1 FOR UPDATE`, [bookingId]);
    return r.rows[0] ?? null;
  },

  async cancel(client: PoolClient, bookingId: string, reason: string) {
    await client.query(
      `UPDATE bookings
          SET status = 'cancelled', cancelled_at = now(), cancellation_reason = $2, updated_at = now()
        WHERE id = $1 AND status = 'pending_payment'`,
      [bookingId, reason],
    );
  },

  async confirm(client: PoolClient, bookingId: string) {
    const r = await client.query(
      `UPDATE bookings SET status = 'confirmed', updated_at = now()
        WHERE id = $1 AND status = 'pending_payment' RETURNING *`,
      [bookingId],
    );
    return r.rows[0] ?? null;
  },

  /** Same as the monolith's confirm: the calendar is decremented at confirmation. */
  async decrementAvailability(
    client: PoolClient, roomTypeId: string, checkIn: string, checkOut: string, rooms: number,
  ) {
    await client.query(
      `UPDATE availability_calendar
          SET available_count = available_count - $1, updated_at = now()
        WHERE room_type_id = $2 AND date >= $3::date AND date < $4::date`,
      [rooms, roomTypeId, checkIn, checkOut],
    );
  },

  /** Mirrors the monolith: one escrow row per booking (idempotent). */
  async ensureEscrow(client: PoolClient, b: Record<string, any>) {
    await client.query(
      `INSERT INTO escrow_ledger (booking_id, tenant_id, amount_ngn, platform_fee_ngn, host_payout_ngn)
       VALUES ($1, $2, $3, $4, $5) ON CONFLICT (booking_id) DO NOTHING`,
      [b.id, b.tenant_id, b.total_amount_ngn, b.platform_fee_ngn, b.host_payout_ngn],
    );
  },

  async findIdempotent(client: PoolClient, key: string): Promise<string | null> {
    const r = await client.query<{ booking_id: string }>(
      `SELECT booking_id FROM booking_reserve_idempotency WHERE idempotency_key = $1`, [key],
    );
    return r.rows[0]?.booking_id ?? null;
  },

  async saveIdempotent(client: PoolClient, key: string, bookingId: string) {
    await client.query(
      `INSERT INTO booking_reserve_idempotency (idempotency_key, booking_id) VALUES ($1, $2)`,
      [key, bookingId],
    );
  },
};
