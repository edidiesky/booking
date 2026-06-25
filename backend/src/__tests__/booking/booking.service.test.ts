import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { makeBooking, BOOKING_ID, TENANT_ID, GUEST_ID, PROPERTY_ID, ROOM_TYPE_ID } from "../setup/fixtures";

//  Mock all repos before importing service 
jest.mock("../../domains/booking/booking.repository");
jest.mock("../../domains/availability/availability.repository");
jest.mock("../../domains/property/property.repository");
jest.mock("../../domains/tenant/tenant.repository");
jest.mock("../../domains/escrow/escrow.repository");

import { bookingService }         from "../../domains/booking/booking.service";
import { bookingRepository }      from "../../domains/booking/booking.repository";
import { availabilityRepository } from "../../domains/availability/availability.repository";
import { propertyRepository }     from "../../domains/property/property.repository";
import { tenantRepository }       from "../../domains/tenant/tenant.repository";
import { escrowRepository }       from "../../domains/escrow/escrow.repository";

const mockBookingRepo      = bookingRepository      as jest.Mocked<typeof bookingRepository>;
const mockAvailabilityRepo = availabilityRepository as jest.Mocked<typeof availabilityRepository>;
const mockPropertyRepo     = propertyRepository     as jest.Mocked<typeof propertyRepository>;
const mockTenantRepo       = tenantRepository       as jest.Mocked<typeof tenantRepository>;
const mockEscrowRepo       = escrowRepository       as jest.Mocked<typeof escrowRepository>;

const FUTURE_CHECKIN  = "2099-01-15";
const FUTURE_CHECKOUT = "2099-01-17";

function mockValidEntities() {
  mockPropertyRepo.findRoomTypeById.mockResolvedValue({
    id: ROOM_TYPE_ID, property_id: PROPERTY_ID, tenant_id: TENANT_ID,
    name: "Deluxe Room", max_occupancy: 2, base_price_ngn: 50000,
    quantity: 5, status: "active", images: [], amenities: [],
    created_at: new Date(), updated_at: new Date(),
  });

  mockPropertyRepo.findPropertyById.mockResolvedValue({
    id: PROPERTY_ID, tenant_id: TENANT_ID, name: "Grand Hotel",
    property_type: "hotel", address: { street: "1 Main St", city: "Lagos", state: "Lagos", country: "Nigeria" },
    amenities: [], images: [], check_in_time: "14:00", check_out_time: "11:00",
    status: "active", created_at: new Date(), updated_at: new Date(),
  });

  mockTenantRepo.findById.mockResolvedValue({
    id: TENANT_ID, slug: "grand-hotel", name: "Grand Hotel",
    owner_user_id: "host-id", platform_fee_pct: 10,
    cancellation_policy: [{ hours_before: 48, refund_pct: 100 }, { hours_before: 24, refund_pct: 50 }],
    status: "active",
    settings: { timezone: "Africa/Lagos", currency: "NGN", locale: "en-NG" },
    created_at: new Date(), updated_at: new Date(),
  });

  mockAvailabilityRepo.isAvailable.mockResolvedValue(true);
  mockAvailabilityRepo.acquireLock.mockResolvedValue({
    id: "lock-id", room_type_id: ROOM_TYPE_ID,
    check_in: FUTURE_CHECKIN, check_out: FUTURE_CHECKOUT,
    rooms_held: 1, session_id: "sess-1", expires_at: new Date().toISOString(),
  });
}

describe("bookingService.initiateBooking", () => {
  const baseInput = {
    tenantId:    TENANT_ID,
    propertyId:  PROPERTY_ID,
    roomTypeId:  ROOM_TYPE_ID,
    guestUserId: GUEST_ID,
    roomsCount:  1,
    checkIn:     FUTURE_CHECKIN,
    checkOut:    FUTURE_CHECKOUT,
    guestCount:  2,
  };

  beforeEach(() => {
    mockValidEntities();
    mockBookingRepo.create.mockResolvedValue(makeBooking({
      check_in:  FUTURE_CHECKIN,
      check_out: FUTURE_CHECKOUT,
    }));
  });

  it("creates booking and returns dto with sessionId", async () => {
    const result = await bookingService.initiateBooking(baseInput);

    expect(result.bookingId).toBeDefined();
    expect(result.status).toBe("pending_payment");
    expect(result.sessionId).toBeDefined();
    expect(result.totalAmountNgn).toBeGreaterThan(0);
    expect(mockAvailabilityRepo.acquireLock).toHaveBeenCalled();
    expect(mockBookingRepo.create).toHaveBeenCalled();
  });

  it("computes correct pricing: nights * roomsCount * pricePerNight", async () => {
    const result = await bookingService.initiateBooking(baseInput);

    expect(result.totalAmountNgn).toBe(Number(makeBooking().total_amount_ngn));
  });

  it("throws 400 for past check-in date", async () => {
    await expect(
      bookingService.initiateBooking({ ...baseInput, checkIn: "2020-01-01", checkOut: "2020-01-03" })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("throws 400 when checkOut is before checkIn", async () => {
    await expect(
      bookingService.initiateBooking({ ...baseInput, checkIn: FUTURE_CHECKOUT, checkOut: FUTURE_CHECKIN })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("throws 400 when roomsCount exceeds room type quantity", async () => {
    await expect(
      bookingService.initiateBooking({ ...baseInput, roomsCount: 10 }) // quantity is 5
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("throws 404 when property is archived", async () => {
    mockPropertyRepo.findPropertyById.mockResolvedValue({
      id: PROPERTY_ID, tenant_id: TENANT_ID, name: "Grand Hotel",
      property_type: "hotel", address: { street: "1", city: "Lagos", state: "Lagos", country: "Nigeria" },
      amenities: [], images: [], check_in_time: "14:00", check_out_time: "11:00",
      status: "archived", created_at: new Date(), updated_at: new Date(),
    });

    await expect(bookingService.initiateBooking(baseInput)).rejects.toMatchObject({ statusCode: 404 });
  });

  it("throws 404 when tenant is suspended", async () => {
    mockTenantRepo.findById.mockResolvedValue({
      id: TENANT_ID, slug: "grand-hotel", name: "Grand Hotel",
      owner_user_id: "host-id", platform_fee_pct: 10,
      cancellation_policy: [], status: "suspended",
      settings: { timezone: "Africa/Lagos", currency: "NGN", locale: "en-NG" },
      created_at: new Date(), updated_at: new Date(),
    });

    await expect(bookingService.initiateBooking(baseInput)).rejects.toMatchObject({ statusCode: 404 });
  });

  it("throws 409 when dates are not available", async () => {
    mockAvailabilityRepo.isAvailable.mockResolvedValue(false);

    await expect(bookingService.initiateBooking(baseInput)).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe("bookingService.confirmBookingByPayment", () => {
  it("confirms a pending_payment booking", async () => {
    const booking    = makeBooking({ status: "pending_payment" });
    const confirmed  = makeBooking({ status: "confirmed" });

    mockBookingRepo.findById.mockResolvedValue(booking);
    mockBookingRepo.updateStatus.mockResolvedValue(confirmed);
    mockAvailabilityRepo.decrementAvailability.mockResolvedValue(undefined);
    mockEscrowRepo.create.mockResolvedValue({} as never);
    mockAvailabilityRepo.releaseLock.mockResolvedValue(undefined);

    const result = await bookingService.confirmBookingByPayment(BOOKING_ID, "ref_123");

    expect(result.status).toBe("confirmed");
    expect(mockAvailabilityRepo.decrementAvailability).toHaveBeenCalled();
    expect(mockEscrowRepo.create).toHaveBeenCalled();
  });

  it("is idempotent - returns already confirmed booking", async () => {
    const confirmed = makeBooking({ status: "confirmed" });
    mockBookingRepo.findById.mockResolvedValue(confirmed);

    const result = await bookingService.confirmBookingByPayment(BOOKING_ID, "ref_123");

    expect(result.status).toBe("confirmed");
    expect(mockBookingRepo.updateStatus).not.toHaveBeenCalled();
  });

  it("throws 409 when booking is already cancelled", async () => {
    mockBookingRepo.findById.mockResolvedValue(makeBooking({ status: "cancelled" }));

    await expect(
      bookingService.confirmBookingByPayment(BOOKING_ID, "ref_123")
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("throws 404 when booking not found", async () => {
    mockBookingRepo.findById.mockResolvedValue(null);

    await expect(
      bookingService.confirmBookingByPayment(BOOKING_ID, "ref_123")
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("bookingService.cancelBooking", () => {
  it("cancels a confirmed booking with refund calculation", async () => {
    const booking   = makeBooking({ status: "confirmed", check_in: FUTURE_CHECKIN });
    const cancelled = makeBooking({ status: "cancelled" });

    mockBookingRepo.findById.mockResolvedValue(booking);
    mockBookingRepo.updateStatus.mockResolvedValue(cancelled);
    mockAvailabilityRepo.incrementAvailability.mockResolvedValue(undefined);
    mockEscrowRepo.initiateRefund.mockResolvedValue(null);

    const result = await bookingService.cancelBooking(BOOKING_ID, GUEST_ID, "Change of plans");

    expect(result.status).toBe("cancelled");
    expect(mockAvailabilityRepo.incrementAvailability).toHaveBeenCalled();
    expect(mockEscrowRepo.initiateRefund).toHaveBeenCalled();
  });

  it("cancels a pending_payment booking (no refund needed)", async () => {
    const booking   = makeBooking({ status: "pending_payment", metadata: { sessionId: "sess-abc" } });
    const cancelled = makeBooking({ status: "cancelled" });

    mockBookingRepo.findById.mockResolvedValue(booking);
    mockBookingRepo.updateStatus.mockResolvedValue(cancelled);
    mockAvailabilityRepo.releaseLock.mockResolvedValue(undefined);

    await bookingService.cancelBooking(BOOKING_ID, GUEST_ID);

    expect(mockAvailabilityRepo.releaseLock).toHaveBeenCalledWith("sess-abc");
    expect(mockEscrowRepo.initiateRefund).not.toHaveBeenCalled();
  });

  it("throws 403 when a different guest tries to cancel", async () => {
    const booking = makeBooking({ status: "confirmed", guest_user_id: "other-guest-id" });
    mockBookingRepo.findById.mockResolvedValue(booking);

    await expect(
      bookingService.cancelBooking(BOOKING_ID, GUEST_ID)
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("throws 409 when booking is already checked in", async () => {
    const booking = makeBooking({ status: "checked_in", guest_user_id: GUEST_ID });
    mockBookingRepo.findById.mockResolvedValue(booking);

    await expect(
      bookingService.cancelBooking(BOOKING_ID, GUEST_ID)
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe("bookingService.checkIn", () => {
  it("transitions confirmed booking to checked_in", async () => {
    const booking   = makeBooking({ status: "confirmed" });
    const checkedIn = makeBooking({ status: "checked_in" });

    mockBookingRepo.findById.mockResolvedValue(booking);
    mockBookingRepo.updateStatus.mockResolvedValue(checkedIn);

    const result = await bookingService.checkIn(BOOKING_ID, "host-user-id");
    expect(result.status).toBe("checked_in");
  });

  it("throws 409 when booking is pending_payment", async () => {
    mockBookingRepo.findById.mockResolvedValue(makeBooking({ status: "pending_payment" }));

    await expect(bookingService.checkIn(BOOKING_ID, "host-id")).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe("bookingService.checkOut", () => {
  it("transitions checked_in booking to checked_out and releases escrow", async () => {
    const booking    = makeBooking({ status: "checked_in" });
    const checkedOut = makeBooking({ status: "checked_out" });

    mockBookingRepo.findById.mockResolvedValue(booking);
    mockBookingRepo.updateStatus.mockResolvedValue(checkedOut);
    mockEscrowRepo.release.mockResolvedValue(null);

    const result = await bookingService.checkOut(BOOKING_ID, "host-id");

    expect(result.status).toBe("checked_out");
    expect(mockEscrowRepo.release).toHaveBeenCalledWith(BOOKING_ID, expect.anything());
  });

  it("throws 409 when booking is confirmed (not checked in)", async () => {
    mockBookingRepo.findById.mockResolvedValue(makeBooking({ status: "confirmed" }));

    await expect(bookingService.checkOut(BOOKING_ID, "host-id")).rejects.toMatchObject({ statusCode: 409 });
  });
});
