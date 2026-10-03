import { PoolClient } from "pg";
import { randomUUID } from "crypto";
import { OutboxStatus } from "../../types";
import logger from "../../utils/logger";
import { query, queryOne } from "@booking/shared";

export type OutboxEventType =
  | "booking.created"
  | "booking.confirmed"
  | "booking.cancelled"
  | "booking.checked_in"
  | "booking.checked_out"
  | "booking.receipt.requested"
  | "booking.host_statement.requested"
  | "audit.log.requested"
  | "property.created"
  | "property.updated"
  | "property.deleted"
  | "payment.confirmed"
  | "payment.failed"
  | "payment.initiated"
  | "escrow.released"
  | "renter.upsert.requested"
  | "escrow.refunded";

export const MAX_RETRIES = 5;
const LEASE_MS = 30_000;

export interface OutboxEvent {
  id:               string;
  event_type:       OutboxEventType;
  payload:          Record<string, unknown>;
  status:           OutboxStatus;
  retry_count:      number;
  last_error?:      string;
  claimed_by:       string | null;
  lease_expires_at: Date | null;
  processed_at?:    Date;
  created_at:       Date;
  updated_at:       Date;
}

export const outboxRepository = {
  async create(eventType: OutboxEventType, payload: Record<string, unknown>, client: PoolClient): Promise<OutboxEvent> {
    const row = (await client.query(
      `INSERT INTO outbox_events (event_type, payload) VALUES ($1, $2::jsonb) RETURNING *`,
      [eventType, JSON.stringify(payload)]
    )).rows[0] as OutboxEvent;
    return row;
  },

  async createStandalone(eventType: OutboxEventType, payload: Record<string, unknown>): Promise<OutboxEvent> {
    const row = await queryOne<OutboxEvent>(
      `INSERT INTO outbox_events (event_type, payload) VALUES ($1, $2::jsonb) RETURNING *`,
      [eventType, JSON.stringify(payload)]
    );
    return row!;
  },

  async claimPending(workerId: string, limit = 50): Promise<OutboxEvent[]> {
    return query<OutboxEvent>(
      `UPDATE outbox_events
       SET claimed_by = $1, lease_expires_at = now() + interval '${LEASE_MS} milliseconds', updated_at = now()
       WHERE id IN (
         SELECT id FROM outbox_events
         WHERE status = 'pending'
           AND retry_count < $2
           AND (lease_expires_at IS NULL OR lease_expires_at < now())
         ORDER BY created_at ASC
         LIMIT $3
         FOR UPDATE SKIP LOCKED
       )
       RETURNING *`,
      [workerId, MAX_RETRIES, limit]
    );
  },

  async getPendingUnclaimed(): Promise<OutboxEvent[]> {
    return query<OutboxEvent>(
      `SELECT * FROM outbox_events WHERE status = 'pending' AND retry_count < $1 ORDER BY created_at ASC LIMIT 50`,
      [MAX_RETRIES]
    );
  },

  async markProcessed(id: string, workerId: string): Promise<boolean> {
    const result = await queryOne<{ id: string }>(
      `UPDATE outbox_events
       SET status = 'processed', processed_at = now(), updated_at = now(), claimed_by = NULL, lease_expires_at = NULL
       WHERE id = $1 AND claimed_by = $2
       RETURNING id`,
      [id, workerId]
    );
    return !!result;
  },

  async incrementRetry(id: string, workerId: string, error: string): Promise<void> {
    const event = await queryOne<OutboxEvent>(
      `SELECT retry_count FROM outbox_events WHERE id = $1 AND claimed_by = $2`,
      [id, workerId]
    );
    if (!event) {
      logger.warn("outbox_retry_skipped_lease_lost", { event: "outbox_retry_skipped_lease_lost", id });
      return;
    }

    const nextCount  = event.retry_count + 1;
    const nextStatus: OutboxStatus = nextCount >= MAX_RETRIES ? "dead" : "pending";

    await query(
      `UPDATE outbox_events
       SET retry_count = $1, last_error = $2, status = $3, updated_at = now(), claimed_by = NULL, lease_expires_at = NULL
       WHERE id = $4 AND claimed_by = $5`,
      [nextCount, error, nextStatus, id, workerId]
    );

    if (nextStatus === "dead") {
      logger.error("outbox_event_dead", { event: "outbox_event_dead", id, error });
    }
  },
};

export function generateWorkerId(): string {
  return randomUUID();
}