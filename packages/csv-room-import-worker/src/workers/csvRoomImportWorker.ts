import type amqp from "amqplib";
import { jobRepository, logger } from "@booking/shared";
import { runRoomTypeCsvImport } from "../csv/roomTypeCsvImportService";

const EXCHANGE     = "room.import";
const QUEUE        = "room.import.queue";
const ROUTING_KEY  = "process";
const JOB_TYPE     = "csv_room_import";

export async function startCsvRoomImportWorker(connection: amqp.ChannelModel): Promise<void> {
  const channel = await connection.createChannel();
  await channel.prefetch(1);
  await channel.assertExchange(EXCHANGE, "topic", { durable: true });
  await channel.assertQueue(QUEUE, { durable: true });
  await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);

  channel.consume(QUEUE, async (msg) => {
    if (!msg) return;
    const input = JSON.parse(msg.content.toString());

    try {
      const result = await runRoomTypeCsvImport(input);
      logger.info("csv_room_import_complete", { event: "csv_room_import_complete", jobId: input.jobId, ...result });
      channel.ack(msg);
    } catch (err) {
      await jobRepository.setState(JOB_TYPE, input.jobId, {
        jobId: input.jobId, jobType: JOB_TYPE, state: "error", progress: 100,
        error: (err as Error).message, updatedAt: new Date().toISOString(),
      });
      logger.error("csv_room_import_failed", { event: "csv_room_import_failed", jobId: input.jobId, error: (err as Error).message });
      channel.ack(msg);
    }
  }, { noAck: false });

  logger.info("csv_room_import_worker_started", { event: "csv_room_import_worker_started" });
}