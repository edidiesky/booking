import "dotenv/config";
import { connectDB, connectRedis, redisClient, registerGracefulShutdown, logger } from "@booking/shared";
import { lockSweepScheduler, reconciliationScheduler } from "./scheduler";
import { startMetricsServer } from "./metricsServer";

async function main(): Promise<void> {
  registerGracefulShutdown({
    serviceName: "availability-worker",
    redisClient,
    onBeforeDisconnect: () => { lockSweepScheduler.stop(); reconciliationScheduler.stop(); },
  });

  await connectDB();
  await connectRedis();

  lockSweepScheduler.start();
  reconciliationScheduler.start();
  startMetricsServer();

  logger.info("availability_worker_process_started", { event: "availability_worker_process_started" });
}

main().catch((err) => { logger.error("availability_worker_fatal", { error: (err as Error).message }); process.exit(1); });