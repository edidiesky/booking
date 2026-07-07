import "dotenv/config";
import { connectDB, connectRabbitMQ, getRabbitMQConnection, logger } from "@booking/shared";
import { startCsvRoomImportWorker } from "./workers/csvRoomImportWorker";

async function main(): Promise<void> {
  await connectDB();
  await connectRabbitMQ();
  await startCsvRoomImportWorker(getRabbitMQConnection());
  logger.info("csv_room_import_worker_process_started", { event: "csv_room_import_worker_process_started" });
}

main().catch((err) => {
  logger.error("csv_room_import_worker_fatal", { error: (err as Error).message });
  process.exit(1);
});