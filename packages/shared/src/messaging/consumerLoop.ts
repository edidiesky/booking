import type { Channel, ConsumeMessage } from "amqplib";
import { requestContext } from "../context/requestContext";
import logger from "../utils/logger";
import { randomUUID } from "crypto";

export type MessageHandler = (data: unknown, channel: Channel, msg: ConsumeMessage) => Promise<void>;

const activeConsumerTags = new Set<string>();
let inFlightCount = 0;

export function getInFlightCount(): number {
  return inFlightCount;
}

export async function stopAllConsumers(channel: Channel): Promise<void> {
  for (const tag of activeConsumerTags) {
    await channel.cancel(tag).catch(() => {});
  }
  activeConsumerTags.clear();
}

export async function runConsumerLoop(
  channel: Channel,
  queueHandlerMap: Record<string, string>,
  handlers: Record<string, MessageHandler>,
  consumerLabel: string,
  prefetch = 10,
): Promise<void> {
  await channel.prefetch(prefetch);

  for (const [queue, routingKey] of Object.entries(queueHandlerMap)) {
    const handler = handlers[routingKey];
    if (!handler) {
      logger.warn(`${consumerLabel}_no_handler`, { event: `${consumerLabel}_no_handler`, queue, routingKey });
      continue;
    }

    const { consumerTag } = await channel.consume(queue, async (msg: ConsumeMessage | null) => {
      if (!msg) return;

      inFlightCount++;
      try {
        const requestId = (msg.properties.headers?.["x-request-id"] as string) ?? randomUUID();

        let data: unknown;
        try {
          data = JSON.parse(msg.content.toString());
        } catch (err) {
          logger.error(`${consumerLabel}_parse_error`, { event: `${consumerLabel}_parse_error`, queue, error: (err as Error).message });
          channel.nack(msg, false, false);
          return;
        }

        await requestContext.run({ requestId, eventType: msg.fields.routingKey }, async () => {
          try {
            await handler(data, channel, msg);
          } catch (err) {
            logger.error(`${consumerLabel}_handler_error`, {
              event: `${consumerLabel}_handler_error`, queue, routingKey: msg.fields.routingKey,
              requestId, error: (err as Error).message,
            });
            channel.nack(msg, false, false);
          }
        });
      } finally {
        inFlightCount--;
      }
    }, { noAck: false });

    activeConsumerTags.add(consumerTag);
    logger.info(`${consumerLabel}_started`, { event: `${consumerLabel}_started`, queue, routingKey });
  }
}