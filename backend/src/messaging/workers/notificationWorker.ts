import amqp from "amqplib";
import { getRabbitMQConnection, EXCHANGES, ROUTING_KEYS } from "../connection";
import logger         from "../../utils/logger";
import { trackError } from "../../utils/metrics";
import { BookingEventPayload, PaymentEventPayload } from "../publisher";

// In a real implementation this would call your notification service.
// Here we log and publish to the NOTIFICATION exchange for a downstream
// notification service to consume (email/SMS/push).

async function bindAndConsume(
  channel:    amqp.Channel,
  exchange:   string,
  routingKey: string,
  queue:      string,
  handler:    (msg: amqp.ConsumeMessage, ch: amqp.Channel) => Promise<void>
): Promise<void> {
  await channel.assertQueue(queue, { durable: true });
  await channel.bindQueue(queue, exchange, routingKey);
  await channel.consume(
    queue,
    async (msg) => {
      if (!msg) return;
      try {
        await handler(msg, channel);
        channel.ack(msg);
      } catch (err) {
        trackError("notification_worker_error", queue, "medium");
        logger.error("notification_worker_error", { event: "notification_worker_error", queue, error: (err as Error).message });
        channel.nack(msg, false, true); // requeue once for notifications
      }
    },
    { noAck: false }
  );
}

async function handleBookingConfirmed(msg: amqp.ConsumeMessage, channel: amqp.Channel): Promise<void> {
  const payload = JSON.parse(msg.content.toString()) as BookingEventPayload;

  // Publish to notification exchange for the notification service to consume
  channel.publish(
    EXCHANGES.NOTIFICATION,
    ROUTING_KEYS.NOTIFICATION_EMAIL,
    Buffer.from(JSON.stringify({
      template:  "booking_confirmed",
      userId:    payload.guestUserId,
      tenantId:  payload.tenantId,
      data: {
        bookingRef: payload.bookingRef,
        checkIn:    payload.checkIn,
        checkOut:   payload.checkOut,
        totalAmount: payload.totalAmount,
      },
    })),
    { persistent: true }
  );

  logger.info("notification_booking_confirmed_queued", {
    event:      "notification_booking_confirmed_queued",
    bookingId:  payload.bookingId,
    guestUserId: payload.guestUserId,
  });
}

async function handleBookingCancelled(msg: amqp.ConsumeMessage, channel: amqp.Channel): Promise<void> {
  const payload = JSON.parse(msg.content.toString()) as BookingEventPayload;

  channel.publish(
    EXCHANGES.NOTIFICATION,
    ROUTING_KEYS.NOTIFICATION_EMAIL,
    Buffer.from(JSON.stringify({
      template: "booking_cancelled",
      userId:   payload.guestUserId,
      tenantId: payload.tenantId,
      data: {
        bookingRef: payload.bookingRef,
        checkIn:    payload.checkIn,
        checkOut:   payload.checkOut,
        reason:     payload.reason,
      },
    })),
    { persistent: true }
  );
}

async function handlePaymentConfirmed(msg: amqp.ConsumeMessage, channel: amqp.Channel): Promise<void> {
  const payload = JSON.parse(msg.content.toString()) as PaymentEventPayload;

  channel.publish(
    EXCHANGES.NOTIFICATION,
    ROUTING_KEYS.NOTIFICATION_EMAIL,
    Buffer.from(JSON.stringify({
      template:  "payment_confirmed",
      userId:    payload.guestUserId,
      tenantId:  payload.tenantId,
      data: {
        bookingId:     payload.bookingId,
        amountNgn:     payload.amountNgn,
        transactionId: payload.transactionId,
        gateway:       payload.gateway,
      },
    })),
    { persistent: true }
  );
}

export async function startNotificationWorker(): Promise<void> {
  const connection = getRabbitMQConnection();
  const channel    = await connection.createChannel();
  await channel.prefetch(5);

  await bindAndConsume(channel, EXCHANGES.BOOKING, ROUTING_KEYS.BOOKING_CONFIRMED, "notify.booking.confirmed", handleBookingConfirmed);
  await bindAndConsume(channel, EXCHANGES.BOOKING, ROUTING_KEYS.BOOKING_CANCELLED, "notify.booking.cancelled", handleBookingCancelled);
  await bindAndConsume(channel, EXCHANGES.PAYMENT, ROUTING_KEYS.PAYMENT_CONFIRMED,  "notify.payment.confirmed", handlePaymentConfirmed);

  logger.info("notification_worker_started", { event: "notification_worker_started" });
}
