import { webhookService } from "../../domains/webhook/webhook.service";
import logger             from "../../utils/logger";
import { trackError }     from "../../utils/metrics";

const RETRY_INTERVAL_MS = parseInt(process.env.WEBHOOK_RETRY_INTERVAL_MS ?? "60000", 10);

let retryTimer: NodeJS.Timeout | null = null;

async function retryOnce(): Promise<void> {
  try {
    await webhookService.retryFailed();
  } catch (err) {
    trackError("webhook_retry_worker_error", "webhook_retry_worker", "high");
    logger.error("webhook_retry_worker_error", {
      event: "webhook_retry_worker_error",
      error: (err as Error).message,
    });
  }
}

export function startWebhookRetryWorker(): void {
  if (retryTimer) return;

  retryTimer = setInterval(() => {
    void retryOnce();
  }, RETRY_INTERVAL_MS);

  logger.info("webhook_retry_worker_started", {
    event:      "webhook_retry_worker_started",
    intervalMs: RETRY_INTERVAL_MS,
  });
}

export function stopWebhookRetryWorker(): void {
  if (retryTimer) {
    clearInterval(retryTimer);
    retryTimer = null;
    logger.info("webhook_retry_worker_stopped", { event: "webhook_retry_worker_stopped" });
  }
}
