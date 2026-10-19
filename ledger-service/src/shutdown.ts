import { Pool } from "pg";
import { Server } from "http";
import { disconnectRabbitMQ } from "@booking/shared";
import { logger } from "./logger";

let shuttingDown = false;

export function registerGracefulShutdown(
  server: Server,
  pool: Pool,
  onStop?: () => void,
): void {
  const shutdown = async (signal: string, exitCode: number) => {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.info("ledger_service_shutdown_initiated", { signal });
    const timeout = setTimeout(() => {
      logger.error("ledger_service_shutdown_timeout");
      process.exit(1);
    }, 10_000);

    try {
      onStop?.();
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
      await disconnectRabbitMQ();
      await pool.end();
      clearTimeout(timeout);
      logger.info("ledger_service_shutdown_complete");
      process.exit(exitCode);
    } catch (err) {
      clearTimeout(timeout);
      logger.error("ledger_service_shutdown_error", {
        error: (err as Error).message,
        stack: (err as Error).stack,
      });
      process.exit(1);
    }
  };

  process.on("uncaughtException", (err) => {
    logger.error("ledger_service_uncaught_exception", {
      error: err.message,
      stack: err.stack,
    });
    void shutdown("uncaughtException", 1);
  });
  process.on("unhandledRejection", (reason) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    logger.error("ledger_service_unhandled_rejection", {
      error: error.message,
      stack: error.stack,
    });
    void shutdown("unhandledRejection", 1);
  });
  process.on("SIGTERM", () => void shutdown("SIGTERM", 0));
  process.on("SIGINT", () => void shutdown("SIGINT", 0));
}
