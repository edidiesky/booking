import "dotenv/config";
import { connectRabbitMQ, getRabbitMQConnection, logger } from "@booking/shared";
import { startPropertySearchWorker } from "./worker";

async function main(): Promise<void> {
  await connectRabbitMQ();
  await startPropertySearchWorker(getRabbitMQConnection());
  logger.info("property_search_worker_process_started", { event: "property_search_worker_process_started" });
}

main().catch((err) => {
  logger.error("property_search_worker_fatal", { error: (err as Error).message });
  process.exit(1);
});