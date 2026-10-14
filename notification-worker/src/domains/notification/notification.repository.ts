import { Pool } from "pg";

export interface OutboxEvent {
  id: number; event_type: string; payload: Record<string, unknown>; tenant_id: string;
}

// its own repository now rather than inline in the poll loop.
export const notificationRepository = {
  async claimBatch(pool: Pool, workerId: string, limit: number): Promise<OutboxEvent[]> {
    const result = await pool.query<OutboxEvent>(
      `UPDATE outbox_events SET claimed_by = $1, lease_expires_at = now() + interval '30 seconds'
       WHERE id IN (
         SELECT id FROM outbox_events
         WHERE published_at IS NULL AND (lease_expires_at IS NULL OR lease_expires_at < now())
         ORDER BY id LIMIT $2 FOR UPDATE SKIP LOCKED
       ) RETURNING *`,
      [workerId, limit],
    );
    return result.rows;
  },

  async markPublished(pool: Pool, eventId: number, workerId: string): Promise<void> {
    await pool.query(`UPDATE outbox_events SET published_at = now() WHERE id = $1 AND claimed_by = $2`, [eventId, workerId]);
  },
};

/** @deprecated use notificationRepository */
export const outboxRepository = notificationRepository;
