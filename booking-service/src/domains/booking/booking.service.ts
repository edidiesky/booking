import { Pool, PoolClient } from "pg";
import { bookingRepository, eachDate } from "./booking.repository";
import { eventStore } from "../../eventStore";
import { publishAuditLog } from "../../auditPublisher";
import { toBookingDto } from "../../mappers";
import { logger } from "../../logger";

export class NoAvailabilityError extends Error {
  status = 409;
  constructor() {
    super("No availability for the requested dates.");
  }
}
export class BookingNotFoundError extends Error {
  status = 404;
  constructor() {
    super("Booking not found.");
  }
}
export class InvalidBookingStateError extends Error {
  status = 409;
  constructor(message: string) {
    super(message);
  }
}

export interface ReserveInput {
  tenantId: string;
  propertyId: string;
  roomTypeId: string;
  guestUserId: string;
  guestEmail: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  roomsCount: number;
  guestCount: number;
  totalAmountNgn: number;
  platformFeeNgn: number;
  hostPayoutNgn: number;
}

const BOOKING_EXPIRY_ZSET = "schedule:booking_expiry";
const HOLD_MS = 30 * 60_000;

/** Best-effort: lets the existing booking-expiry-worker cancel unpaid bookings. */
async function scheduleExpiry(bookingId: string): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const shared = require("@booking/shared") as { redisClient?: { zadd: (...a: unknown[]) => Promise<unknown> } };
    await shared.redisClient?.zadd(BOOKING_EXPIRY_ZSET, Date.now() + HOLD_MS, bookingId);
  } catch (err) {
    logger.warn("booking_expiry_schedule_failed", { bookingId, error: String(err) });
  }
}

async function inTransaction<T>(pool: Pool, fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const out = await fn(client);
    await client.query("COMMIT");
    return out;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* connection already gone */
    }
    throw err;
  } finally {
    client.release();
  }
}

async function appendEvent(
  client: PoolClient, bookingId: string, eventType: string, payload: Record<string, unknown>,
) {
  const version = await eventStore.getCurrentVersion(client, bookingId);
  await eventStore.append(client, bookingId, "Booking", version, [{ eventType, payload }]);
}

/**
 * Loads a booking for a state change.
 *  1. look it up WITHOUT tenant context (SECURITY DEFINER fn) - under FORCE RLS a plain
 *     SELECT returns nothing, which made confirm/release 404 and broke compensation;
 *  2. verify the caller's tenant (when supplied);
 *  3. set the tenant for the rest of the transaction and lock the row.
 */
async function loadForWrite(client: PoolClient, bookingId: string, tenantId?: string) {
  const found = await bookingRepository.findById(client, bookingId);
  if (!found || (tenantId && found.tenant_id !== tenantId)) throw new BookingNotFoundError();
  await client.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [found.tenant_id]);
  const row = await bookingRepository.findByIdForUpdate(client, bookingId);
  if (!row) throw new BookingNotFoundError();
  return row;
}

export const bookingService = {
  /** Idempotent per `idempotencyKey`: a retry returns the same booking, never a second one. */
  async reserve(pool: Pool, input: ReserveInput, idempotencyKey?: string) {
    const result = await inTransaction(pool, async (client) => {
      if (idempotencyKey) {
        // Serialise same-key requests so a replay can't be misreported as "no availability".
        await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [idempotencyKey]);
        const existing = await bookingRepository.findIdempotent(client, idempotencyKey);
        if (existing) return { bookingId: existing, replay: true };
      }

      await client.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [input.tenantId]);

      if (eachDate(input.checkIn, input.checkOut).length === 0) {
        throw Object.assign(new Error("checkOut must be after checkIn."), { status: 400 });
      }
      const ok = await bookingRepository.hasAvailability(
        client, input.roomTypeId, input.checkIn, input.checkOut, input.roomsCount,
      );
      if (!ok) throw new NoAvailabilityError();

      const booking = await bookingRepository.create(client, { ...input, metadata: { source: "booking-service" } });
      // The lock's session id is the booking id: release/confirm free it by that key.
      await bookingRepository.createLock(
        client, input.roomTypeId, input.checkIn, input.checkOut, input.roomsCount, booking.id,
      );
      await eventStore.append(client, booking.id, "Booking", 0, [
        {
          eventType: "BookingReserved",
          payload: { bookingId: booking.id, tenantId: input.tenantId, totalAmountNgn: input.totalAmountNgn },
        },
      ]);
      if (idempotencyKey) await bookingRepository.saveIdempotent(client, idempotencyKey, booking.id);
      return { bookingId: booking.id as string, replay: false };
    });

    if (!result.replay) {
      await scheduleExpiry(result.bookingId);
      publishAuditLog({
        tenantId: input.tenantId, userId: input.guestUserId, action: "booking.reserved",
        resource: "booking", resourceId: result.bookingId, newValue: { status: "pending_payment" },
      });
    }
    return { bookingId: result.bookingId };
  },

  /** Compensation. Idempotent: releasing an already-cancelled booking succeeds. */
  async release(pool: Pool, bookingId: string, tenantId?: string) {
    return inTransaction(pool, async (client) => {
      const b = await loadForWrite(client, bookingId, tenantId);
      if (b.status === "cancelled") return { released: true, idempotent: true };
      if (b.status !== "pending_payment") {
        throw new InvalidBookingStateError(`Cannot release booking in status ${b.status}`);
      }
      await bookingRepository.cancel(client, bookingId, "payment_not_completed");
      await bookingRepository.deleteLocks(client, [bookingId, String(b.metadata?.sessionId ?? bookingId)]);
      await appendEvent(client, bookingId, "BookingCancelled", { bookingId });
      return { released: true };
    });
  },

  /**
   * Idempotent. If the booking is still pending it is confirmed with the SAME effects as the
   * monolith's confirm (calendar decrement, lock freed, escrow row). If the monolith already
   * confirmed it (its webhook runs first) this is a no-op.
   */
  async confirm(pool: Pool, bookingId: string, tenantId?: string) {
    return inTransaction(pool, async (client) => {
      const b = await loadForWrite(client, bookingId, tenantId);
      if (b.status === "confirmed") return { confirmed: true, idempotent: true };
      if (b.status !== "pending_payment") {
        throw new InvalidBookingStateError(`Cannot confirm booking in status ${b.status}`);
      }
      const updated = await bookingRepository.confirm(client, bookingId);
      if (!updated) throw new InvalidBookingStateError("Cannot confirm booking.");

      const toDay = (v: unknown) => (v instanceof Date ? v.toISOString() : String(v)).slice(0, 10);
      await bookingRepository.decrementAvailability(
        client, b.room_type_id, toDay(b.check_in), toDay(b.check_out), b.rooms_count,
      );
      await bookingRepository.deleteLocks(client, [bookingId, String(b.metadata?.sessionId ?? bookingId)]);
      await bookingRepository.ensureEscrow(client, b);
      await appendEvent(client, bookingId, "PaymentConfirmed", { bookingId });
      return { confirmed: true };
    });
  },

  /** Read path: no tenant context needed (SECURITY DEFINER lookup). */
  async findById(pool: Pool, bookingId: string) {
    const row = await bookingRepository.findById(pool, bookingId);
    if (!row) throw new BookingNotFoundError();
    return toBookingDto(row);
  },

  async getHistory(pool: Pool, bookingId: string) {
    const row = await bookingRepository.findById(pool, bookingId);
    if (!row) throw new BookingNotFoundError();
    const client = await pool.connect();
    try {
      const events = await eventStore.getEvents(client, bookingId);
      return { bookingId, events };
    } finally {
      client.release();
    }
  },
};
