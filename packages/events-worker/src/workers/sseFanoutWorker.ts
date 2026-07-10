import amqp from "amqplib";
import { getRabbitMQConnection, EXCHANGES, ROUTING_KEYS } from "../connection";
import { sseManager }  from "../../domains/sse/sse.service";
import logger          from "../../utils/logger";
import { trackError }  from "../../utils/metrics";
import { BookingEventPayload, PaymentEventPayload, EscrowEventPayload } from "../publisher";

type ConsumeHandler = (msg: amqp.ConsumeMessage, channel: amqp.Channel) => Promise<void>;

async function bindAndConsume(
  channel:    amqp.Channel,
  exchange:   string,
  routingKey: string,
  queue:      string,
  handler:    ConsumeHandler
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
        trackError("sse_consumer_handler_error", queue, "medium");
        logger.error("sse_consumer_handler_error", {
          event: "sse_consumer_handler_error",
          queue,
          error: (err as Error).message,
        });
        channel.nack(msg, false, false); // no requeue - SSE is best-effort
      }
    },
    { noAck: false }
  );
  logger.info("sse_consumer_bound", { event: "sse_consumer_bound", queue, routingKey });
}

async function handleBookingEvent(msg: amqp.ConsumeMessage): Promise<void> {
  const payload  = JSON.parse(msg.content.toString()) as BookingEventPayload;
  const eventKey = msg.fields.routingKey;

  await Promise.all([
    sseManager.pushToUser(payload.guestUserId, {
      type:    eventKey,
      payload: {
        bookingId:  payload.bookingId,
        bookingRef: payload.bookingRef,
        status:     payload.status,
        checkIn:    payload.checkIn,
        checkOut:   payload.checkOut,
      },
    }),
    sseManager.pushToTenant(payload.tenantId, {
      type:    eventKey,
      payload: {
        bookingId:   payload.bookingId,
        bookingRef:  payload.bookingRef,
        guestUserId: payload.guestUserId,
        status:      payload.status,
        checkIn:     payload.checkIn,
        checkOut:    payload.checkOut,
        totalAmount: payload.totalAmount,
        reason:      payload.reason,
      },
    }),
  ]);

  logger.info("sse_booking_event_fanned_out", {
    event:    "sse_booking_event_fanned_out",
    type:     eventKey,
    bookingId: payload.bookingId,
  });
}

async function handlePaymentEvent(msg: amqp.ConsumeMessage): Promise<void> {
  const payload  = JSON.parse(msg.content.toString()) as PaymentEventPayload;
  const eventKey = msg.fields.routingKey;

  await sseManager.pushToUser(payload.guestUserId, {
    type:    eventKey,
    payload: {
      bookingId:     payload.bookingId,
      amountNgn:     payload.amountNgn,
      transactionId: payload.transactionId,
      gateway:       payload.gateway,
    },
  });
}

async function handleEscrowEvent(msg: amqp.ConsumeMessage): Promise<void> {
  const payload  = JSON.parse(msg.content.toString()) as EscrowEventPayload;
  const eventKey = msg.fields.routingKey;

  await sseManager.pushToTenant(payload.tenantId, {
    type:    eventKey,
    payload: {
      escrowId:       payload.escrowId,
      bookingId:      payload.bookingId,
      hostPayoutNgn:  payload.hostPayoutNgn,
      refundAmountNgn: payload.refundAmountNgn,
    },
  });
}

export async function startSseFanoutWorker(): Promise<void> {
  const connection = getRabbitMQConnection();
  const channel    = await connection.createChannel();
  await channel.prefetch(20);

  const bookingRoutingKeys = [
    ROUTING_KEYS.BOOKING_CREATED,
    ROUTING_KEYS.BOOKING_CONFIRMED,
    ROUTING_KEYS.BOOKING_CANCELLED,
    ROUTING_KEYS.BOOKING_CHECKED_IN,
    ROUTING_KEYS.BOOKING_CHECKED_OUT,
  ];

  for (const routingKey of bookingRoutingKeys) {
    await bindAndConsume(
      channel,
      EXCHANGES.BOOKING,
      routingKey,
      `sse.fanout.${routingKey}`,
      handleBookingEvent
    );
  }

  await bindAndConsume(channel, EXCHANGES.PAYMENT, ROUTING_KEYS.PAYMENT_CONFIRMED, "sse.fanout.payment.confirmed", handlePaymentEvent);
  await bindAndConsume(channel, EXCHANGES.PAYMENT, ROUTING_KEYS.PAYMENT_FAILED,    "sse.fanout.payment.failed",    handlePaymentEvent);
  await bindAndConsume(channel, EXCHANGES.BOOKING, ROUTING_KEYS.ESCROW_RELEASED,   "sse.fanout.escrow.released",   handleEscrowEvent);
  await bindAndConsume(channel, EXCHANGES.BOOKING, ROUTING_KEYS.ESCROW_REFUNDED,   "sse.fanout.escrow.refunded",   handleEscrowEvent);

  logger.info("sse_fanout_worker_started", { event: "sse_fanout_worker_started" });
}
