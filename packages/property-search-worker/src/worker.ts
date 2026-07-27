import type amqp from "amqplib";
import { logger } from "@booking/shared";
import { propertyHandlers } from "./handlers";

const EXCHANGE = "booking.events";
const QUEUE    = "property_search.queue";
const ROUTING_KEYS = ["property.created", "property.updated", "property.deleted"];

// Own separate queue bound to the same exchange the main backend
// publishes property.* events to via the outbox pattern. Purely
// additive, no change needed anywhere else for this to start receiving
// events, topic exchanges support any number of independent queue
// bindings per routing key.
export async function startPropertySearchWorker(connection: amqp.ChannelModel): Promise<void> {
  const channel = await connection.createChannel();
  await channel.prefetch(10);
  await channel.assertExchange(EXCHANGE, "topic", { durable: true });
  await channel.assertQueue(QUEUE, { durable: true });
  for (const key of ROUTING_KEYS) await channel.bindQueue(QUEUE, EXCHANGE, key);

  channel.consume(QUEUE, async (msg) => {
    if (!msg) return;
    const routingKey = msg.fields.routingKey;
    const handler = propertyHandlers[routingKey];

    try {
      if (!handler) {
        logger.warn("property_search_unhandled_routing_key", { event: "property_search_unhandled_routing_key", routingKey });
        channel.ack(msg);
        return;
      }
      const payload = JSON.parse(msg.content.toString());
      await handler(payload);
      channel.ack(msg);
    } catch (err) {
      logger.error("property_search_handler_failed", {
        event: "property_search_handler_failed", routingKey,
        error: (err as Error).message,
      });
      channel.nack(msg, false, !msg.fields.redelivered);
    }
  }, { noAck: false });

  logger.info("property_search_worker_started", { event: "property_search_worker_started", queue: QUEUE });
}