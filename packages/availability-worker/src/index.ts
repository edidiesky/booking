import "dotenv/config";
import { connectDB, connectRedis, connectRabbitMQ, getRabbitMQConnection, logger } from "@booking/shared";
import { startLockSweep }          from "./sweep/lockSweep";
import { startReconciliationSweep } from "./sweep/reconciliationSweep";
import { registerGracefulShutdown } from "./shutdown";
import { startMetricsServer } from "./metricsServer";

async function main(): Promise<void> {
  registerGracefulShutdown();
  await connectDB();
  await connectRedis();
  await connectRabbitMQ();

  const connection = getRabbitMQConnection();
  await startLockSweep(connection);
  await startReconciliationSweep(connection);

  startMetricsServer();

  logger.info("availability_worker_process_started", { event: "availability_worker_process_started" });
}

main().catch((err) => {
  logger.error("availability_worker_fatal", { error: (err as Error).message });
  process.exit(1);
});