import "dotenv/config";
import { connectDB, connectRedis, redisClient, registerGracefulShutdown, logger } from "@booking/shared";
import { startBookingExpiryScheduler, stopBookingExpiryScheduler } from "./scheduler";
import { startBookingExpiryReconciliation, stopBookingExpiryReconciliation } from "./reconciliation";

async function main(): Promise<void> {
  registerGracefulShutdown({
    serviceName: "booking-expiry-worker",
    redisClient,
    onBeforeDisconnect: () => { stopBookingExpiryScheduler(); stopBookingExpiryReconciliation(); },
  });

  await connectDB();
  await connectRedis();

  startBookingExpiryScheduler();
  startBookingExpiryReconciliation();

  logger.info("booking_expiry_worker_process_started", { event: "booking_expiry_worker_process_started" });
}

main().catch((err) => { logger.error("booking_expiry_worker_fatal", { error: (err as Error).message }); process.exit(1); });