import {
  createScheduleIndex,
  createLockedScheduler,
  bookingRepository,
  logger,
} from "@booking/shared";

export const scheduleIndex = createScheduleIndex("schedule:booking_expiry");
const THIRTY_MIN_MS = 30 * 60 * 1000;

export function scheduleBookingExpiry(bookingId: string): void {
  void scheduleIndex.add(bookingId, Date.now() + THIRTY_MIN_MS);
}

async function tick(): Promise<void> {
  const due = await scheduleIndex.claimDue(Date.now(), 100);
  if (due.length === 0) return;

  for (const bookingId of due) {
    try {
      const booking = await bookingRepository.findById(bookingId);
      if (!booking || booking.status !== "pending_payment") continue;

      const res = await fetch(
        `${process.env.API_INTERNAL_URL}/bookings/internal/${bookingId}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": process.env.INTERNAL_SECRET ?? "",
          },
          body: JSON.stringify({
            reason: "Payment window expired after 30 minutes.",
          }),
        },
      );
      if (!res.ok) {
        logger.info(`Internal cancel endpoint returned ${res.status}`, {
          event: "booking_expiry_not_cancelled",
          bookingId,
        });
        throw new Error(`Internal cancel endpoint returned ${res.status}`);
      }

      logger.info("booking_expiry_cancelled", {
        event: "booking_expiry_cancelled",
        bookingId,
      });
    } catch (err) {
      logger.error("booking_expiry_processing_failed", {
        event: "booking_expiry_processing_failed",
        bookingId,
        error: (err as Error).message,
      });
      void scheduleIndex.add(bookingId, Date.now() + 60_000);
    }
  }

  logger.info("booking_expiry_tick_complete", {
    event: "booking_expiry_tick_complete",
    claimedCount: due.length,
  });
}

const scheduler = createLockedScheduler({
  lockKey: "scheduler:booking_expiry:lock",
  lockTtlSec: 15,
  tickMs: 30_000,
  serviceName: "booking-expiry-worker",
  onTick: tick,
});

export const startBookingExpiryScheduler = scheduler.start;
export const stopBookingExpiryScheduler = scheduler.stop;
