import redisClient        from "../../config/redis";
import { paymentStrategies } from "../../strategies";
import { paymentRepository } from "../payment/payment.repository";
import { paymentService }    from "../payment/payment.service";
import { bookingService }    from "../booking/booking.service";
import { webhookRepository } from "./webhook.repository";
import { AppError }          from "../../utils/AppError";
import logger                from "../../utils/logger";
import { withTransaction }   from "../../config/database";
import { PaymentGateway }    from "../../types";
import { trackError }        from "../../utils/metrics";

export const webhookService = {
  /**
   * Process a webhook from any gateway.
   * Flow: verify signature -> idempotency -> Redis lock -> transaction -> outbox
   * Mirrors your existing webhook.service.ts exactly.
   */
  async process(
    gateway:                   PaymentGateway,
    rawBody:                   Record<string, unknown>,
    signature:                 string | undefined,
    skipSignatureVerification = false
  ): Promise<void> {
    const adapter = paymentStrategies.getAdapter(gateway);

    if (!skipSignatureVerification && adapter.verifyWebhook) {
      const valid = adapter.verifyWebhook(rawBody, signature);
      if (!valid) throw AppError.unauthorized("Invalid webhook signature.");
    }

    if (!adapter.extractTransactionId || !adapter.extractStatus || !adapter.extractAmount) {
      throw AppError.badRequest(`Webhook parsing not supported for gateway: ${gateway}`);
    }

    const transactionId = adapter.extractTransactionId(rawBody);
    const status        = adapter.extractStatus(rawBody);
    const amount        = adapter.extractAmount(rawBody);
    const metadata      = adapter.extractMetadata ? adapter.extractMetadata(rawBody) : {};
    const channel       = (metadata["channel"] as string | undefined);

    if (!transactionId) throw AppError.badRequest("Missing transaction reference.");

    // Redis distributed lock - prevents concurrent processing of same webhook
    const lockKey = `webhook:lock:${transactionId}`;
    const locked  = await redisClient.setnx(lockKey, "1");
    if (!locked) throw AppError.conflict("Webhook processing in progress.");
    await redisClient.expire(lockKey, 60);

    try {
      const payment = await paymentRepository.findByTransactionId(transactionId);
      if (!payment) {
        throw AppError.notFound(`Payment not found for transaction: ${transactionId}`);
      }

      // Terminal state idempotency
      if (
        (payment.status === "success" && status === "success") ||
        (payment.status === "failed"  && status === "failed")
      ) {
        logger.info("webhook_terminal_state_ignored", {
          event: "webhook_terminal_state_ignored", transactionId, status, gateway,
        });
        return;
      }

      if (status === "success") {
        await withTransaction(async (client) => {
          await paymentService.processWebhookSuccess({
            transactionId, amount, gateway, channel, rawPayload: rawBody, metadata,
          }, client);
        });

        // Confirm the booking now that payment is verified
        await bookingService.confirmBookingByPayment(payment.booking_id, transactionId);

      } else if (status === "failed") {
        await withTransaction(async (client) => {
          await paymentService.processWebhookFailure({
            transactionId, gateway, rawPayload: rawBody, metadata,
          }, client);
        });

      } else {
        // Pending/unknown - store in metadata only
        await paymentRepository.updateStatus({
          id:       payment.id,
          status:   payment.status,
          metadata: { lastWebhookPayload: rawBody, lastWebhookStatus: status },
        });
        logger.info("webhook_non_terminal_stored", { event: "webhook_non_terminal_stored", transactionId, status });
      }

    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      trackError("webhook_processing_failed", `${gateway}_webhook`, "high");

      logger.error("webhook_processing_failed", {
        event: "webhook_processing_failed", gateway, transactionId, reason,
      });

      // Only log to DB if it's a real failure, not a duplicate/conflict
      const isIgnorable = reason.includes("Amount mismatch") || reason.includes("already") || reason.includes("processing in progress");
      if (!isIgnorable) {
        await webhookRepository.logFailure({ gateway, transactionId, rawPayload: rawBody, failureReason: reason });
      }

      throw err;
    } finally {
      await redisClient.del(lockKey);
    }
  },

  /**
   * Worker: retry failed webhook logs (called by separate worker cron).
   */
  async retryFailed(): Promise<void> {
    const pending = await webhookRepository.getPendingRetries();

    for (const log of pending) {
      try {
        await webhookService.process(log.gateway, log.raw_payload, undefined, true);
        await webhookRepository.markCompleted(log.id);
        logger.info("webhook_retry_success", { event: "webhook_retry_success", id: log.id, transactionId: log.transaction_id });
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        await webhookRepository.incrementRetry(log.id, reason);
        logger.warn("webhook_retry_failed", { event: "webhook_retry_failed", id: log.id, reason });
      }
    }
  },
};
