import { disconnectDB, disconnectRabbitMQ, redisClient, logger } from "@booking/shared";
import { stopOutboxPoller }        from "./workers/outboxPoller";
import { stopWebhookRetryWorker }  from "./workers/webhookRetryWorker";

let shuttingDown = false;

export function registerGracefulShutdown(): void {
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info("events_worker_shutdown_initiated", { signal });

    const timeout = setTimeout(() => process.exit(1), 10_000);
    try {
      stopOutboxPoller();
      stopWebhookRetryWorker();
      await disconnectRabbitMQ();
      await disconnectDB();
      await redisClient.quit();
      clearTimeout(timeout);
      process.exit(0);
    } catch (err) {
      clearTimeout(timeout);
      logger.error("events_worker_shutdown_error", { error: (err as Error).message });
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT",  () => void shutdown("SIGINT"));
}