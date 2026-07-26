import "dotenv/config";
import { connectDB, connectRedis, connectRabbitMQ, getRabbitMQConnection, redisClient, registerGracefulShutdown, logger } from "@booking/shared";
import { startSellerNotificationWorker } from "./worker";

async function main(): Promise<void> {
  registerGracefulShutdown({
    serviceName: "seller-notification-worker",
    redisClient,
  });

  await connectDB();
  await connectRedis();
  await connectRabbitMQ();
  await startSellerNotificationWorker(getRabbitMQConnection());

  logger.info("seller_notification_worker_process_started", { event: "seller_notification_worker_process_started" });
}

main().catch((err) => {
  logger.error("seller_notification_worker_fatal", { error: (err as Error).message });
  process.exit(1);
});