import { PoolClient } from "pg";

export interface StoredEvent {
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
  version: number;
}

export class ConcurrencyError extends Error {
  constructor(aggregateId: string, expectedVersion: number) {
    super(
      `Aggregate ${aggregateId} was modified concurrently, expected version ${expectedVersion}`,
    );
    this.name = "ConcurrencyError";
  }
}

/**
 * Event store writes MUST use the same transaction client as the domain write.
 */
export const eventStore = {
  async append(
    client: PoolClient,
    aggregateId: string,
    aggregateType: string,
    expectedVersion: number,
    events: Array<{ eventType: string; payload: Record<string, unknown> }>,
  ): Promise<void> {
    try {
      for (let i = 0; i < events.length; i++) {
        const event = events[i]!;
        await client.query(
          `INSERT INTO event_store (aggregate_id, aggregate_type, event_type, payload, version)
           VALUES ($1, $2, $3, $4::jsonb, $5)`,
          [
            aggregateId,
            aggregateType,
            event.eventType,
            JSON.stringify(event.payload),
            expectedVersion + i + 1,
          ],
        );
      }
    } catch (err) {
      if ((err as { code?: string }).code === "23505") {
        throw new ConcurrencyError(aggregateId, expectedVersion);
      }
      throw err;
    }
  },

  async getEvents(
    client: PoolClient,
    aggregateId: string,
  ): Promise<StoredEvent[]> {
    const result = await client.query<StoredEvent>(
      `SELECT aggregate_id AS "aggregateId", event_type AS "eventType", payload, version
       FROM event_store WHERE aggregate_id = $1 ORDER BY version ASC`,
      [aggregateId],
    );
    return result.rows;
  },

  async getCurrentVersion(
    client: PoolClient,
    aggregateId: string,
  ): Promise<number> {
    const result = await client.query<{ version: number }>(
      `SELECT COALESCE(MAX(version), 0) AS version FROM event_store WHERE aggregate_id = $1`,
      [aggregateId],
    );
    return result.rows[0]?.version ?? 0;
  },
};
