import amqp from "amqplib";
import logger from "../utils/logger";

export const EXCHANGES = {
  BOOKING:      "booking.events",
  PAYMENT:      "payment.events",
  NOTIFICATION: "notification.events",
} as const;

export const ROUTING_KEYS = {
  BOOKING_CREATED:    "booking.created",
  BOOKING_CONFIRMED:  "booking.confirmed",
  BOOKING_CANCELLED:  "booking.cancelled",
  BOOKING_CHECKED_IN: "booking.checked_in",
  BOOKING_CHECKED_OUT:"booking.checked_out",
  PAYMENT_CONFIRMED:  "payment.confirmed",
  PAYMENT_FAILED:     "payment.failed",
  PAYMENT_INITIATED:  "payment.initiated",
  ESCROW_RELEASED:    "escrow.released",
  ESCROW_REFUNDED:    "escrow.refunded",
  NOTIFICATION_EMAIL: "notification.email",
  NOTIFY_BOOKING_CONFIRMED:  "notify.booking.confirmed",
  NOTIFY_BOOKING_CANCELLED:  "notify.booking.cancelled",
  NOTIFY_BOOKING_CHECKED_IN: "notify.booking.checkin",
  NOTIFY_BOOKING_CHECKED_OUT:"notify.booking.checkout",
  NOTIFY_PAYMENT_CONFIRMED:  "notify.payment.confirmed",
  NOTIFY_PAYMENT_FAILED:     "notify.payment.failed",
  NOTIFY_AUTH_OTP:           "notify.auth.otp",
  NOTIFY_AUTH_REGISTERED:    "notify.auth.registered",
  NOTIFY_ESCROW_RELEASED:    "notify.escrow.released",
  BOOKING_RECEIPT_REQUESTED: "booking.receipt.requested",
} as const;

let _connection: amqp.ChannelModel | null = null;
let _channel:    amqp.Channel | null      = null;

const MAX_RETRIES   = 10;
const BASE_DELAY_MS = 1_000;

export async function connectRabbitMQ(): Promise<void> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      _connection = await amqp.connect(process.env.RABBITMQ_URL!);
      _channel    = await _connection.createChannel();

      for (const exchange of Object.values(EXCHANGES)) {
        await _channel.assertExchange(exchange, "topic", { durable: true });
      }

      _connection.on("error", (err) => {
        logger.error("rabbitmq_error", { event: "rabbitmq_error", error: err.message });
      });
      _connection.on("close", () => {
        logger.warn("rabbitmq_closed", { event: "rabbitmq_closed" });
        _channel    = null;
        _connection = null;
      });

      logger.info("rabbitmq_connected", { event: "rabbitmq_connected", attempt });
      return;
    } catch (err) {
      logger.error("rabbitmq_connect_failed", { event: "rabbitmq_connect_failed", attempt, error: (err as Error).message });
      if (attempt === MAX_RETRIES - 1) throw err;
      const delay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt), 30_000) + Math.random() * 1_000;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

export function getRabbitMQChannel(): amqp.Channel {
  if (!_channel) throw new Error("RabbitMQ channel not initialized");
  return _channel;
}

export function getRabbitMQConnection(): amqp.ChannelModel {
  if (!_connection) throw new Error("RabbitMQ connection not initialized");
  return _connection;
}

export async function disconnectRabbitMQ(): Promise<void> {
  if (_channel)    await _channel.close().catch(() => null);
  if (_connection) await _connection.close().catch(() => null);
  logger.info("rabbitmq_disconnected", { event: "rabbitmq_disconnected" });
}
