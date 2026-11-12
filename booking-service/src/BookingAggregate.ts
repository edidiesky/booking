export type BookingEventType =
  | "BookingReserved"
  | "PaymentConfirmed"
  | "GuestCheckedIn"
  | "GuestCheckedOut"
  | "BookingCancelled"
  | "BookingRefunded";

export interface BookingState {
  bookingId: string;
  status:
    | "pending_payment"
    | "confirmed"
    | "checked_in"
    | "checked_out"
    | "cancelled"
    | "refunded";
  tenantId: string;
  totalAmountNgn: number;
  version: number;
}

/**
 * Pure replay. Load events via eventStore.getEvents(client, id) then apply.
 * Does not touch the database itself.
 */
export class BookingAggregate {
  private constructor(private state: BookingState) {}

  static fromEvents(
    events: Array<{ eventType: string; payload: Record<string, unknown> }>,
  ): BookingAggregate | null {
    if (events.length === 0) return null;
    let state: BookingState | null = null;
    for (const event of events) {
      state = BookingAggregate.apply(
        state,
        event.eventType as BookingEventType,
        event.payload,
      );
    }
    return new BookingAggregate(state!);
  }

  getState(): BookingState {
    return { ...this.state };
  }

  private static apply(
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
        throw new Error(`Unknown event type: ${eventType}`);
    }
  }
}
