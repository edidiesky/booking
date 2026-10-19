/**
 * Pure domain rules for reserve/release without Postgres.
 * Mirrors booking.service decision logic for unit coverage.
 */

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

interface DayRow {
  date: string;
  available: boolean;
  lockedBy?: string;
}

interface BookingRow {
  id: string;
  status: string;
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
}

function datesBetween(checkIn: string, checkOut: string): string[] {
  const out: string[] = [];
  const cur = new Date(checkIn);
  const end = new Date(checkOut);
  while (cur < end) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

export class InMemoryBookingDomain {
  calendar = new Map<string, DayRow>();
  bookings = new Map<string, BookingRow>();
  locks = new Map<string, { bookingId: string; expiresAt: number }>();

  seedAvailability(roomTypeId: string, dates: string[]): void {
    for (const d of dates) {
      this.calendar.set(`${roomTypeId}:${d}`, { date: d, available: true });
    }
  }

  reserve(input: {
    bookingId: string;
    roomTypeId: string;
    checkIn: string;
    checkOut: string;
  }): { bookingId: string } {
    const days = datesBetween(input.checkIn, input.checkOut);
    for (const d of days) {
      const row = this.calendar.get(`${input.roomTypeId}:${d}`);
      if (!row || !row.available || row.lockedBy) {
        throw new NoAvailabilityError();
      }
    }
    for (const d of days) {
      const row = this.calendar.get(`${input.roomTypeId}:${d}`)!;
      row.available = false;
      row.lockedBy = input.bookingId;
    }
    this.bookings.set(input.bookingId, {
      id: input.bookingId,
      status: "pending_payment",
      roomTypeId: input.roomTypeId,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
    });
    this.locks.set(input.bookingId, {
      bookingId: input.bookingId,
      expiresAt: Date.now() + 15 * 60_000,
    });
    return { bookingId: input.bookingId };
  }

  release(bookingId: string): void {
    const booking = this.bookings.get(bookingId);
    if (!booking) throw new BookingNotFoundError();
    const days = datesBetween(booking.checkIn, booking.checkOut);
    for (const d of days) {
      const row = this.calendar.get(`${booking.roomTypeId}:${d}`);
      if (row && row.lockedBy === bookingId) {
        row.available = true;
        row.lockedBy = undefined;
      }
    }
    booking.status = "cancelled";
    this.locks.delete(bookingId);
  }

  confirm(bookingId: string): void {
    const booking = this.bookings.get(bookingId);
    if (!booking) throw new BookingNotFoundError();
    booking.status = "confirmed";
    this.locks.delete(bookingId);
  }
}

describe("booking domain reserve/release", () => {
  let domain: InMemoryBookingDomain;

  beforeEach(() => {
    domain = new InMemoryBookingDomain();
    domain.seedAvailability("room-1", ["2026-11-01", "2026-11-02", "2026-11-03"]);
  });

  it("reserves when all nights available", () => {
    const r = domain.reserve({
      bookingId: "b1",
      roomTypeId: "room-1",
      checkIn: "2026-11-01",
      checkOut: "2026-11-03",
    });
    expect(r.bookingId).toBe("b1");
    expect(domain.bookings.get("b1")!.status).toBe("pending_payment");
  });

  it("fails when any night unavailable", () => {
    domain.reserve({
      bookingId: "b1",
      roomTypeId: "room-1",
      checkIn: "2026-11-01",
      checkOut: "2026-11-03",
    });
    expect(() =>
      domain.reserve({
        bookingId: "b2",
        roomTypeId: "room-1",
        checkIn: "2026-11-01",
        checkOut: "2026-11-02",
      }),
    ).toThrow(NoAvailabilityError);
  });

  it("release frees nights for a second reserve", () => {
    domain.reserve({
      bookingId: "b1",
      roomTypeId: "room-1",
      checkIn: "2026-11-01",
      checkOut: "2026-11-03",
    });
    domain.release("b1");
    const r = domain.reserve({
      bookingId: "b2",
      roomTypeId: "room-1",
      checkIn: "2026-11-01",
      checkOut: "2026-11-03",
    });
    expect(r.bookingId).toBe("b2");
  });

  it("release unknown booking fails", () => {
    expect(() => domain.release("missing")).toThrow(BookingNotFoundError);
  });

  it("confirm moves status", () => {
    domain.reserve({
      bookingId: "b1",
      roomTypeId: "room-1",
      checkIn: "2026-11-01",
      checkOut: "2026-11-02",
    });
    domain.confirm("b1");
    expect(domain.bookings.get("b1")!.status).toBe("confirmed");
  });
});
