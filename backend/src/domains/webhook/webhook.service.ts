import redisClient from "../../config/redis";
import { paymentStrategies } from "../../strategies";
import { paymentRepository } from "../payment/payment.repository";
import { paymentService } from "../payment/payment.service";
import { webhookRepository } from "./webhook.repository";
import { AppError } from "../../utils/AppError";
import logger from "../../utils/logger";
import { withTransaction } from "@booking/shared";
import { PaymentGateway } from "../../types";
import { trackError } from "../../utils/metrics";
import {
  isWorkflowDelegationEnabled,
  paymentOrchestrationClient,
} from "../../utils/internalServices.client";
import { bookingService } from "../booking/booking.service";

export const webhookService = {
  /**
   * Process a webhook from any gateway.
   * Flow: verify signature → Redis lock → load payment → RLS tx → outbox
   */
async process(
  gateway: PaymentGateway,
  rawBody: Record<string, unknown>,
  signature: string | undefined,
  skipSignatureVerification = false,
): Promise<void> {
  const adapter = paymentStrategies.getAdapter(gateway);

  if (!skipSignatureVerification && adapter.verifyWebhook) {
    const valid = adapter.verifyWebhook(rawBody, signature);
    if (!valid) throw AppError.unauthorized("Invalid webhook signature.");
  }

  if (
    !adapter.extractTransactionId ||
    !adapter.extractStatus ||
    !adapter.extractAmount
  ) {
    throw AppError.badRequest(
      `Webhook parsing not supported for gateway: ${gateway}`,
    );
  }

  const transactionId = adapter.extractTransactionId(rawBody);
  const status = adapter.extractStatus(rawBody);
  const amount = adapter.extractAmount(rawBody);
  const metadata = adapter.extractMetadata
    ? adapter.extractMetadata(rawBody)
    : {};
  const channel = metadata["channel"] as string | undefined;

  if (!transactionId) {
    throw AppError.badRequest("Missing transaction reference.");
  }

  const lockKey = `webhook:lock:${transactionId}`;
  const locked = await redisClient.setnx(lockKey, "1");
  if (!locked) throw AppError.conflict("Webhook processing in progress.");
  await redisClient.expire(lockKey, 60);

  try {
    // SECURITY DEFINER — works without tenant GUC
    const payment =
      await paymentRepository.findByTransactionId(transactionId);

    if (!payment) {
      throw AppError.notFound(
        `Payment not found for transaction: ${transactionId}`,
      );
    }

    if (payment.status === "success" || payment.status === "failed") {
      logger.info("webhook_already_processed", {
        event: "webhook_already_processed",
        transactionId,
        status: payment.status,
      });
      return;
    }

    const rls = {
      tenantId: payment.tenant_id,
      userId: payment.guest_user_id,
    };

    if (status !== "success" && status !== "failed") {
      await withTransaction(async (client) => {
        await paymentRepository.updateStatus(
          {
            id: payment.id,
            status: payment.status,
            metadata: {
              lastWebhookPayload: rawBody,
              lastWebhookStatus: status,
            },
          },
          client,
        );
      }, rls);
      return;
    }

    await withTransaction(async (client) => {
      if (status === "success") {
        await paymentService.processWebhookSuccess(
          {
            transactionId,
            amount,
            gateway,
            channel,
            rawPayload: rawBody,
            metadata,
          },
          client,
        );
      } else {
        await paymentService.processWebhookFailure(
          {
            transactionId,
            gateway,
            rawPayload: rawBody,
            metadata,
          },
          client,
        );
      }
    }, rls);

    // Confirm booking after payment commit (not inside payment repo)
    if (status === "success") {
      try {
        await bookingService.confirmBookingByPayment(
          payment.booking_id,
          transactionId,
        );
      } catch (err) {
        // Payment already committed; log and rely on retry/saga
        logger.error("booking_confirm_after_payment_failed", {
          event: "booking_confirm_after_payment_failed",
          bookingId: payment.booking_id,
          transactionId,
          error: (err as Error).message,
        });
        throw err;
      }

      if (isWorkflowDelegationEnabled()) {
        void paymentOrchestrationClient.resumeSagaByBookingId(
          payment.booking_id,
        );
      }
    }
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    trackError("webhook_processing_failed", `${gateway}_webhook`, "high");
    logger.error("webhook_processing_failed", {
      event: "webhook_processing_failed",
      gateway,
      transactionId,
      reason,
    });

    const isIgnorable =
      reason.includes("Amount mismatch") ||
      reason.includes("already") ||
      reason.includes("processing in progress");

    if (!isIgnorable) {
      await webhookRepository.logFailure({
        gateway,
        transactionId,
        rawPayload: rawBody,
        failureReason: reason,
      });
    }
    throw err;
  } finally {
    await redisClient.del(lockKey);
  }
},
  /**
   * Worker: retry failed webhook logs (cron / queue consumer).
   */
  async retryFailed(): Promise<void> {
    const pending = await webhookRepository.getPendingRetries();

    for (const log of pending) {
      try {
        await webhookService.process(
          log.gateway,
          log.raw_payload,
          undefined,
          true, // skip signature on retries
        );
        await webhookRepository.markCompleted(log.id);
        logger.info("webhook_retry_success", {
          event: "webhook_retry_success",
          id: log.id,
          transactionId: log.transaction_id,
        });
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        await webhookRepository.incrementRetry(log.id, reason);
        logger.warn("webhook_retry_failed", {
          event: "webhook_retry_failed",
          id: log.id,
          reason,
        });
      }
    }
  },
};