import { getRabbitMQConnection, EXCHANGES, ROUTING_KEYS, runConsumerLoop, logger } from "@booking/shared";
import { bookingConfirmedHandler }   from "../handlers/booking-confirmed.handler";
import { bookingCancelledHandler }   from "../handlers/booking-cancelled.handler";
import { bookingCheckinHandler }     from "../handlers/booking-checkin.handler";
import { bookingCheckoutHandler }    from "../handlers/booking-checkout.handler";
import { paymentConfirmedHandler }   from "../handlers/payment-confirmed.handler";
import { paymentFailedHandler }      from "../handlers/payment-failed.handler";
import { authOtpHandler }            from "../handlers/auth-otp.handler";
import { authRegisteredHandler }     from "../handlers/auth-registered.handler";
import { bookingReceiptHandler }     from "../handlers/booking-receipt.handler";
import type { BaseNotificationHandler } from "../handlers/base.handler";

const HANDLER_MAP: Record<string, BaseNotificationHandler> = {
  [ROUTING_KEYS.NOTIFY_BOOKING_CONFIRMED]:   bookingConfirmedHandler,
  [ROUTING_KEYS.NOTIFY_BOOKING_CANCELLED]:   bookingCancelledHandler,
  [ROUTING_KEYS.NOTIFY_BOOKING_CHECKED_IN]:  bookingCheckinHandler,
  [ROUTING_KEYS.NOTIFY_BOOKING_CHECKED_OUT]: bookingCheckoutHandler,
  [ROUTING_KEYS.NOTIFY_PAYMENT_CONFIRMED]:   paymentConfirmedHandler,
  [ROUTING_KEYS.NOTIFY_PAYMENT_FAILED]:      paymentFailedHandler,
  [ROUTING_KEYS.NOTIFY_AUTH_OTP]:            authOtpHandler,
  [ROUTING_KEYS.NOTIFY_AUTH_REGISTERED]:     authRegisteredHandler,
  [ROUTING_KEYS.BOOKING_RECEIPT_REQUESTED]:  bookingReceiptHandler,
};

const NOTIFY_QUEUES: Record<string, { queue: string; exchange: string }> = {
  [ROUTING_KEYS.NOTIFY_BOOKING_CONFIRMED]:   { queue: "notify.q.booking.confirmed",  exchange: EXCHANGES.NOTIFICATION },
  [ROUTING_KEYS.NOTIFY_BOOKING_CANCELLED]:   { queue: "notify.q.booking.cancelled",  exchange: EXCHANGES.NOTIFICATION },
  [ROUTING_KEYS.NOTIFY_BOOKING_CHECKED_IN]:  { queue: "notify.q.booking.checkin",    exchange: EXCHANGES.NOTIFICATION },
  [ROUTING_KEYS.NOTIFY_BOOKING_CHECKED_OUT]: { queue: "notify.q.booking.checkout",   exchange: EXCHANGES.NOTIFICATION },
  [ROUTING_KEYS.NOTIFY_PAYMENT_CONFIRMED]:   { queue: "notify.q.payment.confirmed",  exchange: EXCHANGES.NOTIFICATION },
  [ROUTING_KEYS.NOTIFY_PAYMENT_FAILED]:      { queue: "notify.q.payment.failed",     exchange: EXCHANGES.NOTIFICATION },
  [ROUTING_KEYS.NOTIFY_AUTH_OTP]:            { queue: "notify.q.auth.otp",           exchange: EXCHANGES.NOTIFICATION },
  [ROUTING_KEYS.NOTIFY_AUTH_REGISTERED]:     { queue: "notify.q.auth.registered",    exchange: EXCHANGES.NOTIFICATION },
  [ROUTING_KEYS.BOOKING_RECEIPT_REQUESTED]:  { queue: "notify.q.booking.receipt",    exchange: EXCHANGES.BOOKING },
};

export async function startNotificationWorker(): Promise<void> {
  const connection = getRabbitMQConnection();
  const channel     = await connection.createChannel();

  const queueHandlerMap: Record<string, string> = {};
  for (const [routingKey, { queue, exchange }] of Object.entries(NOTIFY_QUEUES)) {
    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, exchange, routingKey);
    queueHandlerMap[queue] = routingKey;
  }

  const handlerFns: Record<string, (data: unknown, channel: import("amqplib").Channel, msg: import("amqplib").ConsumeMessage) => Promise<void>> = {};
  for (const [routingKey, handler] of Object.entries(HANDLER_MAP)) {
    handlerFns[routingKey] = (data, ch, msg) => handler.process(data, ch, msg);
  }

  await runConsumerLoop(channel, queueHandlerMap, handlerFns, "notification_worker", 5);
  logger.info("notification_worker_started", { event: "notification_worker_started", queues: Object.keys(NOTIFY_QUEUES).length });
}