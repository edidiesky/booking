import { Pool } from "pg";
import { bookingRepository } from "./booking.repository";
import { eventStore } from "../../eventStore";
import { publishAuditLog } from "../../auditPublisher";
import { toBookingDto } from "../../mappers";

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

export const bookingService = {
  async reserve(
    pool: Pool,
    input: {
      tenantId: string;
      roomTypeId: string;
      guestUserId: string;
      guestEmail: string;
      checkIn: string;
      checkOut: string;
      roomsCount: number;
      totalAmountNgn: number;
    },
  ) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const lock = await bookingRepository.lockAvailability(
        client,
        input.roomTypeId,
        input.checkIn,
        input.checkOut,
        input.roomsCount,
      );
      if (!lock.ok) {
        await client.query("ROLLBACK");
        throw new NoAvailabilityError();
      }

      await bookingRepository.markUnavailable(client, lock.lockedIds);
      const booking = await bookingRepository.create(client, input);
      await bookingRepository.createLock(
        client,
        booking.id,
        input.roomTypeId,
        input.checkIn,
        input.checkOut,
      );
      await eventStore.append(client, booking.id, "Booking", 0, [
        {
          eventType: "BookingReserved",
          payload: {
            bookingId: booking.id,
            tenantId: input.tenantId,
            totalAmountNgn: input.totalAmountNgn,
          },
        },
      ]);
      await client.query("COMMIT");

      publishAuditLog({
        tenantId: input.tenantId,
        userId: input.guestUserId,
        action: "booking.reserved",
        resource: "booking",
        resourceId: booking.id,
        newValue: { status: "pending_payment" },
      });

      return { bookingId: booking.id as string };
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

  async release(pool: Pool, bookingId: string) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const existing = await bookingRepository.findById(pool, bookingId);
      if (!existing) {
        await client.query("ROLLBACK");
        throw new BookingNotFoundError();
      }
      if (existing.status !== "pending_payment") {
        await client.query("ROLLBACK");
        throw new InvalidBookingStateError(
          `Cannot release booking in status ${existing.status}`,
        );
      }
      await bookingRepository.cancel(client, bookingId);
      const version = await eventStore.getCurrentVersion(client, bookingId);
      await eventStore.append(client, bookingId, "Booking", version, [
        { eventType: "BookingCancelled", payload: { bookingId } },
      ]);
      await client.query("COMMIT");
      return { released: true };
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

  async confirm(pool: Pool, bookingId: string) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const updated = await bookingRepository.confirm(client, bookingId);
      if (!updated) {
        const existing = await bookingRepository.findById(pool, bookingId);
        await client.query("ROLLBACK");
        if (!existing) throw new BookingNotFoundError();
        if (existing.status === "confirmed") {
          return { confirmed: true, idempotent: true };
        }
        throw new InvalidBookingStateError(
          `Cannot confirm booking in status ${existing.status}`,
        );
      }
      const version = await eventStore.getCurrentVersion(client, bookingId);
      await eventStore.append(client, bookingId, "Booking", version, [
        { eventType: "PaymentConfirmed", payload: { bookingId } },
      ]);
      await client.query("COMMIT");
      return { confirmed: true };
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

  async findById(pool: Pool, bookingId: string) {
    const row = await bookingRepository.findById(pool, bookingId);
    if (!row) throw new BookingNotFoundError();
    return toBookingDto(row);
  },

  async getHistory(pool: Pool, bookingId: string) {
    const client = await pool.connect();
    try {
      const row = await bookingRepository.findById(pool, bookingId);
      if (!row) throw new BookingNotFoundError();
      const events = await eventStore.getEvents(client, bookingId);
      return { bookingId, events };
    } finally {
      client.release();
    }
  },
};
