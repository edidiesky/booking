import type amqp from "amqplib";
import { logger } from "@booking/shared";
import { handleBookingConfirmed, handleBookingCheckedIn, handleBookingCheckedOut } from "./handlers/sellerNotificationHandlers";

const EXCHANGE = "notification.events";
const QUEUE    = "seller_notifications.queue";

const ROUTING_KEY_HANDLERS: Record<string, (data: unknown) => Promise<void>> = {
  "notify.booking.confirmed":  handleBookingConfirmed,
  "notify.booking.checkin":    handleBookingCheckedIn,
  "notify.booking.checkout":   handleBookingCheckedOut,
};

export async function startSellerNotificationWorker(connection: amqp.ChannelModel): Promise<void> {
  const channel = await connection.createChannel();
  await channel.prefetch(5);
  await channel.assertExchange(EXCHANGE, "topic", { durable: true });
  await channel.assertQueue(QUEUE, { durable: true });

  for (const routingKey of Object.keys(ROUTING_KEY_HANDLERS)) {
    await channel.bindQueue(QUEUE, EXCHANGE, routingKey);
  }

  channel.consume(QUEUE, async (msg) => {
    if (!msg) return;
    const routingKey = msg.fields.routingKey;
    const handler = ROUTING_KEY_HANDLERS[routingKey];

    try {
      if (!handler) {
        logger.warn("seller_notification_unhandled_routing_key", { event: "seller_notification_unhandled_routing_key", routingKey });
        channel.ack(msg);
        return;
      }
      const data = JSON.parse(msg.content.toString());
      await handler(data);
      channel.ack(msg);
    } catch (err) {
      logger.error("seller_notification_handler_failed", {
        event: "seller_notification_handler_failed", routingKey,
        error: (err as Error).message,
      });
      channel.nack(msg, false, !msg.fields.redelivered);
    }
  }, { noAck: false });

  logger.info("seller_notification_worker_started", { event: "seller_notification_worker_started", queue: QUEUE });
}