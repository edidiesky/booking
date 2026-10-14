import { Pool } from "pg";
import axios from "axios";
import { paymentRepository } from "./payment.repository";
import {
  idempotencyRepository,
  buildRequestHash,
  IdempotencyConflictError,
} from "./idempotency.repository";
import { processPayment } from "./resilience";
import { publishAuditLog } from "../../auditPublisher";

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

interface InitializePaymentInput {
  bookingId: string;
  guestUserId: string;
  email: string;
  gateway: "paystack" | "flutterwave";
  callbackUrl: string;
  phone?: string;
  tenantId: string;
}

interface BookingDto {
  id?: string;
  bookingId?: string;
  tenantId: string;
  guestUserId: string;
  totalAmountNgn: number;
  status: string;
}

async function fetchBooking(bookingId: string): Promise<BookingDto> {
  const res = await axios.get(
    `${BOOKING_SERVICE_URL}/internal/bookings/${bookingId}`,
    { timeout: 10_000 },
  );
  const data = res.data as Record<string, unknown>;
  // Support both camelCase (preferred) and snake_case if mapper missing
  return {
    id: (data.id ?? data.bookingId) as string,
    bookingId: (data.bookingId ?? data.id) as string,
    tenantId: (data.tenantId ?? data.tenant_id) as string,
    guestUserId: (data.guestUserId ?? data.guest_user_id) as string,
    totalAmountNgn: Number(data.totalAmountNgn ?? data.total_amount_ngn),
    status: data.status as string,
  };
}

export const paymentService = {
  async initializePayment(pool: Pool, input: InitializePaymentInput) {
    if (!input.email?.trim()) {
      throw new ValidationError("A valid guest email is required.");
    }

    const booking = await fetchBooking(input.bookingId);
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

    if (claimResult.kind === "replay") {
      return claimResult.key.response_body;
    }

    const claim = claimResult.key;

    try {
      let paymentRow = await paymentRepository.findLatestByBooking(
        pool,
        booking.tenantId,
        input.bookingId,
        input.gateway,
      );

      if (
        paymentRow &&
        paymentRow.status === "pending" &&
        paymentRow.transaction_id
      ) {
        const result = {
          paymentId: paymentRow.id,
          transactionId: paymentRow.transaction_id,
          redirectUrl: paymentRow.redirect_url,
          amountNgn: booking.totalAmountNgn,
        };
        await idempotencyRepository.markCompleted(
          pool,
          claim.id,
          result as unknown as Record<string, unknown>,
        );
        return result;
      }

      if (!paymentRow) {
        paymentRow = await paymentRepository.create(
          pool,
          input.bookingId,
          booking.tenantId,
          booking.totalAmountNgn,
          input.gateway,
        );
      }

      let gatewayResult;
      try {
        gatewayResult = await processPayment(input.gateway, {
          amount: booking.totalAmountNgn,
          callbackUrl: input.callbackUrl,
          currency: "NGN",
          email: input.email,
          phone: input.phone ?? "",
          userId: input.guestUserId,
          name: input.guestUserId,
          metadata: { bookingId: input.bookingId, tenantId: booking.tenantId },
        });
      } catch {
        await paymentRepository.markFailed(pool, paymentRow.id);
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
        await paymentRepository.markFailed(pool, paymentRow.id);
        await idempotencyRepository.markFailed(
          pool,
          claim.id,
          gatewayResult.message ?? "link failed",
        );
        throw new ValidationError(
          `Payment link creation failed: ${gatewayResult.message}`,
        );
      }

      await paymentRepository.markPending(
        pool,
        paymentRow.id,
        gatewayResult.transactionId,
        gatewayResult.redirectUrl,
      );
      await paymentRepository.writeOutboxEvent(
        pool,
        "payment.initiated",
        {
          paymentId: paymentRow.id,
          bookingId: input.bookingId,
          transactionId: gatewayResult.transactionId,
          gateway: input.gateway,
        },
        booking.tenantId,
      );

      const result = {
        paymentId: paymentRow.id,
        transactionId: gatewayResult.transactionId,
        redirectUrl: gatewayResult.redirectUrl,
        amountNgn: booking.totalAmountNgn,
      };
      await idempotencyRepository.markCompleted(
        pool,
        claim.id,
        result as unknown as Record<string, unknown>,
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

  /**
   * Webhook: mark paid once, then resume saga.
   * Returns non-2xx path via thrown errors so controller can fail the gateway retry.
   */
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

    if (payment.status === "success") {
      return { ok: true, idempotent: true, bookingId: payment.booking_id };
    }

    // Normalize to NGN for comparison
    const amountNgn =
      input.amountUnit === "kobo" ? input.amount / 100 : input.amount;
    const expected = Number(payment.amount_ngn);
    if (Math.abs(amountNgn - expected) > 0.01) {
      throw new ValidationError("Amount mismatch");
    }

    await paymentRepository.markSuccess(pool, payment.id);

    const resume = await axios.post(
      `${ORCHESTRATION_SERVICE_URL}/internal/sagas/booking-payment/by-booking/${payment.booking_id}/resume`,
      {},
      { timeout: 15_000, validateStatus: () => true },
    );
    if (resume.status >= 500) {
      throw new Error(
        `Orchestrator resume failed with status ${resume.status}`,
      );
    }
    if (resume.status === 404) {
      // Saga may still be pausing; surface so gateway retries
      throw new ConflictError("Saga not ready for resume; retry");
    }

    return { ok: true, bookingId: payment.booking_id };
  },

  async requestRefund(pool: Pool, bookingId: string) {
    const { refundPayment } = await import("../resilience");
    const row = await pool.query(
      `SELECT * FROM payments
       WHERE booking_id = $1 AND status IN ('success', 'pending')
       ORDER BY created_at DESC LIMIT 1`,
      [bookingId],
    );
    const payment = row.rows[0];
    if (!payment) {
      await paymentRepository.markRefundRequested(pool, bookingId);
      return { refundRequested: true, gatewayCalled: false };
    }
    if (payment.status === "success" && payment.transaction_id) {
      const result = await refundPayment(payment.gateway, {
        transactionId: payment.transaction_id,
        amountNgn: Number(payment.amount_ngn),
      });
      await paymentRepository.markRefundRequested(pool, bookingId);
      if (!result.success) {
        throw new ValidationError(`Gateway refund failed: ${result.message}`);
      }
      return {
        refundRequested: true,
        gatewayCalled: true,
        message: result.message,
      };
    }
    await paymentRepository.markRefundRequested(pool, bookingId);
    return { refundRequested: true, gatewayCalled: false };
  },
};
