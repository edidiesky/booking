import { PoolClient } from "pg";
import { OutboxStatus } from "../../types";
import logger from "../../utils/logger";
import { query, queryOne } from "../../config/database";

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
  | "booking.status_changed"
  | "renter.upsert.requested"
  | "escrow.refunded";

export const MAX_RETRIES = 5;

export interface OutboxEvent {
  id:           string;
  event_type:   OutboxEventType;
  payload:      Record<string, unknown>;
  status:       OutboxStatus;
  retry_count:  number;
  last_error?:  string;
  processed_at?: Date;
  created_at:   Date;
  updated_at:   Date;
}

export const outboxRepository = {
  async create(
    eventType: OutboxEventType,
    payload:   Record<string, unknown>,
    client:    PoolClient
  ): Promise<OutboxEvent> {
    const row = (await client.query(
      `INSERT INTO outbox_events (event_type, payload)
       VALUES ($1, $2::jsonb)
       RETURNING *`,
      [eventType, JSON.stringify(payload)]
    )).rows[0] as OutboxEvent;
    return row;
  },

  // Same table, no active transaction required. For callers that aren't
  // already inside one (most audit-log call sites, scattered across many
  // domains) and shouldn't be forced to refactor just to get outbox
  // durability. This trades strict atomicity (the business action and
  // this insert aren't guaranteed to commit together) for not requiring
  // every call site to thread a transactional client through, an
  // acceptable tradeoff for audit logs specifically: losing an entry on
  // a rare crash between the action committing and this insert running
  // is a much smaller risk than losing a payment or booking event would
  // be, which is why create() above still requires a client.
  async createStandalone(
    eventType: OutboxEventType,
    payload:   Record<string, unknown>,
  ): Promise<OutboxEvent> {
    const row = await queryOne<OutboxEvent>(
      `INSERT INTO outbox_events (event_type, payload)
       VALUES ($1, $2::jsonb)
       RETURNING *`,
      [eventType, JSON.stringify(payload)]
    );
    return row!;
  },

  async getPending(): Promise<OutboxEvent[]> {
    return query<OutboxEvent>(
      `SELECT * FROM outbox_events
       WHERE status = 'pending' AND retry_count < $1
       ORDER BY created_at ASC
       LIMIT 50`,
      [MAX_RETRIES]
    );
  },

  async markProcessed(id: string): Promise<void> {
    await query(
      `UPDATE outbox_events
       SET status = 'processed', processed_at = now(), updated_at = now()
       WHERE id = $1`,
      [id]
    );
  },

  async incrementRetry(id: string, error: string): Promise<void> {
    const event = await queryOne<OutboxEvent>(
      `SELECT retry_count FROM outbox_events WHERE id = $1`,
      [id]
    );
    if (!event) return;

    const nextCount  = event.retry_count + 1;
    const nextStatus: OutboxStatus = nextCount >= MAX_RETRIES ? "dead" : "pending";

    await query(
      `UPDATE outbox_events
       SET retry_count = $1, last_error = $2, status = $3, updated_at = now()
       WHERE id = $4`,
      [nextCount, error, nextStatus, id]
    );

    if (nextStatus === "dead") {
      logger.error("outbox_event_dead", { event: "outbox_event_dead", id, error });
    }
  },
};