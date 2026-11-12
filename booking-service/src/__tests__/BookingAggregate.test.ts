type BookingEventType =
  | "BookingReserved"
  | "PaymentConfirmed"
  | "GuestCheckedIn"
  | "GuestCheckedOut"
  | "BookingCancelled"
  | "BookingRefunded";

interface BookingState {
  bookingId: string;
  status: "pending_payment" | "confirmed" | "checked_in" | "checked_out" | "cancelled" | "refunded";
  tenantId: string;
  totalAmountNgn: number;
  version: number;
}

function apply(
  state: BookingState | null,
  eventType: BookingEventType,
  payload: Record<string, unknown>,
): BookingState {
  switch (eventType) {
    case "BookingReserved":
      return {
        bookingId: payload.bookingId as string,
        status: "pending_payment",
        tenantId: payload.tenantId as string,
        totalAmountNgn: payload.totalAmountNgn as number,
        version: 1,
      };
    case "PaymentConfirmed":
      return { ...state!, status: "confirmed", version: state!.version + 1 };
    case "GuestCheckedIn":
      return { ...state!, status: "checked_in", version: state!.version + 1 };
    case "GuestCheckedOut":
      return { ...state!, status: "checked_out", version: state!.version + 1 };
    case "BookingCancelled":
      return { ...state!, status: "cancelled", version: state!.version + 1 };
    case "BookingRefunded":
      return { ...state!, status: "refunded", version: state!.version + 1 };
    default:
      throw new Error(`Unknown event: ${eventType}`);
  }
}

function replay(events: Array<{ eventType: BookingEventType; payload: Record<string, unknown> }>): BookingState {
  let state: BookingState | null = null;
  for (const e of events) {
    state = apply(state, e.eventType, e.payload);
  }
  return state!;
}

describe("BookingAggregate replay", () => {
  it("replays reserved -> confirmed -> checked_in", () => {
    const state = replay([
      {
        eventType: "BookingReserved",
        payload: { bookingId: "b1", tenantId: "t1", totalAmountNgn: 10000 },
      },
      { eventType: "PaymentConfirmed", payload: {} },
      { eventType: "GuestCheckedIn", payload: {} },
    ]);
    expect(state.status).toBe("checked_in");
    expect(state.version).toBe(3);
    expect(state.totalAmountNgn).toBe(10000);
  });

  it("replays cancel after reserve", () => {
    const state = replay([
      {
        eventType: "BookingReserved",
        payload: { bookingId: "b1", tenantId: "t1", totalAmountNgn: 5000 },
      },
      { eventType: "BookingCancelled", payload: {} },
    ]);
    expect(state.status).toBe("cancelled");
    expect(state.version).toBe(2);
  });

  it("is deterministic across multiple replays", () => {
    const events: Array<{ eventType: BookingEventType; payload: Record<string, unknown> }> = [
      {
        eventType: "BookingReserved",
        payload: { bookingId: "b1", tenantId: "t1", totalAmountNgn: 1 },
      },
      { eventType: "PaymentConfirmed", payload: {} },
      { eventType: "BookingRefunded", payload: {} },
    ];
    expect(replay(events)).toEqual(replay(events));
  });
});

describe("InMemoryEventStore concurrency", () => {
  const { InMemoryEventStore, ConcurrencyError } = require("./inMemoryEventStore");

  it("appends with optimistic concurrency", async () => {
    const store = new InMemoryEventStore();
    await store.append("agg-1", "Booking", 0, [
      { eventType: "BookingReserved", payload: { bookingId: "agg-1" } },
    ]);
    await store.append("agg-1", "Booking", 1, [
      { eventType: "PaymentConfirmed", payload: {} },
    ]);
    const events = await store.getEvents("agg-1");
    expect(events).toHaveLength(2);
    expect(events[1].version).toBe(2);
  });

  it("rejects stale expectedVersion", async () => {
    const store = new InMemoryEventStore();
    await store.append("agg-1", "Booking", 0, [
      { eventType: "BookingReserved", payload: {} },
    ]);
    await expect(
      store.append("agg-1", "Booking", 0, [
        { eventType: "PaymentConfirmed", payload: {} },
      ]),
    ).rejects.toBeInstanceOf(ConcurrencyError);
  });
});
