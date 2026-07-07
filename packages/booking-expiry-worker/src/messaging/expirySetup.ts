import type amqp from "amqplib";

export const EXPIRY_DELAY_EXCHANGE   = "booking.expiry.delay";
export const EXPIRY_DEAD_EXCHANGE    = "booking.expiry.dead";
export const EXPIRY_DELAY_QUEUE      = "booking.expiry.delay.queue";
export const EXPIRY_PROCESS_QUEUE    = "booking.expiry.process.queue";
export const EXPIRY_ROUTING_KEY      = "delay";
export const EXPIRY_DEAD_ROUTING_KEY = "expire";

const THIRTY_MIN_MS = 30 * 60 * 1000;

export async function setupExpiryTopology(channel: amqp.Channel): Promise<void> {
  await channel.assertExchange(EXPIRY_DELAY_EXCHANGE, "direct", { durable: true });
  await channel.assertExchange(EXPIRY_DEAD_EXCHANGE,  "direct", { durable: true });

  await channel.assertQueue(EXPIRY_DELAY_QUEUE, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange":    EXPIRY_DEAD_EXCHANGE,
      "x-dead-letter-routing-key": EXPIRY_DEAD_ROUTING_KEY,
    },
  });
  await channel.bindQueue(EXPIRY_DELAY_QUEUE, EXPIRY_DELAY_EXCHANGE, EXPIRY_ROUTING_KEY);

  await channel.assertQueue(EXPIRY_PROCESS_QUEUE, { durable: true });
  await channel.bindQueue(EXPIRY_PROCESS_QUEUE, EXPIRY_DEAD_EXCHANGE, EXPIRY_DEAD_ROUTING_KEY);
}

export function scheduleBookingExpiry(channel: amqp.Channel, bookingId: string): void {
  channel.publish(
    EXPIRY_DELAY_EXCHANGE, EXPIRY_ROUTING_KEY,
    Buffer.from(JSON.stringify({ bookingId })),
    { expiration: String(THIRTY_MIN_MS), persistent: true },
  );
}