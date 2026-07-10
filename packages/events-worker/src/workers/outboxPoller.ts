import { outboxRepository, OutboxEventType } from "@booking/shared";
import * as publisher from "@booking/shared";
import { outboxProcessedCounter, trackError, logger } from "@booking/shared";

const POLL_INTERVAL_MS = parseInt(process.env.OUTBOX_POLL_INTERVAL_MS ?? "5000", 10);

type PublisherFn = (payload: unknown) => void;

const PUBLISHER_MAP: Record<OutboxEventType, PublisherFn> = {
  "booking.created":            publisher.publishBookingCreated    as unknown as PublisherFn,
  "booking.confirmed":          publisher.publishBookingConfirmed  as unknown as PublisherFn,
  "booking.cancelled":          publisher.publishBookingCancelled  as unknown as PublisherFn,
  "booking.checked_in":         publisher.publishBookingCheckedIn  as unknown as PublisherFn,
  "booking.checked_out":        publisher.publishBookingCheckedOut as unknown as PublisherFn,
  "payment.confirmed":          publisher.publishPaymentConfirmed  as unknown as PublisherFn,
  "payment.failed":             publisher.publishPaymentFailed     as unknown as PublisherFn,
  "payment.initiated":          publisher.publishPaymentInitiated  as unknown as PublisherFn,
  "escrow.released":            publisher.publishEscrowReleased    as unknown as PublisherFn,
  "escrow.refunded":            publisher.publishEscrowRefunded    as unknown as PublisherFn,
  "booking.receipt.requested":  publisher.publishBookingReceiptRequested as unknown as PublisherFn,
};

let pollerTimer: NodeJS.Timeout | null = null;

async function pollOnce(): Promise<void> {
  const events = await outboxRepository.getPending();
  if (events.length === 0) return;

  logger.info("outbox_poller_processing", { event: "outbox_poller_processing", count: events.length });

  for (const evt of events) {
    try {
      const pub = PUBLISHER_MAP[evt.event_type];
      if (!pub) {
        await outboxRepository.incrementRetry(evt.id, `Unknown event type: ${evt.event_type}`);
        continue;
      }
      pub(evt.payload);
      await outboxRepository.markProcessed(evt.id);
      outboxProcessedCounter.inc({ event_type: evt.event_type, status: "success" });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      trackError("outbox_publish_failed", evt.event_type, "high");
      outboxProcessedCounter.inc({ event_type: evt.event_type, status: "failed" });
      await outboxRepository.incrementRetry(evt.id, reason);
    }
  }
}

export function startOutboxPoller(): void {
  if (pollerTimer) return;
  pollerTimer = setInterval(() => { pollOnce().catch((err) => logger.error("outbox_poller_error", { error: err.message })); }, POLL_INTERVAL_MS);
  logger.info("outbox_poller_started", { event: "outbox_poller_started", intervalMs: POLL_INTERVAL_MS });
}

export function stopOutboxPoller(): void {
  if (pollerTimer) { clearInterval(pollerTimer); pollerTimer = null; }
}