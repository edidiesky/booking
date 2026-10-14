import { Pool } from "pg";
import { logger } from "./logger";

let shuttingDown = false;

export function registerGracefulShutdown(
  pool: Pool,
  stopPolling: () => void,
): void {
  const shutdown = async (signal: string, exitCode: number) => {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.info("notification_worker_shutdown_initiated", { signal });
    const timeout = setTimeout(() => {
      logger.error("notification_worker_shutdown_timeout");
      process.exit(1);
    }, 10_000);

    try {
      stopPolling();
      await pool.end();
      clearTimeout(timeout);
      logger.info("notification_worker_shutdown_complete");
      process.exit(exitCode);
    } catch (err) {
      clearTimeout(timeout);
      logger.error("notification_worker_shutdown_error", {
        error: (err as Error).message,
      });
      process.exit(1);
    }
  };

  process.on("uncaughtException", (err) => {
    logger.error("notification_worker_uncaught_exception", {
      error: err.message,
      stack: err.stack,
    });
    void shutdown("uncaughtException", 1);
  });
  process.on("unhandledRejection", (reason) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    logger.error("notification_worker_unhandled_rejection", {
      error: error.message,
      stack: error.stack,
    });
    void shutdown("unhandledRejection", 1);
  });
  process.on("SIGTERM", () => void shutdown("SIGTERM", 0));
  process.on("SIGINT", () => void shutdown("SIGINT", 0));
}
