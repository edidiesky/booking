import { describe, it, expect, jest, beforeEach } from "@jest/globals";

jest.mock("@booking/shared", () => ({ query: jest.fn(), queryOne: jest.fn() }));
jest.mock("../../utils/metrics", () => ({ trackError: jest.fn() }));
jest.mock("../../context/requestContext", () => ({ requestContext: { get: jest.fn(() => undefined) } }));
jest.mock("../../utils/logger", () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn() },
}));

import { query, queryOne } from "@booking/shared";
import { trackError } from "../../../utils/metrics";
import { bookingRepository } from "../../../domains/booking/booking.repository";

const mockQuery      = query      as jest.MockedFunction<typeof query>;
const mockQueryOne   = queryOne   as jest.MockedFunction<typeof queryOne>;
const mockTrackError = trackError as jest.MockedFunction<typeof trackError>;

function makeBookingRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "booking-1", booking_ref: "BK-TEST-XYZ", tenant_id: "tenant-1",
    property_id: "prop-1", room_type_id: "rt-1", guest_user_id: "guest-1",
    status: "pending_payment", rooms_count: 1, guest_count: 2,
    check_in: "2099-01-15", check_out: "2099-01-17",
    total_amount_ngn: 50000, platform_fee_ngn: 5000, host_payout_ngn: 45000,
    created_at: new Date(), updated_at: new Date(),
    ...overrides,
  };
}

describe("bookingRepository", () => {
  beforeEach(() => {jest.clearAllMocks()});

  describe("create", () => {
    it("generates a BK-<timestamp>-<random> booking ref and requires a client, no bare-queryOne fallback", async () => {
      const mockClient = { query: jest.fn().mockResolvedValue({ rows: [makeBookingRow()] }) };

      const result = await bookingRepository.create({
        tenantId: "tenant-1", propertyId: "prop-1", roomTypeId: "rt-1", guestUserId: "guest-1",
        roomsCount: 1, checkIn: "2099-01-15", checkOut: "2099-01-17", guestCount: 2,
        totalAmountNgn: 50000, platformFeeNgn: 5000, hostPayoutNgn: 45000,
      }, mockClient as never);

      expect(mockClient.query).toHaveBeenCalled();
      expect(mockQueryOne).not.toHaveBeenCalled();
      const [, params] = mockClient.query.mock.calls[0] as [string, unknown[]];
      expect(params[0]).toMatch(/^BK-[0-9A-Z]+-[0-9A-Z]{3}$/);
      expect(result.id).toBe("booking-1");
    });

    it("stringifies metadata to JSON, defaults to {} when omitted", async () => {
      const mockClient = { query: jest.fn().mockResolvedValue({ rows: [makeBookingRow()] }) };

      await bookingRepository.create({
        tenantId: "tenant-1", propertyId: "prop-1", roomTypeId: "rt-1", guestUserId: "guest-1",
        roomsCount: 1, checkIn: "2099-01-15", checkOut: "2099-01-17", guestCount: 2,
        totalAmountNgn: 50000, platformFeeNgn: 5000, hostPayoutNgn: 45000,
      }, mockClient as never);

      const [, params] = mockClient.query.mock.calls[0] as [string, unknown[]];
      expect(params[params.length - 1]).toBe("{}");
    });

    it("tracks the failure and rethrows when the insert fails", async () => {
      const mockClient = { query: jest.fn().mockRejectedValue(new Error("fk violation")) };

      await expect(
        bookingRepository.create({
          tenantId: "tenant-1", propertyId: "prop-1", roomTypeId: "rt-1", guestUserId: "guest-1",
          roomsCount: 1, checkIn: "2099-01-15", checkOut: "2099-01-17", guestCount: 2,
          totalAmountNgn: 50000, platformFeeNgn: 5000, hostPayoutNgn: 45000,
        }, mockClient as never),
      ).rejects.toThrow("fk violation");

      expect(mockTrackError).toHaveBeenCalledWith("booking_create_failed", "booking_repository", "high");
    });
  });

  describe("updateStatus", () => {
    it("adds cancellation_reason and cancelled_at only when provided in extra", async () => {
      mockQueryOne.mockResolvedValue(makeBookingRow({ status: "cancelled" }) as never);
      const cancelledAt = new Date();

      await bookingRepository.updateStatus("booking-1", "cancelled", {
        cancellation_reason: "guest requested",
        cancelled_at: cancelledAt,
      });

      const [sql, params] = mockQueryOne.mock.calls[0] as [string, unknown[]];
      expect(sql).toContain("cancellation_reason = $2");
      expect(sql).toContain("cancelled_at = $3");
      expect(params).toEqual(["cancelled", "guest requested", cancelledAt, "booking-1"]);
    });

    it("omits both extra fields entirely when not provided, e.g. a plain confirmed transition", async () => {
      mockQueryOne.mockResolvedValue(makeBookingRow({ status: "confirmed" }) as never);

      await bookingRepository.updateStatus("booking-1", "confirmed");

      const [sql, params] = mockQueryOne.mock.calls[0] as [string, unknown[]];
      expect(sql).not.toContain("cancellation_reason");
      expect(params).toEqual(["confirmed", "booking-1"]);
    });

    it("uses the passed client directly when given, skips queryOne", async () => {
      const mockClient = { query: jest.fn().mockResolvedValue({ rows: [makeBookingRow({ status: "checked_in" })] }) };

      await bookingRepository.updateStatus("booking-1", "checked_in", undefined, mockClient as never);

      expect(mockClient.query).toHaveBeenCalled();
      expect(mockQueryOne).not.toHaveBeenCalled();
    });

    it("returns null when no booking matches the id", async () => {
      mockQueryOne.mockResolvedValue(null);

      const result = await bookingRepository.updateStatus("missing-id", "confirmed");

      expect(result).toBeNull();
    });
  });

  describe("findByRef", () => {
    it("looks up by booking_ref, not id", async () => {
      mockQueryOne.mockResolvedValue(makeBookingRow() as never);

      await bookingRepository.findByRef("BK-TEST-XYZ");

      expect(mockQueryOne).toHaveBeenCalledWith(expect.stringContaining("booking_ref"), ["BK-TEST-XYZ"]);
    });
  });
});