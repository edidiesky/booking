import "dotenv/config";
import { connectDB, connectRedis, connectRabbitMQ, getRabbitMQConnection, redisClient, registerGracefulShutdown, logger } from "@booking/shared";
import { startOutboxPoller, stopOutboxPoller }       from "./workers/outboxPoller";
import { startNotificationWorker }                    from "./workers/notificationWorker";
import { startWebhookRetryWorker, stopWebhookRetryWorker } from "./workers/webhookRetryWorker";
import { startSseFanoutWorker }                        from "./workers/sseFanoutWorker";
import { startMetricsServer }                           from "./metricsServer";

async function main(): Promise<void> {
  registerGracefulShutdown({
    serviceName: "events-worker",
    redisClient,
    onBeforeDisconnect: () => {
      stopOutboxPoller();
      stopWebhookRetryWorker();
    },
  });

  await connectDB();
  await connectRedis();
  await connectRabbitMQ();

  const connection = getRabbitMQConnection();
  startOutboxPoller();
  await startNotificationWorker();
  startWebhookRetryWorker();
  await startSseFanoutWorker(connection);
  startMetricsServer();

  logger.info("events_worker_process_started", { event: "events_worker_process_started" });
}

main().catch((err) => { logger.error("events_worker_fatal", { error: (err as Error).message }); process.exit(1); });