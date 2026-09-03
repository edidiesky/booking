import logger from "../utils/logger";
import redisClient from "../config/redis";
import http from 'http'
import {
  connectDB,
  connectRedis,
  createLockedScheduler,
} from "@booking/shared";
import {
  connectRabbitMQ,
  getRabbitMQConnection,
} from "../messaging/connection";
import { startOutboxPoller } from "../messaging/outboxPoller";
import { startSseFanoutWorker } from "../messaging/workers/sseFanoutWorker";
import { startNotificationWorker } from "../messaging/workers/notificationWorker";
import { startWebhookRetryWorker } from "../messaging/workers/webhookRetryWorker";
import { serverHealthGauge, trackError } from "../utils/metrics";
import { seedService } from "../domains/role/seed.service";
import { runMigrations } from "../migrations/runner";

import {
  lockSweepScheduler,
  reconciliationScheduler,
} from "@booking/availability-worker/dist/scheduler";
import { runCampaignWorkerTick } from "@booking/campaign-worker/dist/campaignWorker";
import { startCsvRoomImportWorker } from "@booking/csv-room-import-worker/dist/workers/csvRoomImportWorker";
import { startSellerNotificationWorker } from "@booking/seller-notification-worker/dist/worker";
import { startAuditWorker } from "@booking/audit-worker/dist/auditWorker";
import {
  startBookingExpiryScheduler,
  stopBookingExpiryScheduler,
} from "@booking/booking-expiry-worker/dist/scheduler";
import {
  startBookingExpiryReconciliation,
  stopBookingExpiryReconciliation,
} from "@booking/booking-expiry-worker/dist/reconciliation";
import { startSocketServer } from "../realtime/socketServer";

const CAMPAIGN_TICK_MS = 3_000;

export const campaignScheduler = createLockedScheduler({
  lockKey: "lock:campaign-worker:tick",
  lockTtlSec: 60,
  tickMs: CAMPAIGN_TICK_MS,
  serviceName: "campaign-worker",
  onTick: runCampaignWorkerTick,
});

interface InitStep {
  name: string;
  fn: () => Promise<void>;
}

async function runStep(step: InitStep): Promise<void> {
  const start = process.hrtime.bigint();
  try {
    await step.fn();
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    logger.info("bootstrap_step_complete", {
      event: "bootstrap_step_complete",
      step: step.name,
      durationMs: ms.toFixed(2),
    });
  } catch (err) {
    trackError(
      `${step.name}_initialization_failed`,
      "server_initialization",
      "critical",
    );
    logger.error("bootstrap_step_failed", {
      event: "bootstrap_step_failed",
      step: step.name,
      error: (err as Error).message,
    });
    throw err;
  }
}

export async function bootstrapServer(httpServer:http.Server): Promise<void> {
  const steps: InitStep[] = [
    { name: "postgres", fn: connectDB },
    {
      name: "redis",
      fn: async () => {
        await redisClient.ping();
      },
    },
    { name: "rabbitmq", fn: connectRabbitMQ },
    { name: "migrations", fn: runMigrations },
    {
      name: "outbox_poller",
      fn: async () => {
        startOutboxPoller();
      },
    },
    {
      name: "seed_rbac",
      fn: async () => {
        await seedService.seedAll();
      },
    },
    { name: "sse_fanout_worker", fn: startSseFanoutWorker },
    { name: "notification_worker", fn: startNotificationWorker },
    {
      name: "webhook_retry_worker",
      fn: async () => {
        startWebhookRetryWorker();
      },
    },

    {
      name: "availability_worker",
      fn: async () => {
        await connectRedis();
        lockSweepScheduler.start();
        reconciliationScheduler.start();
      },
    },
    {
      name: "campaign_worker",
      fn: async () => {
        campaignScheduler.start();
      },
    },
    {
      name: "booking_expiry_worker",
      fn: async () => {
        startBookingExpiryScheduler();
        startBookingExpiryReconciliation();
      },
    },
    {
      name: "csv_room_import_worker",
      fn: async () => {
        await startCsvRoomImportWorker(getRabbitMQConnection());
      },
    },
    {
      name: "seller_notification_worker",
      fn: async () => {
        await startSellerNotificationWorker(getRabbitMQConnection());
      },
    },
    {
      name: "audit_worker",
      fn: async () => {
        await startAuditWorker(getRabbitMQConnection());
      },
    },

    { name: "socket_server",        fn: async () => { await startSocketServer(httpServer); } },
  ];

  const start = process.hrtime.bigint();
  for (const step of steps) {
    await runStep(step);
  }

  const totalMs = Number(process.hrtime.bigint() - start) / 1e6;
  serverHealthGauge.set(1);

  logger.info("bootstrap_complete", {
    event: "bootstrap_complete",
    totalMs: totalMs.toFixed(2),
    steps: steps.length,
  });
}

export {
  lockSweepScheduler,
  reconciliationScheduler,
  stopBookingExpiryScheduler,
  stopBookingExpiryReconciliation,
};
