import { logger } from "./logger";
import axios from "axios";
import { SagaDefinition, SagaPauseError } from "./services/SagaOrchestrator";

export interface BookingPaymentSagaContext {
  bookingId?: string;
  tenantId: string;
  roomTypeId: string;
  guestUserId: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  roomsCount: number;
  totalAmountNgn: number;
  platformFeeNgn: number;
  gateway: "paystack" | "flutterwave";
  callbackUrl: string;
}

const BOOKING_SERVICE_URL =
  process.env.BOOKING_SERVICE_URL ?? "http://booking-service:4101";
const PAYMENT_SERVICE_URL =
  process.env.PAYMENT_SERVICE_URL ?? "http://payment-service:4102";
const LEDGER_SERVICE_URL =
  process.env.LEDGER_SERVICE_URL ?? "http://ledger-service:4103";

const http = axios.create({ timeout: 15_000 });

export const bookingPaymentSaga: SagaDefinition<BookingPaymentSagaContext> = {
  sagaType: "booking_payment",
  steps: [
    {
      name: "reserve_availability_and_create_booking",
      async execute(ctx) {
        const res = await http.post(
          `${BOOKING_SERVICE_URL}/internal/bookings/reserve`,
          {
            tenantId: ctx.tenantId,
            roomTypeId: ctx.roomTypeId,
            guestUserId: ctx.guestUserId,
            guestEmail: ctx.guestEmail,
            checkIn: ctx.checkIn,
            checkOut: ctx.checkOut,
            roomsCount: ctx.roomsCount,
            totalAmountNgn: ctx.totalAmountNgn,
          },
          {
            headers: {
              "Idempotency-Key": `reserve:${ctx.tenantId}:${ctx.roomTypeId}:${ctx.checkIn}:${ctx.guestUserId}`,
            },
          },
        );
        return { bookingId: res.data.bookingId as string };
      },
      async compensate(ctx) {
        if (!ctx.bookingId) return;
        await http.post(
          `${BOOKING_SERVICE_URL}/internal/bookings/${ctx.bookingId}/release`,
        );
      },
    },
    {
      name: "initiate_payment",
      async execute(ctx) {
        await http.post(
          `${PAYMENT_SERVICE_URL}/internal/payments/initiate`,
          {
            bookingId: ctx.bookingId,
            guestUserId: ctx.guestUserId,
            email: ctx.guestEmail,
            gateway: ctx.gateway,
            callbackUrl: ctx.callbackUrl,
            tenantId: ctx.tenantId,
          },
          {
            headers: {
              "Idempotency-Key": `pay:${ctx.bookingId}:${ctx.gateway}`,
            },
          },
        );
        throw new SagaPauseError("waiting for payment webhook confirmation");
      },
      async compensate(ctx) {
        if (!ctx.bookingId) return;
        await http.post(
          `${PAYMENT_SERVICE_URL}/internal/payments/booking/${ctx.bookingId}/refund`,
        );
      },
    },
    {
      // Confirm before escrow release so money is not moved while booking is still pending
      name: "confirm_booking",
      async execute(ctx) {
        await http.post(
          `${BOOKING_SERVICE_URL}/internal/bookings/${ctx.bookingId}/confirm`,
        );
        return {};
      },
      async compensate() {
        // Confirmed booking after paid: no automatic silent reverse
      },
    },
    {
      name: "release_escrow",
      async execute(ctx) {
        await http.post(`${LEDGER_SERVICE_URL}/internal/ledger/release-escrow`, {
          bookingId: ctx.bookingId,
          tenantId: ctx.tenantId,
          totalAmountNgn: ctx.totalAmountNgn,
          platformFeeNgn: ctx.platformFeeNgn,
        });
        return {};
      },
      async compensate(ctx) {
        logger.error("saga_compensation_requires_admin_review", { bookingId: ctx.bookingId });
      },
    },
  ],
};
