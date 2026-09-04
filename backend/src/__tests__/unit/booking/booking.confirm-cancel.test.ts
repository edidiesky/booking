import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { BookingService } from "../../../domains/booking/booking.service";
import {
  bookingRepository,
  type Booking,
} from "../../../domains/booking/booking.repository";
import { availabilityRepository } from "../../../domains/availability/availability.repository";
import { escrowRepository } from "../../../domains/escrow/escrow.repository";
import { tenantRepository } from "../../../domains/tenant/tenant.repository";
import { userRepository } from "../../../domains/auth/auth.repository";
import type { BookingStatus, UserType, UserStatus } from "../../../types";
import { expectAppError } from "../../helpers/expectAppError";

jest.mock("@booking/shared", () => ({
  withTransaction: jest.fn(async (fn: (client: object) => Promise<unknown>) =>
    fn({ query: jest.fn() }),
  ),
  outboxRepository: {
    create: jest.fn().mockResolvedValue(undefined as never),
  },
  availabilityBroadcaster: { publish: jest.fn() },
  redisClient: { zadd: jest.fn(), zrem: jest.fn() },
}));

jest.mock("../../../domains/booking/booking.repository");
jest.mock("../../../domains/availability/availability.repository");
jest.mock("../../../domains/escrow/escrow.repository");
jest.mock("../../../domains/tenant/tenant.repository");
jest.mock("../../../domains/property/property.repository", () => ({
  propertyRepository: {
    findPropertyById: jest.fn(),
    findRoomTypeById: jest.fn(),
  },
}));
jest.mock("../../../domains/auth/auth.repository", () => ({
  userRepository: { findById: jest.fn() },
}));
jest.mock("../../../domains/audit/audit.repository", () => ({
  auditRepository: {
    log: jest.fn().mockResolvedValue(undefined as never),
  },
}));
jest.mock("../../../domains/audit/auditEvent.repository", () => ({
  auditEventRepository: {
    record: jest.fn().mockResolvedValue(undefined as never),
  },
}));
jest.mock("../../../domains/sse/sse.service", () => ({
  sseService: {
    pushToUser: jest.fn().mockResolvedValue(undefined as never),
    pushToTenant: jest.fn().mockResolvedValue(undefined as never),
  },
}));
jest.mock("../../../messaging/publisher", () => ({
  publishNotifyBookingConfirmed: jest.fn(),
  publishNotifyBookingCancelled: jest.fn(),
  publishNotifyBookingCheckedIn: jest.fn(),
  publishNotifyBookingCheckedOut: jest.fn(),
}));
jest.mock("../../../utils/metrics", () => ({
  bookingCreatedCounter: { inc: jest.fn() },
  bookingConfirmedCounter: { inc: jest.fn() },
  bookingCancelledCounter: { inc: jest.fn() },
}));
jest.mock("../../../utils/logger", () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));
jest.mock("../../../context/requestContext", () => ({
  requestContext: { get: jest.fn().mockReturnValue({ requestId: "req-1" }) },
}));
jest.mock("uuid", () => ({ v4: jest.fn(() => "uuid-1") }));

const mockedBookingRepo = bookingRepository as jest.Mocked<
  typeof bookingRepository
>;
const mockedAvailRepo = availabilityRepository as jest.Mocked<
  typeof availabilityRepository
>;
const mockedEscrowRepo = escrowRepository as jest.Mocked<typeof escrowRepository>;
const mockedTenantRepo = tenantRepository as jest.Mocked<typeof tenantRepository>;
const mockedUserRepo = userRepository as jest.Mocked<typeof userRepository>;
const { outboxRepository } = jest.requireMock("@booking/shared") as {
  outboxRepository: { create: jest.Mock };
};
const { bookingConfirmedCounter, bookingCancelledCounter } = jest.requireMock(
  "../../../utils/metrics",
) as {
  bookingConfirmedCounter: { inc: jest.Mock };
  bookingCancelledCounter: { inc: jest.Mock };
};

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: "booking-1",
    booking_ref: "BK-001",
    status: "pending_payment" as BookingStatus,
    tenant_id: "tenant-1",
    property_id: "prop-1",
    room_type_id: "rt-1",
    guest_user_id: "guest-1",
    guest_email:"ess@gmail.com",
    guestEmail:"ess@gmail.com",
    rooms_count: 1,
    check_in: "2026-09-10",
    check_out: "2026-09-12",
    nights: 2,
    guest_count: 2,
    total_amount_ngn: 50000,
    platform_fee_ngn: 5000,
    host_payout_ngn: 45000,
    metadata: { sessionId: "session-1" },
    created_at: new Date(),
    updated_at: new Date(),
    receipt_url: "",
    tenant_email: "host@test.com",
    ...overrides,
  };
}

function makeGuest() {
  return {
    id: "guest-1",
    email: "guest@test.com",
    first_name: "Jane",
    last_name: "Doe",
    phone: "+234800",
    user_type: "guest" as UserType,
    status: "active" as UserStatus,
    is_email_verified: true,
    is_phone_verified: false,
    two_factor_enabled: false,
    login_with_pin_enabled: false,
    created_at: new Date(),
    updated_at: new Date(),
  };
}

describe("BookingService – confirm + cancel", () => {
  let service: BookingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BookingService();
    mockedUserRepo.findById.mockResolvedValue(makeGuest() as never);
    mockedAvailRepo.decrementAvailability.mockResolvedValue(undefined as never);
    mockedAvailRepo.incrementAvailability.mockResolvedValue(undefined as never);
    mockedAvailRepo.releaseLock.mockResolvedValue(undefined as never);
    mockedEscrowRepo.create.mockResolvedValue({
      id: "escrow-1",
      booking_id: "booking-1",
      tenant_id: "tenant-1",
      amount_ngn: 50000,
      platform_fee_ngn: 5000,
      host_payout_ngn: 45000,
      status: "held",
      held_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    } as never);
    mockedEscrowRepo.initiateRefund.mockResolvedValue({
      id: "escrow-1",
      booking_id: "booking-1",
      tenant_id: "tenant-1",
      amount_ngn: 50000,
      platform_fee_ngn: 5000,
      host_payout_ngn: 45000,
      status: "refunded",
      held_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    } as never);
    mockedTenantRepo.findById.mockResolvedValue({
      id: "tenant-1",
      cancellation_policy: [],
    } as never);
  });

  describe("confirmBookingByPayment", () => {
    it("transitions pending → confirmed, decrements availability, creates escrow", async () => {
      mockedBookingRepo.findById.mockResolvedValue(
        makeBooking({ status: "pending_payment" }) as never,
      );
      mockedBookingRepo.updateStatus.mockResolvedValue(
        makeBooking({ status: "confirmed" }) as never,
      );

      const result = await service.confirmBookingByPayment("booking-1", "tx-1");

      expect(result.status).toBe("confirmed");
      expect(mockedAvailRepo.decrementAvailability).toHaveBeenCalled();
      expect(mockedEscrowRepo.create).toHaveBeenCalled();
      expect(outboxRepository.create).toHaveBeenCalledWith(
        "booking.confirmed",
        expect.objectContaining({ bookingId: "booking-1" }),
        expect.anything(),
      );
      expect(mockedAvailRepo.releaseLock).toHaveBeenCalledWith("session-1");
      expect(bookingConfirmedCounter.inc).toHaveBeenCalled();
    });

    it("is idempotent when already confirmed", async () => {
      mockedBookingRepo.findById.mockResolvedValue(
        makeBooking({ status: "confirmed" }) as never,
      );
      const result = await service.confirmBookingByPayment("booking-1", "tx-1");
      expect(result.status).toBe("confirmed");
      expect(mockedBookingRepo.updateStatus).not.toHaveBeenCalled();
    });

    it("rejects non-confirmable status", async () => {
      mockedBookingRepo.findById.mockResolvedValue(
        makeBooking({ status: "cancelled" }) as never,
      );
      await expectAppError(
        service.confirmBookingByPayment("booking-1", "tx-1"),
        409,
        /already in status/i,
      );
    });

    it("rejects missing booking", async () => {
      mockedBookingRepo.findById.mockResolvedValue(null as never);
      await expectAppError(
        service.confirmBookingByPayment("missing", "tx-1"),
        404,
      );
    });
  });

  describe("cancelBooking", () => {
    it("cancels pending_payment and releases lock", async () => {
      mockedBookingRepo.findById.mockResolvedValue(
        makeBooking({ status: "pending_payment" }) as never,
      );
      mockedBookingRepo.updateStatus.mockResolvedValue(
        makeBooking({ status: "cancelled" }) as never,
      );
      const dto = await service.cancelBooking(
        "booking-1",
        "guest-1",
        "changed_plans",
      );
      expect(dto.status).toBe("cancelled");
      expect(mockedEscrowRepo.initiateRefund).not.toHaveBeenCalled();
      expect(mockedAvailRepo.releaseLock).toHaveBeenCalledWith("session-1");
      expect(bookingCancelledCounter.inc).toHaveBeenCalled();
    });

    it("cancels confirmed: restores availability + escrow refund", async () => {
      mockedBookingRepo.findById.mockResolvedValue(
        makeBooking({ status: "confirmed" }) as never,
      );
      mockedBookingRepo.updateStatus.mockResolvedValue(
        makeBooking({ status: "cancelled" }) as never,
      );
      await service.cancelBooking("booking-1", "guest-1", "emergency");
      expect(mockedAvailRepo.incrementAvailability).toHaveBeenCalled();
      expect(mockedEscrowRepo.initiateRefund).toHaveBeenCalled();
    });

    it("rejects non-owner cancel", async () => {
      mockedBookingRepo.findById.mockResolvedValue(
        makeBooking({ status: "confirmed" }) as never,
      );
      await expectAppError(
        service.cancelBooking("booking-1", "stranger", "spam"),
        403,
        /own bookings/i,
      );
    });

    it("rejects non-cancelable status", async () => {
      mockedBookingRepo.findById.mockResolvedValue(
        makeBooking({ status: "checked_in" }) as never,
      );
      await expectAppError(
        service.cancelBooking("booking-1", "guest-1"),
        409,
        /Cannot cancel/i,
      );
    });
  });
});