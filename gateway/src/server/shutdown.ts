import type { Server } from "http";
import { logger, type RateLimitEngine, type RulesSyncPubSub } from "@booking/shared";
import redisClient from "../config/redis";

export function registerShutdownHooks(
  server: Server,
  engine: RateLimitEngine,
  rulesSync: RulesSyncPubSub,
): void {
  const shutdown = async (signal: string): Promise<void> => {
    logger.info("gateway_shutdown_initiated", { event: "gateway_shutdown_initiated", signal });

    engine.stop();
    await rulesSync.disconnect();
    await redisClient.quit();

    server.close(() => {
      logger.info("gateway_shutdown_complete", { event: "gateway_shutdown_complete" });
      process.exit(0);
    });

    setTimeout(() => process.exit(1), 10_000);
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT",  () => void shutdown("SIGINT"));
}