import crypto from "crypto";
import { query, queryOne } from "../../config/database";
import logger from "../../utils/logger";
import { trackError } from "../../utils/metrics";
import { idempotencyStateCounter } from "../../utils/metrics";

export type IdempotencyStatus = "processing" | "completed" | "failed";

export interface IdempotencyKey {
  id:             string;
  request_hash:   string;
  endpoint:       string;
  user_id:        string | null;
  status:         IdempotencyStatus;
  status_code:    number | null;
  response_body:  Record<string, unknown> | null;
  failure_reason: string | null;
  expires_at:     Date;
  created_at:     Date;
  updated_at:     Date;
}

const TTL_MS         = 24 * 60 * 60 * 1000;
const STALE_MS        = 2 * 60 * 1000;

export class IdempotencyConflictError extends Error {
  constructor() { super("Request already processing. Retry shortly."); }
}

export const idempotencyRepository = {
  buildHash(method: string, endpoint: string, userId: string, body: Record<string, unknown>): string {
    const raw = `${method}:${endpoint}:${userId}:${JSON.stringify(body)}`;
    return crypto.createHash("sha256").update(raw).digest("hex");
  },

  /**
   * Atomically claims a request hash. Returns the row this caller now owns,
   * or throws IdempotencyConflictError if another in-flight request owns it.
   * Returns null if a completed/failed response already exists (caller must
   * then call find() to get the terminal row).
   */
  async claim(requestHash: string, endpoint: string, userId?: string): Promise<IdempotencyKey | null> {
    const expiresAt = new Date(Date.now() + TTL_MS);

    const inserted = await queryOne<IdempotencyKey>(
      `INSERT INTO idempotency_keys (request_hash, endpoint, user_id, status, expires_at)
       VALUES ($1,$2,$3,'processing',$4)
       ON CONFLICT (request_hash) DO NOTHING
       RETURNING *`,
      [requestHash, endpoint, userId ?? null, expiresAt],
    );

    if (inserted) {
      idempotencyStateCounter.inc({ status: "processing" });
      return inserted;
    }

    const existing = await queryOne<IdempotencyKey>(
      `SELECT * FROM idempotency_keys WHERE request_hash = $1`,
      [requestHash],
    );
    if (!existing) return null; // race: row got deleted between insert-conflict and select, caller should retry claim once

    if (existing.status === "completed") return null; // signal: terminal, caller fetches via find()

    if (existing.status === "failed") {
      await query(`DELETE FROM idempotency_keys WHERE id = $1`, [existing.id]);
      return idempotencyRepository.claim(requestHash, endpoint, userId);
    }

    // status === 'processing'
    const ageMs = Date.now() - new Date(existing.updated_at).getTime();
    if (ageMs > STALE_MS) {
      logger.warn("idempotency_stale_processing_reclaimed", {
        event: "idempotency_stale_processing_reclaimed", requestHash, ageMs,
      });
      const reclaimed = await queryOne<IdempotencyKey>(
        `UPDATE idempotency_keys SET updated_at = now() WHERE id = $1 AND status = 'processing' RETURNING *`,
        [existing.id],
      );
      idempotencyStateCounter.inc({ status: "reclaimed" });
      return reclaimed;
    }

    idempotencyStateCounter.inc({ status: "conflict" });
    throw new IdempotencyConflictError();
  },

  async find(requestHash: string): Promise<IdempotencyKey | null> {
    try {
      return await queryOne<IdempotencyKey>(
        `SELECT * FROM idempotency_keys WHERE request_hash = $1 AND status = 'completed' AND expires_at > now()`,
        [requestHash],
      );
    } catch (err) {
      trackError("idempotency_lookup_failed", "idempotency_repository", "medium");
      return null;
    }
  },

  async markCompleted(id: string, statusCode: number, responseBody: Record<string, unknown>): Promise<void> {
    await query(
      `UPDATE idempotency_keys SET status = 'completed', status_code = $1, response_body = $2::jsonb, updated_at = now() WHERE id = $3`,
      [statusCode, JSON.stringify(responseBody), id],
    );
    idempotencyStateCounter.inc({ status: "completed" });
  },

  async markFailed(id: string, reason: string): Promise<void> {
    await query(
      `UPDATE idempotency_keys SET status = 'failed', failure_reason = $1, updated_at = now() WHERE id = $2`,
      [reason, id],
    );
    idempotencyStateCounter.inc({ status: "failed" });
  },

  async purgeExpired(): Promise<number> {
    const result = await query<{ id: string }>(`DELETE FROM idempotency_keys WHERE expires_at < now() RETURNING id`);
    return result.length;
  },
};