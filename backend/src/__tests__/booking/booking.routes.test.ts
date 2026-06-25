import { AppError } from "../../utils/AppError";
import request from "supertest";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { app } from "../../app";
import {
  makeGuestToken,
  makeHostToken,
  makeBooking,
  BOOKING_ID,
  TENANT_ID,
  GUEST_ID,
  HOST_ID,
  PROPERTY_ID,
  ROOM_TYPE_ID,
} from "../setup/fixtures";

//  Domain mocks 
jest.mock("../../domains/booking/booking.service");
jest.mock("../../domains/tenant/tenant.repository");

import { bookingService } from "../../domains/booking/booking.service";
import { tenantRepository } from "../../domains/tenant/tenant.repository";

const mockBookingService  = bookingService  as jest.Mocked<typeof bookingService>;
const mockTenantRepo      = tenantRepository as jest.Mocked<typeof tenantRepository>;

const GUEST_TOKEN  = makeGuestToken(GUEST_ID);
const HOST_TOKEN   = makeHostToken(HOST_ID, TENANT_ID);

const TENANT_SLUG = "test-hotel";

function mockActiveTenant() {
  mockTenantRepo.findBySlug.mockResolvedValue({
    id:                  TENANT_ID,
    slug:                TENANT_SLUG,
    name:                "Test Hotel",
    owner_user_id:       HOST_ID,
    platform_fee_pct:    10,
    cancellation_policy: [],
    status:              "active",
    settings:            { timezone: "Africa/Lagos", currency: "NGN", locale: "en-NG" },
    created_at:          new Date(),
    updated_at:          new Date(),
  });
}

describe("POST /api/v1/bookings", () => {
  const validBody = {
    propertyId:  PROPERTY_ID,
    roomTypeId:  ROOM_TYPE_ID,
    checkIn:     "2025-12-01",
    checkOut:    "2025-12-03",
    roomsCount:  1,
    guestCount:  2,
  };

  beforeEach(() => {
    mockActiveTenant();
  });

  it("201 - initiates booking for authenticated guest", async () => {
    const dto = {
      bookingId:  BOOKING_ID,
      bookingRef: "BK-TEST-001",
      status:     "pending_payment",
      sessionId:  "sess-123",
      totalAmountNgn: 100000,
      guestUserId: GUEST_ID,
      checkIn:    "2025-12-01",
      checkOut:   "2025-12-03",
      nights:     2,
      roomsCount: 1,
      guestCount: 2,
      platformFeeNgn: 10000,
      hostPayoutNgn:  90000,
      propertyId: PROPERTY_ID,
      roomTypeId: ROOM_TYPE_ID,
      tenantId:   TENANT_ID,
      createdAt:  new Date(),
    };

    mockBookingService.initiateBooking.mockResolvedValue(dto as never);

    const res = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${GUEST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG)
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bookingId).toBe(BOOKING_ID);
    expect(mockBookingService.initiateBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId:    TENANT_ID,
        propertyId:  PROPERTY_ID,
        roomTypeId:  ROOM_TYPE_ID,
        guestUserId: GUEST_ID,
        checkIn:     "2025-12-01",
        checkOut:    "2025-12-03",
        roomsCount:  1,
        guestCount:  2,
      })
    );
  });

  it("401 - rejects unauthenticated request", async () => {
    const res = await request(app)
      .post("/api/v1/bookings")
      .set("x-tenant-slug", TENANT_SLUG)
      .send(validBody);

    expect(res.status).toBe(401);
    expect(mockBookingService.initiateBooking).not.toHaveBeenCalled();
  });

  it("403 - rejects host trying to book (only guests allowed)", async () => {
    const res = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${HOST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG)
      .send(validBody);

    expect(res.status).toBe(403);
  });

  it("400 - rejects missing required fields", async () => {
    const res = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${GUEST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG)
      .send({ propertyId: PROPERTY_ID }); // missing roomTypeId, checkIn, checkOut, guestCount

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("400 - rejects invalid date format", async () => {
    const res = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${GUEST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG)
      .send({ ...validBody, checkIn: "01-12-2025" }); // wrong format

    expect(res.status).toBe(400);
  });

  it("400 - rejects roomsCount > 20", async () => {
    const res = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${GUEST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG)
      .send({ ...validBody, roomsCount: 25 });

    expect(res.status).toBe(400);
  });

  it("409 - propagates conflict from service (dates unavailable)", async () => {
    mockBookingService.initiateBooking.mockRejectedValue(
      AppError.conflict("Selected dates are not available.")
    );

    const res = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${GUEST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG)
      .send(validBody);

    expect(res.status).toBe(409);
  });
});

describe("GET /api/v1/bookings/mine", () => {
  beforeEach(() => {
    mockActiveTenant();
  });

  it("200 - returns guest bookings", async () => {
    const booking = makeBooking({ guest_user_id: GUEST_ID });
    mockBookingService.getGuestBookings.mockResolvedValue([booking as never]);

    const res = await request(app)
      .get("/api/v1/bookings/mine")
      .set("Authorization", `Bearer ${GUEST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(mockBookingService.getGuestBookings).toHaveBeenCalledWith(GUEST_ID, 1, 20);
  });

  it("200 - respects page and limit query params", async () => {
    mockBookingService.getGuestBookings.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/v1/bookings/mine?page=2&limit=5")
      .set("Authorization", `Bearer ${GUEST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG);

    expect(res.status).toBe(200);
    expect(mockBookingService.getGuestBookings).toHaveBeenCalledWith(GUEST_ID, 2, 5);
  });

  it("401 - rejects unauthenticated", async () => {
    const res = await request(app)
      .get("/api/v1/bookings/mine")
      .set("x-tenant-slug", TENANT_SLUG);

    expect(res.status).toBe(401);
  });
});

describe("GET /api/v1/bookings/tenant", () => {
  beforeEach(() => {
    mockActiveTenant();
  });

  it("200 - returns tenant bookings for host:admin", async () => {
    mockBookingService.getTenantBookings.mockResolvedValue([makeBooking() as never]);

    const res = await request(app)
      .get("/api/v1/bookings/tenant")
      .set("Authorization", `Bearer ${HOST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(mockBookingService.getTenantBookings).toHaveBeenCalledWith(
      TENANT_ID,
      expect.objectContaining({ page: 1, limit: 20 })
    );
  });

  it("200 - filters by status", async () => {
    mockBookingService.getTenantBookings.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/v1/bookings/tenant?status=confirmed")
      .set("Authorization", `Bearer ${HOST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG);

    expect(res.status).toBe(200);
    expect(mockBookingService.getTenantBookings).toHaveBeenCalledWith(
      TENANT_ID,
      expect.objectContaining({ status: "confirmed" })
    );
  });

  it("403 - guest cannot access tenant bookings", async () => {
    const res = await request(app)
      .get("/api/v1/bookings/tenant")
      .set("Authorization", `Bearer ${GUEST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG);

    expect(res.status).toBe(403);
  });
});

describe("GET /api/v1/bookings/:bookingId", () => {
  beforeEach(() => {
    mockActiveTenant();
  });

  it("200 - returns booking to owner guest", async () => {
    const booking = { ...makeBooking({ id: BOOKING_ID, guest_user_id: GUEST_ID }), guestUserId: GUEST_ID };
    mockBookingService.getBookingById.mockResolvedValue(booking as never);

    const res = await request(app)
      .get(`/api/v1/bookings/${BOOKING_ID}`)
      .set("Authorization", `Bearer ${GUEST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(BOOKING_ID);
  });

  it("403 - guest cannot see another guest booking", async () => {
    const otherGuestId = "other-guest-id";
    const booking = { ...makeBooking({ id: BOOKING_ID, guest_user_id: otherGuestId }), guestUserId: otherGuestId };
    mockBookingService.getBookingById.mockResolvedValue(booking as never);

    const res = await request(app)
      .get(`/api/v1/bookings/${BOOKING_ID}`)
      .set("Authorization", `Bearer ${GUEST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG);

    expect(res.status).toBe(403);
  });

  it("404 - returns 404 when booking not found", async () => {
    mockBookingService.getBookingById.mockRejectedValue(
      AppError.notFound("Booking not found.")
    );

    const res = await request(app)
      .get(`/api/v1/bookings/${BOOKING_ID}`)
      .set("Authorization", `Bearer ${GUEST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG);

    expect(res.status).toBe(404);
  });

  it("401 - rejects unauthenticated", async () => {
    const res = await request(app)
      .get(`/api/v1/bookings/${BOOKING_ID}`)
      .set("x-tenant-slug", TENANT_SLUG);

    expect(res.status).toBe(401);
  });
});

describe("PATCH /api/v1/bookings/:bookingId/cancel", () => {
  beforeEach(() => {
    mockActiveTenant();
  });

  it("200 - cancels booking", async () => {
    const cancelled = makeBooking({ id: BOOKING_ID, status: "cancelled" });
    mockBookingService.cancelBooking.mockResolvedValue(cancelled as never);

    const res = await request(app)
      .patch(`/api/v1/bookings/${BOOKING_ID}/cancel`)
      .set("Authorization", `Bearer ${GUEST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG)
      .send({ reason: "Plans changed" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Booking cancelled.");
    expect(mockBookingService.cancelBooking).toHaveBeenCalledWith(
      BOOKING_ID,
      GUEST_ID,
      "Plans changed"
    );
  });

  it("200 - cancels without reason (reason is optional)", async () => {
    const cancelled = makeBooking({ id: BOOKING_ID, status: "cancelled" });
    mockBookingService.cancelBooking.mockResolvedValue(cancelled as never);

    const res = await request(app)
      .patch(`/api/v1/bookings/${BOOKING_ID}/cancel`)
      .set("Authorization", `Bearer ${GUEST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG)
      .send({});

    expect(res.status).toBe(200);
    expect(mockBookingService.cancelBooking).toHaveBeenCalledWith(BOOKING_ID, GUEST_ID, undefined);
  });

  it("409 - cannot cancel already checked-in booking", async () => {
    mockBookingService.cancelBooking.mockRejectedValue(
      AppError.conflict("Cannot cancel a booking with status: checked_in")
    );

    const res = await request(app)
      .patch(`/api/v1/bookings/${BOOKING_ID}/cancel`)
      .set("Authorization", `Bearer ${GUEST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG)
      .send({});

    expect(res.status).toBe(409);
  });

  it("401 - rejects unauthenticated", async () => {
    const res = await request(app)
      .patch(`/api/v1/bookings/${BOOKING_ID}/cancel`)
      .set("x-tenant-slug", TENANT_SLUG)
      .send({});

    expect(res.status).toBe(401);
  });
});

describe("PATCH /api/v1/bookings/:bookingId/checkin", () => {
  beforeEach(() => {
    mockActiveTenant();
    jest.spyOn(mockTenantRepo, 'findById').mockImplementation(() => Promise.resolve({
      id: TENANT_ID, slug: TENANT_SLUG, name: "Test Hotel",
      owner_user_id: HOST_ID, platform_fee_pct: 10,
      cancellation_policy: [], status: "active",
      settings: { timezone: "Africa/Lagos", currency: "NGN", locale: "en-NG" },
      created_at: new Date(), updated_at: new Date(),
    }));
  });

  it("200 - checks in confirmed booking", async () => {
    const checkedIn = makeBooking({ id: BOOKING_ID, status: "checked_in" });
    mockBookingService.checkIn.mockResolvedValue(checkedIn as never);

    const res = await request(app)
      .patch(`/api/v1/bookings/${BOOKING_ID}/checkin`)
      .set("Authorization", `Bearer ${HOST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Guest checked in.");
    expect(mockBookingService.checkIn).toHaveBeenCalledWith(BOOKING_ID, HOST_ID);
  });

  it("403 - guest cannot check in", async () => {
    const res = await request(app)
      .patch(`/api/v1/bookings/${BOOKING_ID}/checkin`)
      .set("Authorization", `Bearer ${GUEST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG);

    expect(res.status).toBe(403);
  });

  it("409 - cannot check in pending_payment booking", async () => {
    mockBookingService.checkIn.mockRejectedValue(
      AppError.conflict("Only confirmed bookings can be checked in.")
    );

    const res = await request(app)
      .patch(`/api/v1/bookings/${BOOKING_ID}/checkin`)
      .set("Authorization", `Bearer ${HOST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG);

    expect(res.status).toBe(409);
  });
});

describe("PATCH /api/v1/bookings/:bookingId/checkout", () => {
  beforeEach(() => {
    mockActiveTenant();
    jest.spyOn(mockTenantRepo, 'findById').mockImplementation(() => Promise.resolve({
      id: TENANT_ID, slug: TENANT_SLUG, name: "Test Hotel",
      owner_user_id: HOST_ID, platform_fee_pct: 10,
      cancellation_policy: [], status: "active",
      settings: { timezone: "Africa/Lagos", currency: "NGN", locale: "en-NG" },
      created_at: new Date(), updated_at: new Date(),
    }));
  });

  it("200 - checks out checked-in booking", async () => {
    const checkedOut = makeBooking({ id: BOOKING_ID, status: "checked_out" });
    mockBookingService.checkOut.mockResolvedValue(checkedOut as never);

    const res = await request(app)
      .patch(`/api/v1/bookings/${BOOKING_ID}/checkout`)
      .set("Authorization", `Bearer ${HOST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Guest checked out. Escrow released.");
    expect(mockBookingService.checkOut).toHaveBeenCalledWith(BOOKING_ID, HOST_ID);
  });

  it("403 - guest cannot check out", async () => {
    const res = await request(app)
      .patch(`/api/v1/bookings/${BOOKING_ID}/checkout`)
      .set("Authorization", `Bearer ${GUEST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG);

    expect(res.status).toBe(403);
  });

  it("409 - cannot check out confirmed (not checked in) booking", async () => {
    mockBookingService.checkOut.mockRejectedValue(
      AppError.conflict("Only checked-in bookings can be checked out.")
    );

    const res = await request(app)
      .patch(`/api/v1/bookings/${BOOKING_ID}/checkout`)
      .set("Authorization", `Bearer ${HOST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG);

    expect(res.status).toBe(409);
  });
});
