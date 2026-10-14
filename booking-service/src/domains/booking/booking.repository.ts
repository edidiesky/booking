import { Pool, PoolClient } from "pg";

export const bookingRepository = {
  /**
   * Lock nights FOR UPDATE and require full coverage + available=true.
   * roomsCount > 1 requires that many free rows per night (simple model:
   * one row per room unit per date; count free rows per date).
   */
  async lockAvailability(
    client: PoolClient,
    roomTypeId: string,
    checkIn: string,
    checkOut: string,
    roomsCount: number,
  ) {
    const result = await client.query<{ id: string; date: string }>(
      `SELECT id, date::text AS date
       FROM availability_calendar
       WHERE room_type_id = $1
         AND date >= $2::date
         AND date < $3::date
         AND available = true
       FOR UPDATE`,
      [roomTypeId, checkIn, checkOut],
    );

    const byDate = new Map<string, string[]>();
    for (const row of result.rows) {
      const list = byDate.get(row.date) ?? [];
      list.push(row.id);
      byDate.set(row.date, list);
    }

    const nights = eachDate(checkIn, checkOut);
    const lockedIds: string[] = [];
    for (const night of nights) {
      const ids = byDate.get(night) ?? [];
      if (ids.length < roomsCount) {
        return { ok: false as const, lockedIds: [] as string[] };
      }
      lockedIds.push(...ids.slice(0, roomsCount));
    }
    return { ok: true as const, lockedIds };
  },

  async markUnavailable(client: PoolClient, ids: string[]) {
    if (ids.length === 0) return;
    await client.query(
      `UPDATE availability_calendar SET available = false WHERE id = ANY($1::uuid[])`,
      [ids],
    );
  },

  async markAvailableForBooking(client: PoolClient, bookingId: string) {
    await client.query(
      `UPDATE availability_calendar ac
       SET available = true
       FROM booking_locks bl
       WHERE bl.booking_id = $1
         AND ac.room_type_id = bl.room_type_id
         AND ac.date >= bl.check_in
         AND ac.date < bl.check_out
         AND ac.available = false`,
      [bookingId],
    );
  },

  async create(
    client: PoolClient,
    data: {
      tenantId: string;
      roomTypeId: string;
      guestUserId: string;
      checkIn: string;
      checkOut: string;
      roomsCount: number;
      totalAmountNgn: number;
    },
  ) {
    const result = await client.query(
      `INSERT INTO bookings (
         tenant_id, room_type_id, guest_user_id, check_in, check_out,
         rooms_count, total_amount_ngn, status
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,'pending_payment')
       RETURNING *`,
      [
        data.tenantId,
        data.roomTypeId,
        data.guestUserId,
        data.checkIn,
        data.checkOut,
        data.roomsCount,
        data.totalAmountNgn,
      ],
    );
    return result.rows[0];
  },

  async createLock(
    client: PoolClient,
    bookingId: string,
    roomTypeId: string,
    checkIn: string,
    checkOut: string,
  ) {
    await client.query(
      `INSERT INTO booking_locks (booking_id, room_type_id, check_in, check_out, expires_at)
       VALUES ($1, $2, $3, $4, now() + interval '15 minutes')`,
      [bookingId, roomTypeId, checkIn, checkOut],
    );
  },

  async findById(pool: Pool, bookingId: string) {
    const result = await pool.query(`SELECT * FROM bookings WHERE id = $1`, [
      bookingId,
    ]);
    return result.rows[0] ?? null;
  },

  async cancel(client: PoolClient, bookingId: string) {
    await client.query(
      `UPDATE bookings SET status = 'cancelled' WHERE id = $1 AND status = 'pending_payment'`,
      [bookingId],
    );
    await this.markAvailableForBooking(client, bookingId);
    await client.query(`DELETE FROM booking_locks WHERE booking_id = $1`, [
      bookingId,
    ]);
  },

  async confirm(client: PoolClient, bookingId: string) {
    const result = await client.query(
      `UPDATE bookings SET status = 'confirmed'
       WHERE id = $1 AND status = 'pending_payment'
       RETURNING *`,
      [bookingId],
    );
    return result.rows[0] ?? null;
  },
};

function eachDate(checkIn: string, checkOut: string): string[] {
  const out: string[] = [];
  const cur = new Date(checkIn + "T00:00:00.000Z");
  const end = new Date(checkOut + "T00:00:00.000Z");
  while (cur < end) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}
