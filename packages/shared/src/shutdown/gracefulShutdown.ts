import type { Channel } from "amqplib";
import Redis from "ioredis";
import { disconnectRabbitMQ, getRabbitMQChannel } from "../config/rabbitmq";
import { disconnectDB } from "../config/database";
import { getInFlightCount, stopAllConsumers } from "../messaging/consumerLoop";
import logger from "../utils/logger";

export interface GracefulShutdownOptions {
  serviceName:         string;
  redisClient:         Redis;
  hardTimeoutMs?:       number;
  drainPollMs?:         number;
  onBeforeDisconnect?:  () => void | Promise<void>;
}

export function registerGracefulShutdown(options: GracefulShutdownOptions): void {
  const { serviceName, redisClient, hardTimeoutMs = 15_000, drainPollMs = 250, onBeforeDisconnect } = options;
  let shuttingDown = false;

  async function drain(channel: Channel, deadline: number): Promise<void> {
    await stopAllConsumers(channel);
    logger.info("shutdown_stopped_consuming", { event: "shutdown_stopped_consuming", service: serviceName });

    while (getInFlightCount() > 0 && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, drainPollMs));
    }

    const remaining = getInFlightCount();
    if (remaining > 0) {
      logger.warn("shutdown_drain_incomplete", { event: "shutdown_drain_incomplete", service: serviceName, remainingInFlight: remaining });
    } else {
      logger.info("shutdown_drain_complete", { event: "shutdown_drain_complete", service: serviceName });
    }
  }

  async function shutdown(signal: string): Promise<void> {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.info("shutdown_initiated", { event: "shutdown_initiated", service: serviceName, signal });
    const start = Date.now();
    const hardDeadline = start + hardTimeoutMs;

    const forceExit = setTimeout(() => {
      logger.error("shutdown_hard_timeout", { event: "shutdown_hard_timeout", service: serviceName });
      process.exit(1);
    }, hardTimeoutMs);

    try {
      try {
        const channel = getRabbitMQChannel();
        await drain(channel, hardDeadline - 2_000);
      } catch (err) {
        logger.warn("shutdown_drain_skipped", { event: "shutdown_drain_skipped", service: serviceName, reason: (err as Error).message });
      }

      if (onBeforeDisconnect) await onBeforeDisconnect();

      const steps: { name: string; fn: () => Promise<void> }[] = [
        { name: "database",  fn: disconnectDB },
        { name: "rabbitmq",  fn: disconnectRabbitMQ },
        { name: "redis",     fn: async () => { await redisClient.quit(); } },
      ];

      for (const step of steps) {
        try {
          await step.fn();
          logger.info("shutdown_step_complete", { event: "shutdown_step_complete", service: serviceName, step: step.name });
        } catch (err) {
          logger.error("shutdown_step_failed", { event: "shutdown_step_failed", service: serviceName, step: step.name, error: (err as Error).message });
        }
      }

      clearTimeout(forceExit);
      logger.info("shutdown_complete", { event: "shutdown_complete", service: serviceName, durationMs: Date.now() - start });
      process.exit(0);
    } catch (err) {
      clearTimeout(forceExit);
      logger.error("shutdown_failed", { event: "shutdown_failed", service: serviceName, error: (err as Error).message });
      process.exit(1);
    }
  }

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT",  () => void shutdown("SIGINT"));
  process.on("unhandledRejection", (reason) => { logger.error("unhandled_rejection", { service: serviceName, reason: String(reason) }); void shutdown("unhandledRejection"); });
  process.on("uncaughtException",  (err) =>    { logger.error("uncaught_exception",  { service: serviceName, error: err.message });      void shutdown("uncaughtException"); });
}