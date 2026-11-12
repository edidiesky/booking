import { generateWorkerId, OutboxEventType, outboxRepository } from "@/domains/outbox/outbox.repository";
import * as publisher from "../publisher";
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
  "booking.host_statement.requested": publisher.publishHostStatementRequested as unknown as PublisherFn,
  "audit.log.requested": publisher.publishAuditLogRequested as unknown as PublisherFn,
  "property.created": publisher.publishPropertyCreated as unknown as PublisherFn,
  "property.updated": publisher.publishPropertyUpdated as unknown as PublisherFn,
  "property.deleted": publisher.publishPropertyDeleted as unknown as PublisherFn,
  "renter.upsert.requested":  publisher.publishRentalsRecordUpserted as unknown as PublisherFn
};

let pollerTimer: NodeJS.Timeout | null = null;
const WORKER_ID = generateWorkerId();
async function pollOnce(): Promise<void> {
  const events = await outboxRepository.claimPending(WORKER_ID);
  if (events.length === 0) return;

  logger.info("outbox_poller_processing", { event: "outbox_poller_processing", count: events.length });

  for (const evt of events) {
    try {
      const pub = PUBLISHER_MAP[evt.event_type];
      if (!pub) {
        await outboxRepository.incrementRetry(evt.id, WORKER_ID, `Unknown event type: ${evt.event_type}`);
        continue;
      }
      pub(evt.payload);
      const wrote = await outboxRepository.markProcessed(evt.id, WORKER_ID);
      if (!wrote) {
        logger.warn("outbox_marked_processed_after_lease_lost", { event: "outbox_marked_processed_after_lease_lost", id: evt.id, type: evt.event_type });
      }
      outboxProcessedCounter.inc({ event_type: evt.event_type, status: "success" });
    } catch (err) {
       const reason = err instanceof Error ? err.message : String(err);
      trackError("outbox_publish_failed", evt.event_type, "high");
      outboxProcessedCounter.inc({ event_type: evt.event_type, status: "failed" });
      await outboxRepository.incrementRetry(evt.id, WORKER_ID, reason);
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