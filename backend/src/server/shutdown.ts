import http from "http";

import { disconnectDB }          from "@booking/shared";
import redisClient               from "../config/redis";
import { disconnectRabbitMQ }    from "../messaging/connection";
import { stopOutboxPoller }      from "../messaging/outboxPoller";
import { stopWebhookRetryWorker } from "../messaging/workers/webhookRetryWorker";
import { serverHealthGauge }     from "../utils/metrics";
import logger from "../utils/logger";

export function registerShutdownHooks(server: http.Server): void {
  const shutdown = async (signal: string): Promise<void> => {
    logger.info("shutdown_initiated", { event: "shutdown_initiated", signal });
    serverHealthGauge.set(0);

    server.close(async () => {
      try {
        stopOutboxPoller();
        stopWebhookRetryWorker();
        await disconnectRabbitMQ();
        await disconnectDB();
        await redisClient.quit();
        logger.info("shutdown_complete", { event: "shutdown_complete" });
        process.exit(0);
      } catch (err) {
        logger.error("shutdown_error", { event: "shutdown_error", error: (err as Error).message });
        process.exit(1);
      }
    });

    setTimeout(() => process.exit(1), 15_000);
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT",  () => void shutdown("SIGINT"));
}
