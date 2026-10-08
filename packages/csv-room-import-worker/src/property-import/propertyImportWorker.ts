import type amqp from "amqplib";
import { PROPERTY_IMPORT_QUEUE, logger } from "@booking/shared";
import {
  runPropertyImport,
  type PropertyImportMessage,
} from "./runPropertyImport";

function isMessage(v: unknown): v is PropertyImportMessage {
  const m = v as Partial<PropertyImportMessage>;
  return (
    typeof m?.batchId === "string" &&
    typeof m?.tenantId === "string" &&
    typeof m?.userId === "string" &&
    typeof m?.filePublicId === "string"
  );
}

export async function startPropertyImportWorker(
  connection: amqp.ChannelModel,
): Promise<amqp.Channel> {
  const { exchange, queue, routingKey } = PROPERTY_IMPORT_QUEUE;
  const channel = await connection.createChannel();
  await channel.prefetch(1);
  await channel.assertExchange(exchange, "topic", { durable: true });
  await channel.assertQueue(queue, { durable: true });
  await channel.bindQueue(queue, exchange, routingKey);

  await channel.consume(
    queue,
    async (msg) => {
      if (!msg) return;
      let input: unknown;
      try {
        input = JSON.parse(msg.content.toString());
      } catch {
        input = null;
      }
      if (!isMessage(input)) {
        logger.error("property_import_bad_message", {
          event: "property_import_bad_message",
        });
        channel.ack(msg);
        return;
      }
      try {
        await runPropertyImport(input);
      } finally {
        channel.ack(msg);
      }
    },
    { noAck: false },
  );

  logger.info("property_import_worker_started", {
    event: "property_import_worker_started",
  });
  return channel;
}
