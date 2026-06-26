import amqp                          from "amqplib";
import { getRabbitMQConnection, EXCHANGES, ROUTING_KEYS } from "../connection";
import { bookingConfirmedHandler }   from "../../infra/handlers/booking-confirmed.handler";
import { bookingCancelledHandler }   from "../../infra/handlers/booking-cancelled.handler";
import { bookingCheckinHandler }     from "../../infra/handlers/booking-checkin.handler";
import { bookingCheckoutHandler }    from "../../infra/handlers/booking-checkout.handler";
import { paymentConfirmedHandler }   from "../../infra/handlers/payment-confirmed.handler";
import { paymentFailedHandler }      from "../../infra/handlers/payment-failed.handler";
import { authOtpHandler }            from "../../infra/handlers/auth-otp.handler";
import { authRegisteredHandler }     from "../../infra/handlers/auth-registered.handler";
import { BaseNotificationHandler }   from "../../infra/handlers/base.handler";
import { requestContext }            from "../../context/requestContext";
import { randomUUID }               from "crypto";
import logger                        from "../../utils/logger";
import { trackError }                from "../../utils/metrics";

const HANDLER_MAP: Record<string, BaseNotificationHandler> = {
  [ROUTING_KEYS.NOTIFY_BOOKING_CONFIRMED]:  bookingConfirmedHandler,
  [ROUTING_KEYS.NOTIFY_BOOKING_CANCELLED]:  bookingCancelledHandler,
  [ROUTING_KEYS.NOTIFY_BOOKING_CHECKED_IN]: bookingCheckinHandler,
  [ROUTING_KEYS.NOTIFY_BOOKING_CHECKED_OUT]:bookingCheckoutHandler,
  [ROUTING_KEYS.NOTIFY_PAYMENT_CONFIRMED]:  paymentConfirmedHandler,
  [ROUTING_KEYS.NOTIFY_PAYMENT_FAILED]:     paymentFailedHandler,
  [ROUTING_KEYS.NOTIFY_AUTH_OTP]:           authOtpHandler,
  [ROUTING_KEYS.NOTIFY_AUTH_REGISTERED]:    authRegisteredHandler,
};

const NOTIFY_QUEUES: Record<string, string> = {
  [ROUTING_KEYS.NOTIFY_BOOKING_CONFIRMED]:   "notify.q.booking.confirmed",
  [ROUTING_KEYS.NOTIFY_BOOKING_CANCELLED]:   "notify.q.booking.cancelled",
  [ROUTING_KEYS.NOTIFY_BOOKING_CHECKED_IN]:  "notify.q.booking.checkin",
  [ROUTING_KEYS.NOTIFY_BOOKING_CHECKED_OUT]: "notify.q.booking.checkout",
  [ROUTING_KEYS.NOTIFY_PAYMENT_CONFIRMED]:   "notify.q.payment.confirmed",
  [ROUTING_KEYS.NOTIFY_PAYMENT_FAILED]:      "notify.q.payment.failed",
  [ROUTING_KEYS.NOTIFY_AUTH_OTP]:            "notify.q.auth.otp",
  [ROUTING_KEYS.NOTIFY_AUTH_REGISTERED]:     "notify.q.auth.registered",
};

export async function startNotificationWorker(): Promise<void> {
  const connection = getRabbitMQConnection();
  const channel    = await connection.createChannel();
  await channel.prefetch(5);

  for (const [routingKey, queue] of Object.entries(NOTIFY_QUEUES)) {
    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, EXCHANGES.NOTIFICATION, routingKey);

    await channel.consume(queue, async (msg: amqp.ConsumeMessage | null) => {
      if (!msg) return;

      const routingKey = msg.fields.routingKey;
      let data: unknown;

      try {
        data = JSON.parse(msg.content.toString());
      } catch (err) {
        logger.error("notification_worker_parse_error", {
          event: "notification_worker_parse_error",
          queue,
          error: (err as Error).message,
        });
        channel.nack(msg, false, false);
        return;
      }

      const notificationId = (data as Record<string, string>)["notificationId"] ?? randomUUID();

      requestContext.run({ requestId: notificationId, eventType: routingKey }, async () => {
        const handler = HANDLER_MAP[routingKey];

        if (!handler) {
          logger.warn("notification_worker_no_handler", { event: "notification_worker_no_handler", routingKey, queue });
          channel.nack(msg, false, false);
          return;
        }

        try {
          await handler.process(data, channel, msg);
        } catch (err) {
          trackError("notification_handler_unhandled", routingKey, "high");
          logger.error("notification_handler_unhandled", {
            event:      "notification_handler_unhandled",
            routingKey,
            error:      (err as Error).message,
          });
        }
      });
    }, { noAck: false });

    logger.info("notification_queue_bound", { event: "notification_queue_bound", queue, routingKey });
  }

  logger.info("notification_worker_started", { event: "notification_worker_started", queues: Object.values(NOTIFY_QUEUES).length });
}