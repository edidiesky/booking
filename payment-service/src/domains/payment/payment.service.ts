import { Pool } from "pg";
import axios from "axios";
import { paymentRepository, withTenant } from "./payment.repository";
import {
  idempotencyRepository,
  buildRequestHash,
  IdempotencyConflictError,
} from "./idempotency.repository";
import { paymentGateways } from "./gateways";
import { publishAuditLog } from "../../auditPublisher";
import { logger } from "../../logger";

export class ValidationError extends Error {
  status = 400;
}
export class ForbiddenError extends Error {
  status = 403;
}
export class ConflictError extends Error {
  status = 409;
}
export class NotFoundError extends Error {
  status = 404;
}

const BOOKING_SERVICE_URL =
  process.env.BOOKING_SERVICE_URL ?? "http://booking-service:4101";
const ORCHESTRATION_SERVICE_URL =
  process.env.ORCHESTRATION_SERVICE_URL ?? "http://orchestration-service:4104";
const LEDGER_SERVICE_URL =
  process.env.LEDGER_SERVICE_URL ?? "http://ledger-service:4103";

interface InitializePaymentInput {
  bookingId: string;
  guestUserId: string;
  email: string;
  gateway: "paystack" | "flutterwave";
  callbackUrl: string;
  phone?: string;
  tenantId: string;
  idempotencyKey?: string;
}

interface BookingDto {
  tenantId: string;
  guestUserId: string;
  totalAmountNgn: number;
  status: string;
}

async function fetchBooking(bookingId: string): Promise<BookingDto> {
  try {
    const res = await axios.get(
      `${BOOKING_SERVICE_URL}/internal/bookings/${bookingId}`,
      { timeout: 10_000 },
    );
    const d = res.data as Record<string, unknown>;
    return {
      tenantId: (d.tenantId ?? d.tenant_id) as string,
      guestUserId: (d.guestUserId ?? d.guest_user_id) as string,
      totalAmountNgn: Number(d.totalAmountNgn ?? d.total_amount_ngn),
      status: d.status as string,
    };
  } catch (err) {
    const status = (err as { response?: { status?: number } }).response?.status;
    if (status === 404) throw new NotFoundError("Booking not found.");
    throw Object.assign(
      new Error(`Booking service unavailable: ${(err as Error).message}`),
      { status: 503 },
    );
  }
}

export const paymentService = {
  async initializePayment(pool: Pool, input: InitializePaymentInput) {
    if (!input.email?.trim()) {
      throw new ValidationError("A valid guest email is required.");
    }

    const booking = await fetchBooking(input.bookingId);
    if (booking.tenantId !== input.tenantId) {
      throw new NotFoundError("Booking not found.");
    }
    if (!booking.guestUserId || booking.guestUserId !== input.guestUserId) {
      throw new ForbiddenError("Access denied.");
    }
    if (booking.status !== "pending_payment") {
      throw new ConflictError(
        `Booking is in status: ${booking.status}. Cannot initiate payment.`,
      );
    }

    const endpoint = "/internal/payments/initiate";
    const requestHash = buildRequestHash("POST", endpoint, input.guestUserId, {
      bookingId: input.bookingId,
      gateway: input.gateway,
      callbackUrl: input.callbackUrl,
      phone: input.phone,
      key: input.idempotencyKey,
    });

    let claimResult;
    try {
      claimResult = await idempotencyRepository.claim(
        pool,
        requestHash,
        endpoint,
        input.guestUserId,
      );
    } catch (err) {
      if (err instanceof IdempotencyConflictError) {
        throw new ConflictError(
          "This payment request is already being processed. Retry in a few seconds.",
        );
      }
      throw err;
    }
    if (claimResult.kind === "replay") return claimResult.key.response_body;
    const claim = claimResult.key;

    try {
      const existing = await withTenant(pool, booking.tenantId, (c) =>
        paymentRepository.findLatestByBooking(
          c,
          input.bookingId,
          input.gateway,
          true,
        ),
      );

      if (existing?.status === "success") {
        throw new ConflictError("This booking has already been paid.");
      }

      if (existing?.status === "pending" && existing.transaction_id) {
        const result = {
          paymentId: existing.id,
          transactionId: existing.transaction_id,
          redirectUrl: existing.metadata?.redirectUrl as string | undefined,
          amountNgn: booking.totalAmountNgn,
        };
        await idempotencyRepository.markCompleted(
          pool,
          claim.id,
          result as Record<string, unknown>,
        );
        return result;
      }

      const row =
        existing?.status === "pending"
          ? existing
          : await withTenant(pool, booking.tenantId, (c) =>
              paymentRepository.create(c, {
                bookingId: input.bookingId,
                tenantId: booking.tenantId,
                guestUserId: input.guestUserId,
                amountNgn: booking.totalAmountNgn,
                gateway: input.gateway,
              }),
            );

      let gatewayResult;
      try {
        gatewayResult = await paymentGateways.initialize(input.gateway, {
          amountNgn: booking.totalAmountNgn,
          callbackUrl: input.callbackUrl,
          currency: "NGN",
          email: input.email,
          phone: input.phone ?? "",
          userId: input.guestUserId,
          customerName: input.guestUserId,
          metadata: {
            bookingId: input.bookingId,
            tenantId: booking.tenantId,
          },
        });
      } catch {
        await withTenant(pool, booking.tenantId, (c) =>
          paymentRepository.markFailed(c, row.id, "gateway unavailable"),
        );
        await idempotencyRepository.markFailed(
          pool,
          claim.id,
          "gateway unavailable",
        );
        throw new ValidationError(
          `Payment gateway ${input.gateway} is currently unavailable.`,
        );
      }

      if (!gatewayResult.success || !gatewayResult.transactionId) {
        await withTenant(pool, booking.tenantId, (c) =>
          paymentRepository.markFailed(
            c,
            row.id,
            gatewayResult.message ?? "link failed",
          ),
        );
        await idempotencyRepository.markFailed(
          pool,
          claim.id,
          gatewayResult.message ?? "link failed",
        );
        throw new ValidationError(
          `Payment link creation failed: ${gatewayResult.message}`,
        );
      }

      await withTenant(pool, booking.tenantId, async (c) => {
        await paymentRepository.markPending(
          c,
          row.id,
          gatewayResult.transactionId!,
          gatewayResult.redirectUrl,
        );
        await paymentRepository.writeOutboxEvent(c, "payment.initiated", {
          paymentId: row.id,
          bookingId: input.bookingId,
          tenantId: booking.tenantId,
          guestUserId: input.guestUserId,
          amountNgn: booking.totalAmountNgn,
          transactionId: gatewayResult.transactionId,
          gateway: input.gateway,
        });
      });

      const result = {
        paymentId: row.id,
        transactionId: gatewayResult.transactionId,
        redirectUrl: gatewayResult.redirectUrl,
        amountNgn: booking.totalAmountNgn,
      };
      await idempotencyRepository.markCompleted(
        pool,
        claim.id,
        result as Record<string, unknown>,
      );

      publishAuditLog({
        tenantId: input.tenantId,
        userId: input.guestUserId,
        action: "payment.initiated",
        resource: "payment",
        resourceId: result.paymentId,
        newValue: {
          gateway: input.gateway,
          transactionId: result.transactionId,
        },
      });
      return result;
    } catch (err) {
      if (
        err instanceof ValidationError ||
        err instanceof ConflictError ||
        err instanceof ForbiddenError
      ) {
        throw err;
      }
      await idempotencyRepository.markFailed(
        pool,
        claim.id,
        err instanceof Error ? err.message : "unknown",
      );
      throw err;
    }
  },

  async handleWebhook(
    pool: Pool,
    input: {
      transactionId: string;
      amount: number;
      gateway: "paystack" | "flutterwave";
      amountUnit?: "ngn" | "kobo";
    },
  ) {
    const payment = await paymentRepository.findByTransactionId(
      pool,
      input.transactionId,
    );
    if (!payment) throw new NotFoundError();
    if (payment.status === "success" || payment.status === "refunded") {
      return { ok: true, idempotent: true, bookingId: payment.booking_id };
    }

    const amountNgn =
      input.amountUnit === "kobo" ? input.amount / 100 : input.amount;
    if (Math.abs(amountNgn - Number(payment.amount_ngn)) > 0.01) {
      throw new ValidationError("Amount mismatch");
    }

    await withTenant(pool, payment.tenant_id, (c) =>
      paymentRepository.markSuccess(c, payment.id),
    );

    let resumeStatus = 0;
    let sagaStatus: string | undefined;
    try {
      const resume = await axios.post(
        `${ORCHESTRATION_SERVICE_URL}/internal/sagas/booking-payment/by-booking/${payment.booking_id}/resume`,
        {},
        { timeout: 15_000, validateStatus: () => true },
      );
      resumeStatus = resume.status;
      sagaStatus = (resume.data as { status?: string } | undefined)?.status;
    } catch (err) {
      logger.error("payment_webhook_resume_network_error", {
        bookingId: payment.booking_id,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }

    if (resumeStatus >= 500) {
      throw new Error(`Orchestrator resume failed with status ${resumeStatus}`);
    }

    const sagaClosed =
      resumeStatus === 404 ||
      sagaStatus === "compensated" ||
      sagaStatus === "failed" ||
      sagaStatus === "unknown";

    if (sagaClosed) {
      logger.warn("payment_received_for_closed_saga_refunding", {
        bookingId: payment.booking_id,
        resumeStatus,
        sagaStatus,
      });
      try {
        await this.requestRefund(pool, payment.booking_id, payment.tenant_id);
      } catch (refundErr) {
        logger.error("late_payment_refund_failed", {
          bookingId: payment.booking_id,
          error:
            refundErr instanceof Error ? refundErr.message : String(refundErr),
        });
        throw refundErr;
      }
      return {
        ok: true,
        bookingId: payment.booking_id,
        refunded: true,
        sagaStatus: sagaStatus ?? "not_found",
      };
    }

    return {
      ok: true,
      bookingId: payment.booking_id,
      sagaStatus: sagaStatus ?? "resumed",
      refunded: false,
    };
  },

  async getStatusByBooking(
    pool: Pool,
    bookingId: string,
    tenantId?: string,
  ) {
    const tenant = tenantId ?? (await fetchBooking(bookingId)).tenantId;
    const payment = await withTenant(pool, tenant, (c) =>
      paymentRepository.findLatestByBooking(c, bookingId),
    );
    if (!payment) throw new NotFoundError("Payment not found.");
    return {
      paymentId: payment.id,
      status: payment.status,
      transactionId: payment.transaction_id,
    };
  },

  async requestRefund(pool: Pool, bookingId: string, tenantId?: string) {
    const tenant = tenantId ?? (await fetchBooking(bookingId)).tenantId;

    const payment = await withTenant(pool, tenant, (c) =>
      paymentRepository.findLatestByBooking(c, bookingId),
    );
    if (!payment) return { action: "none", gatewayCalled: false };

    if (payment.status === "pending") {
      await withTenant(pool, tenant, (c) =>
        paymentRepository.markFailed(
          c,
          payment.id,
          "cancelled: saga compensation",
        ),
      );
      return { action: "cancelled", gatewayCalled: false };
    }

    if (payment.status === "success" && payment.transaction_id) {
      const amountNgn = Number(payment.amount_ngn);
      const result = await paymentGateways.refund(payment.gateway, {
        transactionId: payment.transaction_id,
        amountNgn,
      });
      const alreadyRefunded =
        !result.success && /already/i.test(result.message ?? "");
      if (!result.success && !alreadyRefunded) {
        throw new ValidationError(`Gateway refund failed: ${result.message}`);
      }
      await withTenant(pool, tenant, (c) =>
        paymentRepository.markRefunded(c, payment.id),
      );

      try {
        await axios.post(
          `${LEDGER_SERVICE_URL}/internal/ledger/refund`,
          {
            bookingId,
            tenantId: tenant,
            paymentId: payment.id,
            amountNgn,
          },
          { timeout: 10_000 },
        );
      } catch (ledgerErr) {
        logger.error("ledger_refund_journal_failed", {
          bookingId,
          paymentId: payment.id,
          error:
            ledgerErr instanceof Error ? ledgerErr.message : String(ledgerErr),
        });
      }

      return {
        action: "refunded",
        gatewayCalled: true,
        message: result.message,
      };
    }

    return { action: "none", gatewayCalled: false, status: payment.status };
  },
};