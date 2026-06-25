import { AppError } from "../../utils/AppError";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import request from "supertest";
import { app } from "../../app";
import {
  makeGuestToken,
  makeHostToken,
  makePayment,
  BOOKING_ID,
  TENANT_ID,
  GUEST_ID,
  HOST_ID,
  PAYMENT_ID,
} from "../setup/fixtures";

jest.mock("../../domains/payment/payment.service");
jest.mock("../../domains/payment/payment.repository");
jest.mock("../../domains/tenant/tenant.repository");

import { paymentService }    from "../../domains/payment/payment.service";
import { paymentRepository } from "../../domains/payment/payment.repository";
import { tenantRepository }  from "../../domains/tenant/tenant.repository";

const mockPaymentService = paymentService    as jest.Mocked<typeof paymentService>;
const mockPaymentRepo    = paymentRepository as jest.Mocked<typeof paymentRepository>;
const mockTenantRepo     = tenantRepository  as jest.Mocked<typeof tenantRepository>;

const GUEST_TOKEN = makeGuestToken(GUEST_ID);
const HOST_TOKEN  = makeHostToken(HOST_ID, TENANT_ID);
const TENANT_SLUG = "test-hotel";

function mockActiveTenant() {
  mockTenantRepo.findBySlug.mockResolvedValue({
    id: TENANT_ID, slug: TENANT_SLUG, name: "Test Hotel",
    owner_user_id: HOST_ID, platform_fee_pct: 10,
    cancellation_policy: [], status: "active",
    settings: { timezone: "Africa/Lagos", currency: "NGN", locale: "en-NG" },
    created_at: new Date(), updated_at: new Date(),
  });
}

describe("POST /api/v1/payments/initialize", () => {
  beforeEach(() => mockActiveTenant());

  it("200 - initializes payment and returns redirect URL", async () => {
    mockPaymentService.initializePayment.mockResolvedValue({
      paymentId:     PAYMENT_ID,
      transactionId: "ref_abc123",
      redirectUrl:   "https://checkout.paystack.com/ref_abc123",
      amountNgn:     100000,
    });

    const res = await request(app)
      .post("/api/v1/payments/initialize")
      .set("Authorization", `Bearer ${GUEST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG)
      .send({ bookingId: BOOKING_ID, gateway: "paystack", callbackUrl: "https://myapp.com/callback" });

    expect(res.status).toBe(200);
    expect(res.body.data.redirectUrl).toBeDefined();
    expect(res.body.data.transactionId).toBe("ref_abc123");
    expect(mockPaymentService.initializePayment).toHaveBeenCalledWith(
      expect.objectContaining({
        bookingId:   BOOKING_ID,
        guestUserId: GUEST_ID,
        gateway:     "paystack",
      })
    );
  });

  it("400 - rejects invalid gateway", async () => {
    const res = await request(app)
      .post("/api/v1/payments/initialize")
      .set("Authorization", `Bearer ${GUEST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG)
      .send({ bookingId: BOOKING_ID, gateway: "stripe", callbackUrl: "https://myapp.com/callback" });

    expect(res.status).toBe(400);
  });

  it("400 - rejects invalid callbackUrl", async () => {
    const res = await request(app)
      .post("/api/v1/payments/initialize")
      .set("Authorization", `Bearer ${GUEST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG)
      .send({ bookingId: BOOKING_ID, gateway: "paystack", callbackUrl: "not-a-url" });

    expect(res.status).toBe(400);
  });

  it("409 - propagates booking not in pending_payment state", async () => {
    mockPaymentService.initializePayment.mockRejectedValue(
      AppError.conflict("Booking is in status: confirmed.")
    );

    const res = await request(app)
      .post("/api/v1/payments/initialize")
      .set("Authorization", `Bearer ${GUEST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG)
      .send({ bookingId: BOOKING_ID, gateway: "paystack", callbackUrl: "https://myapp.com/cb" });

    expect(res.status).toBe(409);
  });

  it("401 - rejects unauthenticated", async () => {
    const res = await request(app)
      .post("/api/v1/payments/initialize")
      .set("x-tenant-slug", TENANT_SLUG)
      .send({ bookingId: BOOKING_ID, gateway: "paystack", callbackUrl: "https://myapp.com/cb" });

    expect(res.status).toBe(401);
  });
});

describe("GET /api/v1/payments/booking/:bookingId", () => {
  beforeEach(() => mockActiveTenant());

  it("200 - returns payment for booking", async () => {
    const payment = makePayment({ booking_id: BOOKING_ID, status: "success" });
    mockPaymentRepo.findByBookingId.mockResolvedValue(payment);

    const res = await request(app)
      .get(`/api/v1/payments/booking/${BOOKING_ID}`)
      .set("Authorization", `Bearer ${GUEST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(PAYMENT_ID);
    expect(res.body.data.status).toBe("success");
  });

  it("404 - returns 404 when no payment for booking", async () => {
    mockPaymentRepo.findByBookingId.mockResolvedValue(null);

    const res = await request(app)
      .get(`/api/v1/payments/booking/${BOOKING_ID}`)
      .set("Authorization", `Bearer ${GUEST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG);

    expect(res.status).toBe(404);
  });

  it("401 - rejects unauthenticated", async () => {
    const res = await request(app)
      .get(`/api/v1/payments/booking/${BOOKING_ID}`)
      .set("x-tenant-slug", TENANT_SLUG);

    expect(res.status).toBe(401);
  });
});

describe("GET /api/v1/payments/tenant", () => {
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

  it("200 - returns tenant payments for host", async () => {
    const payments = [makePayment(), makePayment()];
    mockPaymentRepo.listByTenant.mockResolvedValue(payments);

    const res = await request(app)
      .get("/api/v1/payments/tenant")
      .set("Authorization", `Bearer ${HOST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it("403 - guest cannot list tenant payments", async () => {
    const res = await request(app)
      .get("/api/v1/payments/tenant")
      .set("Authorization", `Bearer ${GUEST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG);

    expect(res.status).toBe(403);
  });
});

describe("POST /api/v1/webhooks/paystack", () => {
  it("200 - acknowledges paystack webhook immediately", async () => {
    const payload = JSON.stringify({
      event: "charge.success",
      data:  { reference: "ref_123", status: "success", amount: 10000000, id: 1, channel: "card", paid_at: new Date().toISOString(), metadata: {} },
    });

    const res = await request(app)
      .post("/api/v1/webhooks/paystack")
      .set("Content-Type", "application/json")
      .set("x-paystack-signature", "fake-sig")
      .send(Buffer.from(payload));

    // Always 200 regardless of signature (processing is async)
    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
  });

  it("200 - acknowledges flutterwave webhook", async () => {
    const res = await request(app)
      .post("/api/v1/webhooks/flutterwave")
      .set("Content-Type", "application/json")
      .set("verif-hash", "fake-hash")
      .send(JSON.stringify({ event: "charge.completed", data: { tx_ref: "ref_456", status: "successful", amount: 1000 } }));

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
  });

  it("400 - rejects unknown gateway", async () => {
    const res = await request(app)
      .post("/api/v1/webhooks/stripe")
      .set("Content-Type", "application/json")
      .send("{}");

    expect(res.status).toBe(400);
  });
});
