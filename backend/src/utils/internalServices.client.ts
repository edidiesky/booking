/**
 * HTTP client from the monolith (port 4000) to internal workflow services.
 * Used only by domains that talk to orchestration / payment-service.
 */
import axios, { AxiosError } from "axios";
import logger from "../utils/logger";
import { AppError } from "../utils/AppError";
import type { PaymentGateway } from "../types";

const BOOKING_SERVICE_URL =
  process.env.BOOKING_SERVICE_URL ?? "http://booking-service:4101";
const PAYMENT_SERVICE_URL =
  process.env.PAYMENT_SERVICE_URL ?? "http://payment-service:4102";
const LEDGER_SERVICE_URL =
  process.env.LEDGER_SERVICE_URL ?? "http://ledger-service:4103";
const ORCHESTRATION_SERVICE_URL =
  process.env.ORCHESTRATION_SERVICE_URL ?? "http://orchestration-service:4104";

/** Master switch: when false, monolith keeps the legacy in-process payment path. */
export function isWorkflowDelegationEnabled(): boolean {
  return process.env.WORKFLOW_DELEGATION_ENABLED === "true";
}

function mapAxiosError(err: unknown, fallback: string): never {
  if (err instanceof AxiosError) {
    const status = err.response?.status;
    const data = err.response?.data as
      | { error?: string; message?: string }
      | undefined;
    const msg = data?.error ?? data?.message ?? err.message ?? fallback;
    if (status === 400) throw AppError.badRequest(msg);
    if (status === 403) throw AppError.forbidden(msg);
    if (status === 404) throw AppError.notFound(msg);
    if (status === 409) throw AppError.conflict(msg);
    if (status === 503) throw AppError.serviceUnavailable(msg);
    // Upstream/gateway failures (500/502/504, timeouts) are not the caller's fault.
    if (status === undefined || status >= 500) throw AppError.serviceUnavailable(msg);
    throw AppError.badRequest(msg);
  }
  throw err instanceof Error ? err : new Error(fallback);
}

export interface InitiatePaymentInput {
  bookingId: string;
  guestUserId: string;
  gateway: PaymentGateway;
  callbackUrl: string;
  phone?: string;
  tenantId: string;
  roomTypeId: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  roomsCount: number;
  totalAmountNgn: number;
  platformFeeNgn: number;
}

export interface InitiatePaymentResult {
  paymentId?: string;
  transactionId: string;
  redirectUrl: string;
  amountNgn?: number;
}

export interface BookingPaymentSagaInput {
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
  callbackUrl: string;
  gateway: PaymentGateway;
  phone?: string;
  bookingId?: string;
}

export const paymentOrchestrationClient = {
  urls: {
    booking: BOOKING_SERVICE_URL,
    payment: PAYMENT_SERVICE_URL,
    ledger: LEDGER_SERVICE_URL,
    orchestration: ORCHESTRATION_SERVICE_URL,
  },

  /**
   * Start the full booking_payment saga
   * (reserve → initiate payment → pause → confirm → escrow).
   */
  async startBookingPaymentSaga(
    input: BookingPaymentSagaInput,
  ): Promise<{ sagaId: string; status: string; context: unknown }> {
    try {
      const { data } = await axios.post(
        `${ORCHESTRATION_SERVICE_URL}/sagas/booking-payment`,
        {
          tenantId: input.tenantId,
          propertyId: input.propertyId,
          roomTypeId: input.roomTypeId,
          guestUserId: input.guestUserId,
          guestEmail: input.guestEmail,
          checkIn: input.checkIn,
          checkOut: input.checkOut,
          roomsCount: input.roomsCount,
          guestCount: input.guestCount,
          totalAmountNgn: input.totalAmountNgn,
          platformFeeNgn: input.platformFeeNgn,
          hostPayoutNgn: input.hostPayoutNgn,
          gateway: input.gateway,
          callbackUrl: input.callbackUrl,
          ...(input.phone ? { phone: input.phone } : {}),
          // Adopt the booking this service already created, instead of reserving a second one.
          ...(input.bookingId ? { bookingId: input.bookingId } : {}),
        },
        { timeout: 30_000 },
      );
      return data as { sagaId: string; status: string; context: unknown };
    } catch (err) {
      const axiosErr = err as AxiosError;
      logger.error("payment_orchestration_start_saga_failed", {
        event: "payment_orchestration_start_saga_failed",
        error: err instanceof Error ? err.message : String(err),
        status: axiosErr.response?.status,
        responseData: axiosErr.response?.data,
      });
      mapAxiosError(err, "Orchestration service start saga failed");
    }
  },

  /**
   * Direct call to payment-service (legacy / non-saga path).
   */
  async initiatePayment(
    input: InitiatePaymentInput,
  ): Promise<InitiatePaymentResult> {
    try {
      const body = {
        bookingId: input.bookingId,
        guestUserId: input.guestUserId,
        email: input.guestEmail,
        gateway: input.gateway,
        callbackUrl: input.callbackUrl,
        phone: input.phone,
        tenantId: input.tenantId,
      };
      const { data } = await axios.post(
        `${PAYMENT_SERVICE_URL}/internal/payments/initiate`,
        body,
        { timeout: 20_000 },
      );
      return data as InitiatePaymentResult;
    } catch (err) {
      const axiosErr = err as AxiosError;
      logger.error("payment_orchestration_initiate_failed", {
        event: "payment_orchestration_initiate_failed",
        bookingId: input.bookingId,
        error: err instanceof Error ? err.message : String(err),
        status: axiosErr.response?.status,
        responseData: axiosErr.response?.data,
        code: axiosErr.code,
      });
      mapAxiosError(err, "Payment service initiate failed");
    }
  },

  /**
   * After successful webhook on :4000 → resume paused saga by booking id.
   */
  async resumeSagaByBookingId(bookingId: string): Promise<void> {
    // The payment is already recorded and the booking confirmed by the time we get here, so a lost
    // resume would leave the saga parked. Retry transient failures; the orchestrator's pause-timeout
    // check (payment status lookup) is the final backstop.
    const attempts = 4;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        await axios.post(
          `${ORCHESTRATION_SERVICE_URL}/internal/sagas/booking-payment/by-booking/${bookingId}/resume`,
          {},
          { timeout: 15_000 },
        );
        logger.info("payment_orchestration_resume_requested", {
          event: "payment_orchestration_resume_requested",
          bookingId,
          attempt,
        });
        return;
      } catch (err) {
        logger.error("payment_orchestration_resume_failed", {
          event: "payment_orchestration_resume_failed",
          bookingId,
          attempt,
          error: err instanceof Error ? err.message : String(err),
        });
        if (attempt < attempts) {
          await new Promise((r) => setTimeout(r, 500 * 2 ** (attempt - 1)));
        }
      }
    }
  },

  async handleWebhook(input: {
    gateway: PaymentGateway;
    transactionId: string;
    status: string;
    amount: number;
    channel?: string;
    rawBody: Record<string, unknown>;
    metadata: Record<string, unknown>;
    tenantId: string;
  }): Promise<void> {
    try {
      await axios.post(
        `${PAYMENT_SERVICE_URL}/internal/webhooks/${input.gateway}`,
        {
          transactionId: input.transactionId,
          status: input.status,
          amount: input.amount,
          channel: input.channel,
          rawBody: input.rawBody,
          metadata: input.metadata,
          tenantId: input.tenantId,
        },
        { timeout: 20_000 },
      );
    } catch (err) {
      logger.error("payment_orchestration_webhook_failed", {
        event: "payment_orchestration_webhook_failed",
        transactionId: input.transactionId,
        error: err instanceof Error ? err.message : String(err),
      });
      mapAxiosError(err, "Payment service webhook handling failed");
    }
  },
};