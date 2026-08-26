import os from "os";
import type amqp from "amqplib";
import { jobRepository, logger } from "@booking/shared";
import { runRoomTypeCsvImport } from "../csv/roomTypeCsvImportService";

const EXCHANGE     = "room.import";
const QUEUE        = "room.import.queue";
const ROUTING_KEY  = "process";
const JOB_TYPE     = "csv_room_import";

const WORKER_INSTANCE_ID = `${os.hostname()}:${process.pid}`;

const isClaimConflict = (err: unknown): boolean =>
  err instanceof Error && err.message.includes("already claimed by another worker instance");

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
      const result = await runRoomTypeCsvImport(input, WORKER_INSTANCE_ID);
      logger.info("csv_room_import_complete", { event: "csv_room_import_complete", jobId: input.jobId, ...result });
      channel.ack(msg);
    } catch (err) {
      if (isClaimConflict(err)) {
        // Another worker instance genuinely holds this job's claim right
        // now, not a failure, requeue and let it finish.
        logger.info("csv_room_import_claim_conflict_requeued", {
          event: "csv_room_import_claim_conflict_requeued", jobId: input.jobId,
        });
        channel.nack(msg, false, true);
        return;
      }

      await jobRepository.setState(JOB_TYPE, input.jobId, {
        jobId: input.jobId, jobType: JOB_TYPE, state: "error", progress: 100,
        error: (err as Error).message, updatedAt: new Date().toISOString(),
      });
      logger.error("csv_room_import_failed", { event: "csv_room_import_failed", jobId: input.jobId, error: (err as Error).message });
      channel.ack(msg);
    }
  }, { noAck: false });

  logger.info("csv_room_import_worker_started", { event: "csv_room_import_worker_started", workerInstanceId: WORKER_INSTANCE_ID });
}