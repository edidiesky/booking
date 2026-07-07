import "dotenv/config";
import { connectDB, connectRabbitMQ, getRabbitMQConnection, logger } from "@booking/shared";
import { startBookingExpiryWorker } from "./workers/bookingExpiryWorker";

async function main(): Promise<void> {
  await connectDB();
  await connectRabbitMQ();
  await startBookingExpiryWorker(getRabbitMQConnection());
  logger.info("booking_expiry_worker_process_started", { event: "booking_expiry_worker_process_started" });
}

main().catch((err) => {
  logger.error("booking_expiry_worker_fatal", { event: "booking_expiry_worker_fatal", error: (err as Error).message });
  process.exit(1);
});