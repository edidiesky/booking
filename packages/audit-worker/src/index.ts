import "dotenv/config";
import { connectDB, connectRabbitMQ, getRabbitMQConnection, logger } from "@booking/shared";
import { startAuditWorker } from "./auditWorker";

async function main(): Promise<void> {
  await connectDB();
  await connectRabbitMQ();
  await startAuditWorker(getRabbitMQConnection());
  logger.info("audit_worker_process_started", { event: "audit_worker_process_started" });
}

main().catch((err) => {
  logger.error("audit_worker_fatal", { error: (err as Error).message });
  process.exit(1);
});