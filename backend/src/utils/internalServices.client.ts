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
    throw AppError.badRequest(msg);
  }
  throw err instanceof Error ? err : new Error(fallback);
}

export interface InitiatePaymentInput {
  bookingId: string;
  guestUserId: string;
  email: string;
  gateway: PaymentGateway;
  callbackUrl: string;
  phone?: string;
  tenantId: string;
}

export interface InitiatePaymentResult {
  paymentId?: string;
  transactionId: string;
  redirectUrl: string;
  amountNgn?: number;
}

export interface BookingPaymentSagaInput {
  tenantId: string;
  roomTypeId: string;
  guestUserId: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
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
   * Public initialize on :4000 → payment-service internal initiate.
   * Failures surface as AppError (fail closed on initiate; no silent success).
   */
  async initiatePayment(
    input: InitiatePaymentInput,
  ): Promise<InitiatePaymentResult> {
    try {
      const { data } = await axios.post(
        `${PAYMENT_SERVICE_URL}/internal/payments/initiate`,
        {
          bookingId: input.bookingId,
          guestUserId: input.guestUserId,
          email: input.email,
          gateway: input.gateway,
          callbackUrl: input.callbackUrl,
          phone: input.phone,
          tenantId: input.tenantId,
        },
        { timeout: 20_000 },
      );
      return data as InitiatePaymentResult;
    } catch (err) {
      logger.error("payment_orchestration_initiate_failed", {
        event: "payment_orchestration_initiate_failed",
        bookingId: input.bookingId,
        error: err instanceof Error ? err.message : String(err),
      });
      mapAxiosError(err, "Payment service initiate failed");
    }
  },

  /**
   * After successful webhook on :4000 → resume paused saga by booking id.
   * Errors are logged only so the provider still receives HTTP 200.
   */
  async resumeSagaByBookingId(bookingId: string): Promise<void> {
    try {
      await axios.post(
        `${ORCHESTRATION_SERVICE_URL}/internal/sagas/by-booking/${bookingId}/resume`,
        {},
        { timeout: 15_000 },
      );
      logger.info("payment_orchestration_resume_requested", {
        event: "payment_orchestration_resume_requested",
        bookingId,
      });
    } catch (err) {
      logger.error("payment_orchestration_resume_failed", {
        event: "payment_orchestration_resume_failed",
        bookingId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },
};
