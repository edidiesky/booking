import type { Channel, ConsumeMessage } from "amqplib";
import redisClient from "../../config/redis";
import logger from "../../utils/logger";
import { requestContext } from "../../context/requestContext";

const MAX_RETRIES = 4;
const BASE_DELAY_MS = 1_000;
const IDEMPOTENCY_TTL_SEC = 86_400;

function jitter(): number {
  return Math.floor(Math.random() * 1_000);
}

export abstract class BaseNotificationHandler {
  protected abstract routingKey: string;
  protected abstract handle(data: unknown): Promise<void>;

  protected idempotencyKey(data: unknown): string {
    const d = data as Record<string, string>;
    const id = d["notificationId"] ?? d["bookingId"] ?? "";
    return `notif:${this.routingKey}:${id}`;
  }

  async process(
    data: unknown,
    channel: Channel,
    msg: ConsumeMessage,
  ): Promise<void> {
    const key = this.idempotencyKey(data);
    const acquired = await redisClient.set(
      key,
      "1",
      "EX",
      IDEMPOTENCY_TTL_SEC,
      "NX",
    );

    if (!acquired) {
      logger.info("notification_duplicate_skipped", {
        event: "notification_duplicate_skipped",
        routingKey: this.routingKey,
        key,
      });
      channel.ack(msg);
      return;
    }

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        await this.handle(data);
        logger.info("notification_handler_success", {
          event: "notification_handler_success",
          routingKey: this.routingKey,
          attempt: attempt + 1,
          ...requestContext.get(),
        });
        channel.ack(msg);
        return;
      } catch (err) {
        const message = (err as Error).message;
        logger.error("notification_handler_attempt_failed", {
          event: "notification_handler_attempt_failed",
          routingKey: this.routingKey,
          attempt: attempt + 1,
          error: message,
        });

        if (attempt === MAX_RETRIES - 1) {
          logger.error("notification_handler_exhausted", {
            event: "notification_handler_exhausted",
            routingKey: this.routingKey,
          });
          channel.nack(msg, false, false);
          return;
        }
        const delay =
          Math.min(BASE_DELAY_MS * Math.pow(2, attempt), 30_000) + jitter();
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
}
