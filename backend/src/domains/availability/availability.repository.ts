import { PoolClient } from "pg";
import { availabilityLockCounter, trackError } from "../../utils/metrics";
import { requestContext } from "../../context/requestContext";
import logger from "../../utils/logger";
import { query } from "@booking/shared";

export interface AvailabilitySlot {
  id:                 string;
  room_type_id:       string;
  tenant_id:          string;
  date:               string;
  available_count:    number;
  price_override_ngn: number | null;
  is_blocked:         boolean;
}

export interface BookingLock {
  id:           string;
  room_type_id: string;
  check_in:     string;
  check_out:    string;
  rooms_held:   number;
  session_id:   string;
  expires_at:   string;
}

function ctx() { return requestContext.get() ?? {}; }

export const availabilityRepository = {
async seedCalendar(
  data: {
    roomTypeId: string;
    tenantId:   string;
    startDate:  string;
    endDate:    string;
    totalRooms: number;
  },
  client?: PoolClient,
): Promise<void> {
  const sql = `INSERT INTO availability_calendar (room_type_id, tenant_id, date, available_count)
               SELECT $1, $2, generate_series($3::date, $4::date, '1 day'::interval)::date, $5
               ON CONFLICT (room_type_id, date) DO NOTHING`;
  const params = [data.roomTypeId, data.tenantId, data.startDate, data.endDate, data.totalRooms];
  try {
    if (client) await client.query(sql, params);
    else        await query(sql, params);
    logger.info("availability_calendar_seeded", {
      event: "availability_calendar_seeded",
      roomTypeId: data.roomTypeId,
      startDate: data.startDate,
      endDate: data.endDate,
      ...ctx(),
    });
  } catch (err) {
    trackError("availability_seed_failed", "availability_repository", "medium");
    throw err;
  }
},

  async getAvailability(roomTypeId: string, checkIn: string, checkOut: string): Promise<AvailabilitySlot[]> {
    try {
      return await query<AvailabilitySlot>(
        `SELECT
           ac.*,
           ac.available_count - COALESCE(
             (SELECT SUM(bl.rooms_held)
              FROM booking_locks bl
              WHERE bl.room_type_id = ac.room_type_id
                AND bl.expires_at > now()
                AND bl.check_in  < ac.date + INTERVAL '1 day'
                AND bl.check_out > ac.date), 0
           ) AS available_count
         FROM availability_calendar ac
         WHERE ac.room_type_id = $1
           AND ac.date >= $2::date
           AND ac.date <  $3::date
           AND ac.is_blocked = false
         ORDER BY ac.date`,
        [roomTypeId, checkIn, checkOut]
      );
    } catch (err) {
      trackError("availability_fetch_failed", "availability_repository", "medium");
      throw err;
    }
  },

  async isAvailable(
    roomTypeId:  string,
    checkIn:     string,
    checkOut:    string,
    roomsNeeded: number,
    client:      PoolClient
  ): Promise<boolean> {
    // FOR UPDATE OF ac locks the availability_calendar rows for this room
    // type + date range for the rest of this transaction. Without this, two
    // concurrent requests for the same room type and overlapping dates
    // could both read "1 room available" before either had inserted its
    // booking_locks row (classic check-then-act race), both pass this
    // check, both proceed to acquireLock, double-booking the room. With
    // the lock: the second transaction blocks here until the first commits
    // (making its booking_locks INSERT visible), then re-reads and
    // correctly sees reduced availability. This also correctly handles
    // room types with quantity > 1 (multiple legitimately-overlapping
    // bookings up to capacity), unlike a blanket exclusion constraint
    // would, since it's the actual remaining-capacity count being
    // serialized, not "no overlap at all".
    //
    // `client` is now required, not optional: this row lock only means
    // anything inside the same transaction as the subsequent
    // acquireLock() call, calling this outside withTransaction silently
    // provides zero protection (the lock releases the instant the query
    // auto-commits), so making it optional was itself part of the bug
    // surface, this signature change forces every call site to prove it's
    // transactional.
    const sql = `
      WITH locked_rows AS (
        SELECT
          ac.date,
          ac.available_count - COALESCE(
            (SELECT SUM(bl.rooms_held)
             FROM booking_locks bl
             WHERE bl.room_type_id = ac.room_type_id
               AND bl.expires_at > now()
               AND bl.check_in  < ac.date + INTERVAL '1 day'
               AND bl.check_out > ac.date), 0
          ) AS net_available
        FROM availability_calendar ac
        WHERE ac.room_type_id = $1
          AND ac.date >= $2::date
          AND ac.date <  $3::date
          AND ac.is_blocked = false
        ORDER BY ac.date
        FOR UPDATE OF ac
      )
      SELECT COUNT(*) AS nights_available
      FROM locked_rows
      WHERE net_available >= $4`;

    const params = [roomTypeId, checkIn, checkOut, roomsNeeded];
    try {
      const result = (await client.query(sql, params)).rows[0] as { nights_available: string };

      const nightsNeeded = Math.ceil(
        (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000
      );
      const available = parseInt(result?.nights_available ?? "0", 10) >= nightsNeeded;

      logger.debug("availability_check", {
        event:       "availability_check",
        roomTypeId,
        checkIn,
        checkOut,
        roomsNeeded,
        available,
        ...ctx(),
      });

      return available;
    } catch (err) {
      trackError("availability_check_failed", "availability_repository", "high");
      throw err;
    }
  },

  async acquireLock(data: {
    roomTypeId: string;
    checkIn:    string;
    checkOut:   string;
    roomsHeld:  number;
    sessionId:  string;
  }, client: PoolClient): Promise<BookingLock> {
    try {
      const row = (await client.query(
        `INSERT INTO booking_locks (room_type_id, check_in, check_out, rooms_held, session_id, expires_at)
         VALUES ($1, $2::date, $3::date, $4, $5, now() + INTERVAL '15 minutes')
         RETURNING *`,
        [data.roomTypeId, data.checkIn, data.checkOut, data.roomsHeld, data.sessionId]
      )).rows[0] as BookingLock;

      availabilityLockCounter.inc({ action: "acquired" });
      logger.info("booking_lock_acquired", {
        event:      "booking_lock_acquired",
        roomTypeId: data.roomTypeId,
        sessionId:  data.sessionId,
        ...ctx(),
      });

      return row;
    } catch (err) {
      trackError("lock_acquire_failed", "availability_repository", "high");
      logger.error("booking_lock_acquire_failed", {
        event:      "booking_lock_acquire_failed",
        roomTypeId: data.roomTypeId,
        error:      (err as Error).message,
        ...ctx(),
      });
      throw err;
    }
  },

  async releaseLock(sessionId: string): Promise<void> {
    await query(`DELETE FROM booking_locks WHERE session_id = $1`, [sessionId]);
    availabilityLockCounter.inc({ action: "released" });
    logger.info("booking_lock_released", { event: "booking_lock_released", sessionId, ...ctx() });
  },

  async decrementAvailability(
    roomTypeId:  string,
    checkIn:     string,
    checkOut:    string,
    roomsBooked: number,
    client:      PoolClient
  ): Promise<void> {
    try {
      await client.query(
        `UPDATE availability_calendar
         SET available_count = available_count - $1, updated_at = now()
         WHERE room_type_id = $2 AND date >= $3::date AND date < $4::date`,
        [roomsBooked, roomTypeId, checkIn, checkOut]
      );
    } catch (err) {
      trackError("availability_decrement_failed", "availability_repository", "critical");
      throw err;
    }
  },

  async incrementAvailability(
    roomTypeId: string,
    checkIn:    string,
    checkOut:   string,
    rooms:      number,
    client:     PoolClient
  ): Promise<void> {
    try {
      await client.query(
        `UPDATE availability_calendar
         SET available_count = available_count + $1, updated_at = now()
         WHERE room_type_id = $2 AND date >= $3::date AND date < $4::date`,
        [rooms, roomTypeId, checkIn, checkOut]
      );
    } catch (err) {
      trackError("availability_increment_failed", "availability_repository", "high");
      throw err;
    }
  },

  async blockDates(data: { roomTypeId: string; tenantId: string; startDate: string; endDate: string }): Promise<void> {
    try {
      await query(
        `UPDATE availability_calendar SET is_blocked = true, updated_at = now()
         WHERE room_type_id = $1 AND date >= $2::date AND date <= $3::date`,
        [data.roomTypeId, data.startDate, data.endDate]
      );
    } catch (err) {
      trackError("availability_block_failed", "availability_repository", "medium");
      throw err;
    }
  },

  async unblockDates(data: { roomTypeId: string; startDate: string; endDate: string }): Promise<void> {
    try {
      await query(
        `UPDATE availability_calendar SET is_blocked = false, updated_at = now()
         WHERE room_type_id = $1 AND date >= $2::date AND date <= $3::date`,
        [data.roomTypeId, data.startDate, data.endDate]
      );
    } catch (err) {
      trackError("availability_unblock_failed", "availability_repository", "medium");
      throw err;
    }
  },

  async purgeExpiredLocks(): Promise<number> {
    try {
      const result = await query<{ count: string }>(
        `WITH deleted AS (DELETE FROM booking_locks WHERE expires_at < now() RETURNING id)
         SELECT COUNT(*) AS count FROM deleted`
      );
      return parseInt(result[0]?.count ?? "0", 10);
    } catch (err) {
      trackError("lock_purge_failed", "availability_repository", "low");
      return 0;
    }
  },
};