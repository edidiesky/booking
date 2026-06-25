import logger        from "../utils/logger";
import redisClient  from "../config/redis";
import { connectDB }              from "../config/database";
import { connectRabbitMQ }        from "../messaging/connection";
import { startOutboxPoller }      from "../messaging/outboxPoller";
import { startSseFanoutWorker }   from "../messaging/workers/sseFanoutWorker";
import { startNotificationWorker } from "../messaging/workers/notificationWorker";
import { startWebhookRetryWorker } from "../messaging/workers/webhookRetryWorker";
import { availabilityRepository } from "../domains/availability/availability.repository";
import { serverHealthGauge, trackError } from "../utils/metrics";
import { seedService } from "../domains/role/seed.service";

interface InitStep {
  name: string;
  fn:   () => Promise<void>;
}

async function runStep(step: InitStep): Promise<void> {
  const start = process.hrtime.bigint();
  try {
    await step.fn();
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    logger.info("bootstrap_step_complete", { event: "bootstrap_step_complete", step: step.name, durationMs: ms.toFixed(2) });
  } catch (err) {
    trackError(`${step.name}_initialization_failed`, "server_initialization", "critical");
    logger.error("bootstrap_step_failed", { event: "bootstrap_step_failed", step: step.name, error: (err as Error).message });
    throw err;
  }
}

export async function bootstrapServer(): Promise<void> {
  const steps: InitStep[] = [
    { name: "postgres",              fn: connectDB },
    { name: "redis",                 fn: async () => { await redisClient.ping(); } },
    { name: "rabbitmq",              fn: connectRabbitMQ },
    { name: "outbox_poller",         fn: async () => { startOutboxPoller(); } },
    { name: "seed_rbac",             fn: async () => { await seedService.seedAll(); } },
    { name: "sse_fanout_worker",     fn: startSseFanoutWorker },
    { name: "notification_worker",   fn: startNotificationWorker },
    { name: "webhook_retry_worker",  fn: async () => { startWebhookRetryWorker(); } },
    { name: "lock_cleanup",          fn: async () => {
      setInterval(async () => {
        const count = await availabilityRepository.purgeExpiredLocks().catch(() => 0);
        if (count > 0) logger.info("expired_locks_purged", { event: "expired_locks_purged", count });
      }, 5 * 60_000);
    }},
  ];

  const start = process.hrtime.bigint();
  for (const step of steps) {
    await runStep(step);
  }

  const totalMs = Number(process.hrtime.bigint() - start) / 1e6;
  serverHealthGauge.set(1);

  logger.info("bootstrap_complete", { event: "bootstrap_complete", totalMs: totalMs.toFixed(2), steps: steps.length });
}
