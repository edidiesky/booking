import { Pool } from "pg";
import crypto from "crypto";

export type IdempotencyStatus = "processing" | "completed" | "failed";

export interface IdempotencyKey {
  id: string;
  request_hash: string;
  status: IdempotencyStatus;
  response_body: Record<string, unknown> | null;
}

const LEASE_MS = 30_000;

export class IdempotencyConflictError extends Error {
  status = 409;
  constructor() {
    super("Request already processing. Retry shortly.");
    this.name = "IdempotencyConflictError";
  }
}

export function buildRequestHash(
  method: string,
  endpoint: string,
  userId: string,
  body: Record<string, unknown>,
): string {
  return crypto
    .createHash("sha256")
    .update(`${method}:${endpoint}:${userId}:${JSON.stringify(body)}`)
    .digest("hex");
}

export const idempotencyRepository = {
  /**
   * Returns:
   * - new/reclaimed processing row → caller should execute work
   * - completed row → caller should return response_body (replay)
   * throws IdempotencyConflictError if another worker holds an active lease
   */
  async claim(
    pool: Pool,
    requestHash: string,
    endpoint: string,
    userId?: string,
  ): Promise<{ kind: "execute"; key: IdempotencyKey } | { kind: "replay"; key: IdempotencyKey }> {
    const insert = await pool.query<IdempotencyKey>(
      `INSERT INTO idempotency_keys (request_hash, endpoint, user_id, status, lease_expires_at)
       VALUES ($1, $2, $3, 'processing', now() + ($4 * interval '1 millisecond'))
       ON CONFLICT (request_hash) DO NOTHING
       RETURNING id, request_hash, status, response_body`,
      [requestHash, endpoint, userId ?? null, LEASE_MS],
    );
    if (insert.rows[0]) {
      return { kind: "execute", key: insert.rows[0] };
    }

    const existing = await pool.query<IdempotencyKey & { lease_expires_at: Date | null }>(
      `SELECT id, request_hash, status, response_body, lease_expires_at
       FROM idempotency_keys WHERE request_hash = $1`,
      [requestHash],
    );
    const row = existing.rows[0];
    if (!row) {
      throw new Error("idempotency claim race: row missing after conflict");
    }

    if (row.status === "completed") {
      return { kind: "replay", key: row };
    }

    // failed → allow retry by reclaiming
    if (row.status === "failed") {
      const reclaimed = await pool.query<IdempotencyKey>(
        `UPDATE idempotency_keys
         SET status = 'processing',
             failure_reason = NULL,
             response_body = NULL,
             lease_expires_at = now() + ($2 * interval '1 millisecond')
         WHERE id = $1 AND status = 'failed'
         RETURNING id, request_hash, status, response_body`,
        [row.id, LEASE_MS],
      );
      if (reclaimed.rows[0]) {
        return { kind: "execute", key: reclaimed.rows[0] };
      }
    }

    // processing with expired lease → reclaim
    const reclaimedLease = await pool.query<IdempotencyKey>(
      `UPDATE idempotency_keys
       SET lease_expires_at = now() + ($2 * interval '1 millisecond')
       WHERE id = $1
         AND status = 'processing'
         AND (lease_expires_at IS NULL OR lease_expires_at < now())
       RETURNING id, request_hash, status, response_body`,
      [row.id, LEASE_MS],
    );
    if (reclaimedLease.rows[0]) {
      return { kind: "execute", key: reclaimedLease.rows[0] };
    }

    throw new IdempotencyConflictError();
  },

  async markCompleted(
    pool: Pool,
    id: string,
    responseBody: Record<string, unknown>,
  ): Promise<void> {
    await pool.query(
      `UPDATE idempotency_keys
       SET status = 'completed',
           response_body = $2::jsonb,
           lease_expires_at = NULL
       WHERE id = $1`,
      [id, JSON.stringify(responseBody)],
    );
  },

  async markFailed(pool: Pool, id: string, reason: string): Promise<void> {
    await pool.query(
      `UPDATE idempotency_keys
       SET status = 'failed',
           failure_reason = $2,
           lease_expires_at = NULL
       WHERE id = $1`,
      [id, reason],
    );
  },
};
