import { PoolClient } from "pg";
import { query, queryOne } from "../../config/database";
import { OutboxStatus } from "../../types";
import logger from "../../utils/logger";

export type OutboxEventType =
  | "booking.created"
  | "booking.confirmed"
  | "booking.cancelled"
  | "booking.checked_in"
  | "booking.checked_out"
  | "booking.receipt.requested"   
  | "payment.confirmed"
  | "payment.failed"
  | "payment.initiated"
  | "escrow.released"
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
