import amqp from "amqplib";
import { getRabbitMQConnection, EXCHANGES, ROUTING_KEYS } from "../connection";
import { bookingConfirmedHandler } from "../../infra/handlers/booking-confirmed.handler";
import { bookingCancelledHandler } from "../../infra/handlers/booking-cancelled.handler";
import { bookingCheckinHandler } from "../../infra/handlers/booking-checkin.handler";
import { bookingCheckoutHandler } from "../../infra/handlers/booking-checkout.handler";
import { paymentConfirmedHandler } from "../../infra/handlers/payment-confirmed.handler";
import { paymentFailedHandler } from "../../infra/handlers/payment-failed.handler";
import { authOtpHandler } from "../../infra/handlers/auth-otp.handler";
import { authRegisteredHandler } from "../../infra/handlers/auth-registered.handler";
import { BaseNotificationHandler } from "../../infra/handlers/base.handler";
import { requestContext } from "../../context/requestContext";
import { randomUUID } from "crypto";
import logger from "../../utils/logger";
import { trackError } from "../../utils/metrics";
import { bookingReceiptHandler } from "../../infra/handlers/booking-receipt.handler";
import { rentalsRecordUpsertedHandle } from "../../infra/handlers/renter.upsert.requested.handler";

const HANDLER_MAP: Record<string, BaseNotificationHandler> = {
  [ROUTING_KEYS.NOTIFY_BOOKING_CONFIRMED]: bookingConfirmedHandler,
  [ROUTING_KEYS.NOTIFY_BOOKING_CANCELLED]: bookingCancelledHandler,
  [ROUTING_KEYS.NOTIFY_BOOKING_CHECKED_IN]: bookingCheckinHandler,
  [ROUTING_KEYS.NOTIFY_BOOKING_CHECKED_OUT]: bookingCheckoutHandler,
  [ROUTING_KEYS.NOTIFY_PAYMENT_CONFIRMED]: paymentConfirmedHandler,
  [ROUTING_KEYS.NOTIFY_PAYMENT_FAILED]: paymentFailedHandler,
  [ROUTING_KEYS.NOTIFY_AUTH_OTP]: authOtpHandler,
  [ROUTING_KEYS.NOTIFY_AUTH_REGISTERED]: authRegisteredHandler,
  [ROUTING_KEYS.BOOKING_RECEIPT_REQUESTED]: bookingReceiptHandler,
  [ROUTING_KEYS.RENTERS_RECORED_UPSERTED]: rentalsRecordUpsertedHandle,
};

const NOTIFY_QUEUES: Record<string, { queue: string; exchange: string }> = {
  [ROUTING_KEYS.NOTIFY_BOOKING_CONFIRMED]: {
    queue: "notify.q.booking.confirmed",
    exchange: EXCHANGES.NOTIFICATION,
  },
  [ROUTING_KEYS.NOTIFY_BOOKING_CANCELLED]: {
    queue: "notify.q.booking.cancelled",
    exchange: EXCHANGES.NOTIFICATION,
  },
  [ROUTING_KEYS.NOTIFY_BOOKING_CHECKED_IN]: {
    queue: "notify.q.booking.checkin",
    exchange: EXCHANGES.NOTIFICATION,
  },
  [ROUTING_KEYS.NOTIFY_BOOKING_CHECKED_OUT]: {
    queue: "notify.q.booking.checkout",
    exchange: EXCHANGES.NOTIFICATION,
  },
  [ROUTING_KEYS.NOTIFY_PAYMENT_CONFIRMED]: {
    queue: "notify.q.payment.confirmed",
    exchange: EXCHANGES.NOTIFICATION,
  },
  [ROUTING_KEYS.NOTIFY_PAYMENT_FAILED]: {
    queue: "notify.q.payment.failed",
    exchange: EXCHANGES.NOTIFICATION,
  },
  [ROUTING_KEYS.NOTIFY_AUTH_OTP]: {
    queue: "notify.q.auth.otp",
    exchange: EXCHANGES.NOTIFICATION,
  },
  [ROUTING_KEYS.NOTIFY_AUTH_REGISTERED]: {
    queue: "notify.q.auth.registered",
    exchange: EXCHANGES.NOTIFICATION,
  },
  [ROUTING_KEYS.BOOKING_RECEIPT_REQUESTED]: {
    queue: "notify.q.booking.receipt",
    exchange: EXCHANGES.BOOKING,
  },
  [ROUTING_KEYS.RENTERS_RECORED_UPSERTED]: {
    queue: "notify.renter.upsert.requested",
    exchange: EXCHANGES.BOOKING,
  },
};
export async function startNotificationWorker(): Promise<void> {
  const connection = getRabbitMQConnection();
  const channel = await connection.createChannel();
  await channel.prefetch(5);

  for (const [routingKey, { queue, exchange }] of Object.entries(
    NOTIFY_QUEUES,
  )) {
    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, exchange, routingKey);

    await channel.consume(
      queue,
      async (msg: amqp.ConsumeMessage | null) => {
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

        const notificationId =
          (data as Record<string, string>)["notificationId"] ?? randomUUID();

        requestContext.run(
          { requestId: notificationId, eventType: routingKey },
          async () => {
            const handler = HANDLER_MAP[routingKey];

            if (!handler) {
              logger.warn("notification_worker_no_handler", {
                event: "notification_worker_no_handler",
                routingKey,
                queue,
              });
              channel.nack(msg, false, false);
              return;
            }

            try {
              await handler.process(data, channel, msg);
            } catch (err) {
              trackError("notification_handler_unhandled", routingKey, "high");
              logger.error("notification_handler_unhandled", {
                event: "notification_handler_unhandled",
                routingKey,
                error: (err as Error).message,
              });
            }
          },
        );
      },
      { noAck: false },
    );

    logger.info("notification_queue_bound", {
      event: "notification_queue_bound",
      queue,
      routingKey,
    });
  }

  logger.info("notification_worker_started", {
    event: "notification_worker_started",
    queues: Object.values(NOTIFY_QUEUES).length,
  });
}
