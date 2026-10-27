import { logger } from "./logger";
import axios, { AxiosError } from "axios";
import { SagaDefinition, SagaPauseError } from "./services/SagaOrchestrator";

export interface BookingPaymentSagaContext {
  tenantId: string;
  propertyId: string;
  roomTypeId: string;
  guestUserId: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  roomsCount: number;
  guestCount: number;
  totalAmountNgn: number;
  platformFeeNgn: number;
  hostPayoutNgn: number;
  gateway: "paystack" | "flutterwave";
  callbackUrl: string;
  phone?: string;
  bookingId?: string;
  bookingAdopted?: boolean;
  paymentId?: string;
  transactionId?: string;
  redirectUrl?: string;
  amountNgn?: number;
}

const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL ?? "http://booking-service:4101";
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL ?? "http://payment-service:4102";
// Escrow is released at check-out (monolith / host flow), not in this payment saga.
// LEDGER_SERVICE_URL is intentionally unused here.

const http = axios.create({ timeout: 15_000 });

/** An upstream call failed. `transient` => worth retrying (network / 5xx / 429). */
export class UpstreamError extends Error {
  constructor(
    message: string,
    public readonly upstreamStatus: number | undefined,
    public readonly transient: boolean,
  ) {
    super(message);
    this.name = "UpstreamError";
  }
}

async function call<T = any>(
  label: string,
  method: "get" | "post",
  url: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<T> {
  try {
    const res = await http.request({ method, url, data: body, headers });
    return res.data as T;
  } catch (err) {
    const e = err as AxiosError<{ error?: string; message?: string }>;
    const status = e.response?.status;
    const detail = e.response?.data?.error ?? e.response?.data?.message ?? e.message;
    // Surface the upstream body: "Request failed with status code 500" hid the real cause.
    logger.error("saga_upstream_call_failed", { label, url, status, detail });
    const transient = status === undefined || status >= 500 || status === 429;
    throw new UpstreamError(`${label}: ${status ?? "network"} ${detail}`, status, transient);
  }
}

export const bookingPaymentSaga: SagaDefinition<BookingPaymentSagaContext> = {
  sagaType: "booking_payment",
  steps: [
    {
      name: "reserve_availability_and_create_booking",
      async execute(ctx, { sagaId }) {
        if (ctx.bookingId) {
          const b = await call<{ status?: string }>(
            "load_booking", "get",
            `${BOOKING_SERVICE_URL}/internal/bookings/${ctx.bookingId}`,
            undefined, { "x-tenant-id": ctx.tenantId },
          );
          if (b.status !== "pending_payment") {
            throw new UpstreamError(
              `booking ${ctx.bookingId} is ${b.status}, expected pending_payment`, 409, false,
            );
          }
          return { bookingAdopted: true };
        }

        const data = await call<{ bookingId: string }>(
          "reserve", "post",
          `${BOOKING_SERVICE_URL}/internal/bookings/reserve`,
          {
            tenantId: ctx.tenantId, propertyId: ctx.propertyId, roomTypeId: ctx.roomTypeId,
            guestUserId: ctx.guestUserId, guestEmail: ctx.guestEmail,
            checkIn: ctx.checkIn, checkOut: ctx.checkOut,
            roomsCount: ctx.roomsCount, guestCount: ctx.guestCount,
            totalAmountNgn: ctx.totalAmountNgn, platformFeeNgn: ctx.platformFeeNgn,
            hostPayoutNgn: ctx.hostPayoutNgn,
          },
          { "Idempotency-Key": `saga:${sagaId}:reserve` },
        );
        return { bookingId: data.bookingId, bookingAdopted: false };
      },
      async compensate(ctx) {
        if (!ctx.bookingId || ctx.bookingAdopted) return;
        await call("release_booking", "post",
          `${BOOKING_SERVICE_URL}/internal/bookings/${ctx.bookingId}/release`,
          { tenantId: ctx.tenantId });
      },
    },
    {
      name: "initiate_payment",
      async execute(ctx, { sagaId }) {
        const data = await call<{
          paymentId?: string; transactionId?: string; redirectUrl?: string; amountNgn?: number;
        }>(
          "initiate_payment", "post",
          `${PAYMENT_SERVICE_URL}/internal/payments/initiate`,
          {
            bookingId: ctx.bookingId, guestUserId: ctx.guestUserId, email: ctx.guestEmail,
            gateway: ctx.gateway, callbackUrl: ctx.callbackUrl, tenantId: ctx.tenantId,
            ...(ctx.phone ? { phone: ctx.phone } : {}),
          },
          { "Idempotency-Key": `saga:${sagaId}:pay` },
        );
        // Persisted into the saga context by the orchestrator before it parks.
        throw new SagaPauseError("waiting for payment webhook confirmation", {
          paymentId: data.paymentId,
          transactionId: data.transactionId,
          redirectUrl: data.redirectUrl,
          amountNgn: data.amountNgn,
        });
      },
      async onPauseTimeout(ctx) {
        if (!ctx.bookingId) return "compensate";
        const p = await call<{ status?: string }>(
          "check_payment_status", "get",
          `${PAYMENT_SERVICE_URL}/internal/payments/booking/${ctx.bookingId}`,
          undefined, { "x-tenant-id": ctx.tenantId },
        );
        // Paid, but the resume signal never reached us: finish the booking, never refund.
        return p.status === "success" ? "resume" : "compensate";
      },
      async compensate(ctx) {
        if (!ctx.bookingId) return;
        // Idempotent: cancels a pending payment, refunds a successful one, no-ops otherwise.
        await call("cancel_or_refund_payment", "post",
          `${PAYMENT_SERVICE_URL}/internal/payments/booking/${ctx.bookingId}/refund`,
          { tenantId: ctx.tenantId });
      },
    },
    {
      name: "confirm_booking",
      forwardOnly: true,
      onPermanentFailure: "compensate", // e.g. booking expired while the guest was paying -> refund
      async execute(ctx) {
        await call("confirm_booking", "post",
          `${BOOKING_SERVICE_URL}/internal/bookings/${ctx.bookingId}/confirm`,
          { tenantId: ctx.tenantId });
        return {};
      },
      async compensate() {
        // Booking confirmation has no automatic reverse once paid.
        // Host payout stays in escrow until check-out (see monolith checkOut → ledger release-escrow).
      },
    },
  ],
};

// execute(context:TContext, stesp: Imeta): Promise<Partial<TContext>>