import type amqp from "amqplib";
import { bookingRepository, logger } from "@booking/shared";
import { setupExpiryTopology, EXPIRY_PROCESS_QUEUE } from "../messaging/expirySetup";

export async function startBookingExpiryWorker(connection: amqp.ChannelModel): Promise<void> {
  const channel = await connection.createChannel();
  await channel.prefetch(5);
  await setupExpiryTopology(channel);

  channel.consume(EXPIRY_PROCESS_QUEUE, async (msg) => {
    if (!msg) return;
    const { bookingId } = JSON.parse(msg.content.toString()) as { bookingId: string };

    try {
      const booking = await bookingRepository.findById(bookingId);

      if (!booking) {
        logger.warn("booking_expiry_not_found", { event: "booking_expiry_not_found", bookingId });
        channel.ack(msg);
        return;
      }

      if (booking.status !== "pending_payment") {
        logger.info("booking_expiry_skipped_already_resolved", {
          event: "booking_expiry_skipped_already_resolved", bookingId, status: booking.status,
        });
        channel.ack(msg);
        return;
      }
      
      const res = await fetch(`${process.env.API_INTERNAL_URL}/internal/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-internal-secret": process.env.INTERNAL_SECRET ?? "" },
        body: JSON.stringify({ reason: "Payment window expired after 30 minutes." }),
      });

      if (!res.ok) throw new Error(`Internal cancel endpoint returned ${res.status}`);

      logger.info("booking_expiry_cancelled", { event: "booking_expiry_cancelled", bookingId });
      channel.ack(msg);
    } catch (err) {
      logger.error("booking_expiry_processing_failed", {
        event: "booking_expiry_processing_failed", bookingId, error: (err as Error).message,
      });
      channel.nack(msg, false, true);
    }
  }, { noAck: false });

  logger.info("booking_expiry_worker_started", { event: "booking_expiry_worker_started" });
}