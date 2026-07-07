import "dotenv/config";
import { connectDB, connectRedis, connectRabbitMQ, getRabbitMQConnection, logger } from "@booking/shared";
import { startLockSweep }          from "./sweep/lockSweep";
import { startReconciliationSweep } from "./sweep/reconciliationSweep";

async function main(): Promise<void> {
  await connectDB();
  await connectRedis();
  await connectRabbitMQ();

  const connection = getRabbitMQConnection();
  await startLockSweep(connection);
  await startReconciliationSweep(connection);

  logger.info("availability_worker_process_started", { event: "availability_worker_process_started" });
}

main().catch((err) => {
  logger.error("availability_worker_fatal", { error: (err as Error).message });
  process.exit(1);
});