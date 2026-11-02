/**
 * Exhaustive-ish (status × event) table for BookingService.
 * Extend rows as new transitions are added in production.
 */
import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import type { BookingStatus } from "../../../types";

jest.mock("@booking/shared", () => ({
  withTransaction: jest.fn(async (fn: (c: object) => Promise<unknown>) =>
    fn({ query: jest.fn() }),
  ),
  outboxRepository: { create: jest.fn().mockResolvedValue({}) },
}));

jest.mock("../../../domains/booking/booking.repository", () => ({
  bookingRepository: {
    findById: jest.fn(),
    updateStatus: jest.fn(),
  },
}));
jest.mock("../../../domains/availability/availability.repository", () => ({
  availabilityRepository: {
    decrementAvailability: jest.fn(),
    incrementAvailability: jest.fn(),
    releaseLock: jest.fn(),
  },
}));
jest.mock("../../../domains/escrow/escrow.repository", () => ({
  escrowRepository: {
    create: jest.fn(),
    initiateRefund: jest.fn(),
  },
}));
jest.mock("../../../domains/auth/auth.repository", () => ({
  userRepository: { findById: jest.fn().mockResolvedValue({ id: "g1", email: "g@x.com" }) },
}));
jest.mock("../../../domains/audit/audit.repository", () => ({
  auditRepository: { log: jest.fn() },
}));
jest.mock("../../../domains/audit/auditEvent.repository", () => ({
  auditEventRepository: { record: jest.fn() },
}));
jest.mock("../../../utils/metrics", () => ({
  bookingConfirmedCounter: { inc: jest.fn() },
  bookingCancelledCounter: { inc: jest.fn() },
  measureBookingOp: (_: string, fn: () => Promise<unknown>) => fn(),
}));
jest.mock("../../../messaging/availabilityBroadcaster", () => ({
  availabilityBroadcaster: { publish: jest.fn() },
}));
jest.mock("../../../domains/sse/sse.service", () => ({
  sseService: { pushToUser: jest.fn(), pushToTenant: jest.fn() },
}));
jest.mock("../../../context/requestContext", () => ({
  requestContext: { get: () => ({ requestId: "req-1" }) },
}));

import { BookingService } from "../../../domains/booking/booking.service";
import { bookingRepository } from "../../../domains/booking/booking.repository";

const mockedFind = bookingRepository.findById as jest.Mock;

function baseBooking(status: BookingStatus) {
  return {
    id: "booking-1",
    booking_ref: "BK-1",
    status,
    guest_user_id: "guest-1",
    tenant_id: "tenant-1",
    room_type_id: "rt-1",
    check_in: "2026-11-01",
    check_out: "2026-11-03",
    rooms_count: 1,
    total_amount_ngn: "50000",
    platform_fee_ngn: "5000",
    host_payout_ngn: "45000",
    metadata: { sessionId: "session-1" },
  };
}

type Event = "confirm_payment" | "cancel_owner" | "cancel_stranger";

/**
 * expected: "ok" | statusCode
 */
const TRANSITIONS: Array<{
  status: BookingStatus;
  event: Event;
  expected: "ok" | number;
}> = [
  { status: "pending_payment", event: "confirm_payment", expected: "ok" },
  { status: "confirmed", event: "confirm_payment", expected: "ok" }, // idempotent
  { status: "cancelled", event: "confirm_payment", expected: 409 },
  { status: "checked_in", event: "confirm_payment", expected: 409 },
  { status: "checked_out", event: "confirm_payment", expected: 409 },
  { status: "pending_payment", event: "cancel_owner", expected: "ok" },
  { status: "confirmed", event: "cancel_owner", expected: "ok" },
  { status: "cancelled", event: "cancel_owner", expected: 409 },
  { status: "checked_in", event: "cancel_owner", expected: 409 },
  { status: "pending_payment", event: "cancel_stranger", expected: 403 },
];

describe("BookingService — status × event table", () => {
  const service = new BookingService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(TRANSITIONS)(
    "$status + $event → $expected",
    async ({ status, event, expected }) => {
      mockedFind.mockResolvedValue(baseBooking(status) as never);

      let result: unknown;
      let err: { statusCode?: number } | undefined;
      try {
        if (event === "confirm_payment") {
          result = await service.confirmBookingByPayment("booking-1", "tx-1");
        } else if (event === "cancel_owner") {
          result = await service.cancelBooking("booking-1", "guest-1");
        } else {
          result = await service.cancelBooking("booking-1", "other-user");
        }
      } catch (e) {
        err = e as { statusCode?: number };
      }

      if (expected === "ok") {
        expect(err).toBeUndefined();
        expect(result).toBeTruthy();
      } else {
        expect(err?.statusCode).toBe(expected);
      }
    },
  );
});
