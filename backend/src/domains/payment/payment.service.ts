import { paymentRepository } from "./payment.repository";
import { bookingRepository } from "../booking/booking.repository";
import { paymentStrategies } from "../../strategies";
import { outboxRepository }  from "../outbox/outbox.repository";
import { auditRepository }   from "../audit/audit.repository";
import { userRepository }    from "../auth/auth.repository";
import { AppError }          from "../../utils/AppError";
import logger                from "../../utils/logger";
import { requestContext }    from "../../context/requestContext";
import { withTransaction }   from "../../config/database";
import { PaymentGateway }    from "../../types";
import { paymentInitializedCounter, trackError, webhookProcessedCounter } from "../../utils/metrics";
import { v4 as uuid }        from "uuid";
import {
  publishNotifyPaymentConfirmed,
  publishNotifyPaymentFailed,
} from "../../messaging/publisher";

export interface InitializePaymentInput {
  bookingId:   string;
  guestUserId: string;
  email:       string;
  gateway:     PaymentGateway;
  callbackUrl: string;
  phone?:      string;
}

export interface InitializePaymentResult {
  paymentId:     string;
  transactionId: string;
  redirectUrl:   string;
  amountNgn:     number;
}

export const paymentService = {
  async initializePayment(input: InitializePaymentInput): Promise<InitializePaymentResult> {
    const { bookingId, guestUserId, email, gateway, callbackUrl, phone } = input;

    const booking = await bookingRepository.findById(bookingId);
    if (!booking)                              throw AppError.notFound("Booking not found.");
    if (booking.guest_user_id !== guestUserId) throw AppError.forbidden("Access denied.");
    if (booking.status !== "pending_payment") {
      throw AppError.conflict(`Booking is in status: ${booking.status}. Cannot initiate payment.`);
    }

    const idempotencyKey = `pay:${bookingId}:${gateway}`;
    const existing       = await paymentRepository.findByIdempotencyKey(idempotencyKey);
    if (existing && existing.status === "pending" && existing.transaction_id) {
      const meta = existing.metadata as { redirectUrl?: string };
      return {
        paymentId:     existing.id,
        transactionId: existing.transaction_id,
        redirectUrl:   meta.redirectUrl ?? "",
        amountNgn:     Number(booking.total_amount_ngn),
      };
    }

    const adapter = paymentStrategies.getAdapter(gateway);

    const { transactionId, success, message, redirectUrl } = await adapter.process({
      amount:      Number(booking.total_amount_ngn),
      callbackUrl,
      currency:    "NGN",
      email,
      phone:       phone ?? "",
      userId:      guestUserId,
      name:        guestUserId,
      metadata:    { bookingId, bookingRef: booking.booking_ref, tenantId: booking.tenant_id },
    });

    if (!success || !transactionId) {
      trackError("payment_init_failed", "payment_service", "high");
      throw AppError.badRequest(`Payment link creation failed with ${gateway}: ${message}`);
    }

    let paymentId!: string;

    await withTransaction(async (client) => {
      const payment = await paymentRepository.create({
        bookingId, tenantId: booking.tenant_id, guestUserId, gateway,
        transactionId, amountNgn: Number(booking.total_amount_ngn),
        idempotencyKey, metadata: { redirectUrl, gateway },
      }, client);

      paymentId = payment.id;

      await outboxRepository.create("payment.initiated", {
        paymentId, bookingId, tenantId: booking.tenant_id, guestUserId,
        amountNgn: Number(booking.total_amount_ngn), transactionId, gateway,
      }, client);
    });

    paymentInitializedCounter.inc({ gateway, tenant_id: booking.tenant_id });

    await auditRepository.log({
      action:     "payment",
      resource:   "payment",
      resourceId: paymentId,
      tenantId:   booking.tenant_id,
      userId:     guestUserId,
      newValue:   { gateway, transactionId, amountNgn: Number(booking.total_amount_ngn) },
    });

    logger.info("payment_initialized", {
      event:     "payment_initialized",
      paymentId,
      bookingId,
      gateway,
      amount:    Number(booking.total_amount_ngn),
      requestId: requestContext.get()?.requestId,
    });

    return {
      paymentId,
      transactionId: transactionId!,
      redirectUrl:   redirectUrl!,
      amountNgn:     Number(booking.total_amount_ngn),
    };
  },

  async processWebhookSuccess(data: {
    transactionId: string;
    amount:        number;
    gateway:       PaymentGateway;
    channel?:      string;
    rawPayload:    Record<string, unknown>;
    metadata:      Record<string, unknown>;
  }, client: import("pg").PoolClient): Promise<void> {
    const payment = await paymentRepository.findByTransactionId(data.transactionId);
    if (!payment) throw AppError.notFound(`Payment not found for transaction: ${data.transactionId}`);

    if (data.amount < Number(payment.amount_ngn)) {
      await paymentRepository.updateStatus({
        id:       payment.id,
        status:   "failed",
        metadata: {
          failureReason:  "Amount mismatch",
          receivedAmount: data.amount,
          expectedAmount: Number(payment.amount_ngn),
        },
      }, client);

      await outboxRepository.create("payment.failed", {
        bookingId:     payment.booking_id,
        tenantId:      payment.tenant_id,
        guestUserId:   payment.guest_user_id,
        amountNgn:     Number(payment.amount_ngn),
        transactionId: data.transactionId,
        gateway:       data.gateway,
      }, client);

      webhookProcessedCounter.inc({ gateway: data.gateway, status: "amount_mismatch" });

      // Notify guest of failed payment (amount mismatch)
      void userRepository.findById(payment.guest_user_id).then((guest) => {
        if (!guest) return;
        void Promise.allSettled([
          publishNotifyPaymentFailed({
            notificationId: uuid(),
            guestEmail:     guest.email,
            guestName:      [guest.first_name, guest.last_name].filter(Boolean).join(" ") || "Guest",
            bookingRef:     payment.booking_id, // best effort - swap for real ref if available
            amountNgn:      Number(payment.amount_ngn),
            gateway:        data.gateway,
            transactionId:  data.transactionId,
            tenantId:       payment.tenant_id,
            bookingId:      payment.booking_id,
            failureReason:  "Payment amount received did not match the booking amount.",
          }),
        ]);
      }).catch((err) =>
        logger.error("notify_payment_failed_publish_error", {
          event:         "notify_payment_failed_publish_error",
          transactionId: data.transactionId,
          error:         (err as Error).message,
        })
      );

      throw AppError.badRequest("Payment amount mismatch.");
    }

    await paymentRepository.updateStatus({
      id:            payment.id,
      status:        "success",
      transactionId: data.transactionId,
      channel:       data.channel,
      paidAt:        new Date(),
      metadata: {
        gatewayConfirmation: {
          webhookPayload: data.rawPayload,
          receivedAmount: data.amount,
          metadata:       data.metadata,
        },
      },
    }, client);

    await outboxRepository.create("payment.confirmed", {
      paymentId:     payment.id,
      bookingId:     payment.booking_id,
      tenantId:      payment.tenant_id,
      guestUserId:   payment.guest_user_id,
      amountNgn:     Number(payment.amount_ngn),
      transactionId: data.transactionId,
      gateway:       data.gateway,
    }, client);

    webhookProcessedCounter.inc({ gateway: data.gateway, status: "success" });

    // Notify guest of successful payment
    void userRepository.findById(payment.guest_user_id).then((guest) => {
      if (!guest) return;
      void Promise.allSettled([
        publishNotifyPaymentConfirmed({
          notificationId: uuid(),
          guestEmail:     guest.email,
          guestName:      [guest.first_name, guest.last_name].filter(Boolean).join(" ") || "Guest",
          bookingRef:     payment.booking_id,
          amountNgn:      Number(payment.amount_ngn),
          gateway:        data.gateway,
          transactionId:  data.transactionId,
          tenantId:       payment.tenant_id,
          bookingId:      payment.booking_id,
        }),
      ]);
    }).catch((err) =>
      logger.error("notify_payment_confirmed_publish_error", {
        event:         "notify_payment_confirmed_publish_error",
        transactionId: data.transactionId,
        error:         (err as Error).message,
      })
    );

    logger.info("webhook_payment_success_committed", {
      event:         "webhook_payment_success_committed",
      transactionId: data.transactionId,
      bookingId:     payment.booking_id,
    });
  },

  async processWebhookFailure(data: {
    transactionId: string;
    gateway:       PaymentGateway;
    rawPayload:    Record<string, unknown>;
    metadata:      Record<string, unknown>;
  }, client: import("pg").PoolClient): Promise<void> {
    const payment = await paymentRepository.findByTransactionId(data.transactionId);
    if (!payment) throw AppError.notFound(`Payment not found for transaction: ${data.transactionId}`);

    await paymentRepository.updateStatus({
      id:       payment.id,
      status:   "failed",
      metadata: {
        gatewayResponse: (data.metadata["gateway_response"] as string) ?? "Payment failed via webhook",
        rawPayload:      data.rawPayload,
      },
    }, client);

    await outboxRepository.create("payment.failed", {
      paymentId:     payment.id,
      bookingId:     payment.booking_id,
      tenantId:      payment.tenant_id,
      guestUserId:   payment.guest_user_id,
      amountNgn:     Number(payment.amount_ngn),
      transactionId: data.transactionId,
      gateway:       data.gateway,
    }, client);

    webhookProcessedCounter.inc({ gateway: data.gateway, status: "failed" });

    // Notify guest of failed payment
    void userRepository.findById(payment.guest_user_id).then((guest) => {
      if (!guest) return;
      void Promise.allSettled([
        publishNotifyPaymentFailed({
          notificationId: uuid(),
          guestEmail:     guest.email,
          guestName:      [guest.first_name, guest.last_name].filter(Boolean).join(" ") || "Guest",
          bookingRef:     payment.booking_id,
          amountNgn:      Number(payment.amount_ngn),
          gateway:        data.gateway,
          transactionId:  data.transactionId,
          tenantId:       payment.tenant_id,
          bookingId:      payment.booking_id,
          failureReason:  (data.metadata["gateway_response"] as string) ?? undefined,
        }),
      ]);
    }).catch((err) =>
      logger.error("notify_payment_failed_publish_error", {
        event:         "notify_payment_failed_publish_error",
        transactionId: data.transactionId,
        error:         (err as Error).message,
      })
    );

    logger.info("webhook_payment_failure_committed", {
      event:         "webhook_payment_failure_committed",
      transactionId: data.transactionId,
    });
  },

  async verifyPayment(transactionId: string, gateway: PaymentGateway): Promise<{ verified: boolean; status: string }> {
    const adapter = paymentStrategies.getAdapter(gateway);
    try {
      const response = await adapter.process({
        amount: 0, callbackUrl: "", currency: "NGN", email: "",
        phone: "", userId: "", name: "", metadata: { verify: transactionId },
      });
      return { verified: response.success, status: response.message };
    } catch {
      throw AppError.serviceUnavailable("Unable to verify payment at this time.");
    }
  },
};