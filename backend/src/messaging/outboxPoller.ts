import { outboxRepository, OutboxEventType } from "../domains/outbox/outbox.repository";
import {
  publishBookingCreated,
  publishBookingConfirmed,
  publishBookingCancelled,
  publishBookingCheckedIn,
  publishBookingCheckedOut,
  publishPaymentConfirmed,
  publishPaymentFailed,
  publishPaymentInitiated,
  publishEscrowReleased,
  publishEscrowRefunded,
} from "./publisher";
import { outboxProcessedCounter, trackError } from "../utils/metrics";
import logger from "../utils/logger";

const POLL_INTERVAL_MS = parseInt(process.env.OUTBOX_POLL_INTERVAL_MS ?? "5000", 10);

type PublisherFn = (payload: unknown) => void;

const PUBLISHER_MAP: Record<OutboxEventType, PublisherFn> = {
  "booking.created":    publishBookingCreated    as unknown as PublisherFn,
  "booking.confirmed":  publishBookingConfirmed  as unknown as PublisherFn,
  "booking.cancelled":  publishBookingCancelled  as unknown as PublisherFn,
  "booking.checked_in": publishBookingCheckedIn  as unknown as PublisherFn,
  "booking.checked_out":publishBookingCheckedOut as unknown as PublisherFn,
  "payment.confirmed":  publishPaymentConfirmed  as unknown as PublisherFn,
  "payment.failed":     publishPaymentFailed     as unknown as PublisherFn,
  "payment.initiated":  publishPaymentInitiated  as unknown as PublisherFn,
  "escrow.released":    publishEscrowReleased    as unknown as PublisherFn,
  "escrow.refunded":    publishEscrowRefunded    as unknown as PublisherFn,
};

let pollerTimer: NodeJS.Timeout | null = null;

async function pollOnce(): Promise<void> {
  const events = await outboxRepository.getPending();
  if (events.length === 0) return;

  logger.info("outbox_poller_processing", { event: "outbox_poller_processing", count: events.length });

  for (const evt of events) {
    try {
      const publisher = PUBLISHER_MAP[evt.event_type];
      if (!publisher) {
        logger.error("outbox_unknown_event_type", { event: "outbox_unknown_event_type", type: evt.event_type, id: evt.id });
        await outboxRepository.incrementRetry(evt.id, `Unknown event type: ${evt.event_type}`);
        continue;
      }

      publisher(evt.payload);
      await outboxRepository.markProcessed(evt.id);
      outboxProcessedCounter.inc({ event_type: evt.event_type, status: "success" });

      logger.info("outbox_event_published", { event: "outbox_event_published", type: evt.event_type, id: evt.id });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      trackError("outbox_publish_failed", evt.event_type, "high");
      outboxProcessedCounter.inc({ event_type: evt.event_type, status: "failed" });
      logger.error("outbox_event_publish_failed", { event: "outbox_event_publish_failed", type: evt.event_type, id: evt.id, reason });
      await outboxRepository.incrementRetry(evt.id, reason);
    }
  }
}

export function startOutboxPoller(): void {
  if (pollerTimer) return;

  pollerTimer = setInterval(async () => {
    try {
      await pollOnce();
    } catch (err) {
      trackError("outbox_poller_error", "outbox_poller", "critical");
      logger.error("outbox_poller_error", { event: "outbox_poller_error", error: (err as Error).message });
    }
  }, POLL_INTERVAL_MS);

  logger.info("outbox_poller_started", { event: "outbox_poller_started", intervalMs: POLL_INTERVAL_MS });
}

export function stopOutboxPoller(): void {
  if (pollerTimer) {
    clearInterval(pollerTimer);
    pollerTimer = null;
    logger.info("outbox_poller_stopped", { event: "outbox_poller_stopped" });
  }
}
