import { disconnectDB, disconnectRabbitMQ, redisClient, logger } from "@booking/shared";

let shuttingDown = false;

export function registerGracefulShutdown(): void {
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.info("availability_worker_shutdown_initiated", { event: "availability_worker_shutdown_initiated", signal });
    const timeout = setTimeout(() => {
      logger.error("availability_worker_shutdown_timeout", { event: "availability_worker_shutdown_timeout" });
      process.exit(1);
    }, 10_000);

    try {
      await disconnectRabbitMQ();
      await disconnectDB();
      await redisClient.quit();
      clearTimeout(timeout);
      logger.info("availability_worker_shutdown_complete", { event: "availability_worker_shutdown_complete" });
      process.exit(0);
    } catch (err) {
      clearTimeout(timeout);
      logger.error("availability_worker_shutdown_error", { event: "availability_worker_shutdown_error", error: (err as Error).message });
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT",  () => void shutdown("SIGINT"));
}
