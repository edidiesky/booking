/**
 * Runs the REAL bookingPaymentSaga definition against faked HTTP participants
 * (axios mocked) - so step order, payloads, adopt mode and compensation are
 * checked against the production saga, not a re-implementation of it.
 */
/// <reference types="jest" />
const mockRequest = jest.fn();
jest.mock("axios", () => ({
  __esModule: true,
  default: { create: () => ({ request: (cfg: unknown) => mockRequest(cfg) }) },
}));

import { SagaOrchestrator } from "../services/SagaOrchestrator";
import { InMemorySagaStore } from "../repositories/inMemorySagaStore";
import { bookingPaymentSaga, BookingPaymentSagaContext } from "../bookingPaymentSaga";

const calls: Array<{ method: string; url: string; data?: any; headers?: any }> = [];
let responder: (c: (typeof calls)[number]) => { status?: number; data?: any };

beforeEach(() => {
  calls.length = 0;
  mockRequest.mockImplementation(async (cfg: any) => {
    const c = { method: cfg.method, url: cfg.url, data: cfg.data, headers: cfg.headers };
    calls.push(c);
    const r = responder(c);
    if (r.status && r.status >= 400) {
      throw Object.assign(new Error(`Request failed with status code ${r.status}`), {
        response: { status: r.status, data: r.data },
      });
    }
    return { data: r.data ?? {} };
  });
});

const base: BookingPaymentSagaContext = {
  tenantId: "t1", propertyId: "p1", roomTypeId: "r1", guestUserId: "g1",
  guestEmail: "a@b.co", checkIn: "2026-11-01", checkOut: "2026-11-03",
  roomsCount: 1, guestCount: 2, totalAmountNgn: 10000, platformFeeNgn: 1000,
  hostPayoutNgn: 9000, gateway: "paystack", callbackUrl: "https://x/cb",
};

function happy(c: { url: string; method: string }) {
  if (c.url.endsWith("/reserve")) return { data: { bookingId: "bk1" } };
  if (c.url.endsWith("/initiate")) return { data: { paymentId: "pay1", transactionId: "tx1", redirectUrl: "https://pay/1", amountNgn: 10000 } };
  if (c.method === "get") return { data: { status: "pending_payment" } };
  return { data: {} };
}

describe("booking_payment saga (real definition, faked HTTP)", () => {
  it("create mode: reserve -> pay(pause w/ redirectUrl) -> confirm (escrow deferred to check-out)", async () => {
    responder = happy;
    const orch = new SagaOrchestrator(new InMemorySagaStore());
    const paused = await orch.start(bookingPaymentSaga, { ...base });
    expect(paused.status).toBe("running");
    expect(paused.context).toMatchObject({
      bookingId: "bk1",
      redirectUrl: "https://pay/1",
      transactionId: "tx1",
      paymentId: "pay1",
    });

    const done = await orch.resumeByBookingId(bookingPaymentSaga, "bk1");
    expect((done as any).status).toBe("completed");
    expect(calls.map((c) => c.url.replace(/https?:\/\/[^/]+/, ""))).toEqual([
      "/internal/bookings/reserve",
      "/internal/payments/initiate",
      "/internal/bookings/bk1/confirm",
    ]);
    // Escrow is released at check-out, not in the payment saga
    expect(calls.some((c) => c.url.includes("release-escrow"))).toBe(false);
    expect(calls[2]!.data).toEqual({ tenantId: "t1" });
    expect(calls[0]!.headers["Idempotency-Key"]).toMatch(/^saga:.+:reserve$/);
  });

  it("adopt mode: does NOT create a second booking and never releases the owner's booking", async () => {
    responder = (c) => (c.url.endsWith("/initiate") ? { status: 502, data: { error: "gateway down" } } : happy(c));
    const orch = new SagaOrchestrator(new InMemorySagaStore());
    const r = await orch.start(bookingPaymentSaga, { ...base, bookingId: "bk-existing" });
    expect(r.status).toBe("compensated");
    const urls = calls.map((c) => c.url);
    expect(urls.some((u) => u.endsWith("/reserve"))).toBe(false);
    expect(urls.some((u) => u.endsWith("/release"))).toBe(false);
    expect(r.error).toContain("gateway down"); // real cause surfaced, not "status code 500"
  });

  it("adopt mode rejects a booking that is not pending_payment (409, no payment started)", async () => {
    responder = (c) => (c.method === "get" ? { data: { status: "confirmed" } } : happy(c));
    const orch = new SagaOrchestrator(new InMemorySagaStore());
    const r = await orch.start(bookingPaymentSaga, { ...base, bookingId: "bk-existing" });
    expect(r.status).toBe("compensated");
    expect(r.errorStatus).toBe(409);
    expect(calls.some((c) => c.url.endsWith("/initiate"))).toBe(false);
  });

  it("create mode: payment failure releases the booking it created", async () => {
    responder = (c) => (c.url.endsWith("/initiate") ? { status: 400, data: { error: "bad" } } : happy(c));
    const orch = new SagaOrchestrator(new InMemorySagaStore());
    const r = await orch.start(bookingPaymentSaga, { ...base });
    expect(r.status).toBe("compensated");
    expect(r.errorStatus).toBe(400);
    expect(calls.some((c) => c.url.endsWith("/bk1/release"))).toBe(true);
  });

  it("confirm permanently rejected (booking expired) -> payment refunded", async () => {
    responder = (c) =>
      c.url.endsWith("/confirm")
        ? { status: 409, data: { error: "expired" } }
        : happy(c);
    const orch = new SagaOrchestrator(new InMemorySagaStore());
    await orch.start(bookingPaymentSaga, { ...base });
    const r: any = await orch.resumeByBookingId(bookingPaymentSaga, "bk1");
    expect(r.status).toBe("compensated");
    expect(calls.some((c) => c.url.endsWith("/bk1/refund"))).toBe(true);
  });

  it("happy path does not call ledger (escrow stays until check-out)", async () => {
    responder = happy;
    const orch = new SagaOrchestrator(new InMemorySagaStore());
    await orch.start(bookingPaymentSaga, { ...base });
    await orch.resumeByBookingId(bookingPaymentSaga, "bk1");
    expect(calls.some((c) => c.url.includes("/ledger/"))).toBe(false);
  });
});
