import crypto from "crypto";
import { randomUUID } from "crypto";
import { query, queryOne, trackError, idempotencyStateCounter } from "@booking/shared";
import logger from "../../utils/logger";

export type IdempotencyStatus = "processing" | "completed" | "failed";

export interface IdempotencyKey {
  id:                string;
  request_hash:      string;
  endpoint:          string;
  user_id:           string | null;
  status:            IdempotencyStatus;
  status_code:       number | null;
  response_body:     Record<string, unknown> | null;
  failure_reason:    string | null;
  claimed_by:        string | null;
  lease_expires_at:  Date | null;
  expires_at:        Date;
  created_at:        Date;
  updated_at:        Date;
}

const TTL_MS   = 24 * 60 * 60 * 1000;
const LEASE_MS = 2 * 60 * 1000;

export class IdempotencyConflictError extends Error {
  constructor() { super("Request already processing. Retry shortly."); }
}

export interface ClaimResult {
  row:       IdempotencyKey;
  ownerToken: string;
}

export const idempotencyRepository = {
  buildHash(method: string, endpoint: string, userId: string, body: Record<string, unknown>): string {
    const raw = `${method}:${endpoint}:${userId}:${JSON.stringify(body)}`;
    return crypto.createHash("sha256").update(raw).digest("hex");
  },

  async claim(requestHash: string, endpoint: string, userId?: string): Promise<ClaimResult | null> {
    const ownerToken = randomUUID();
    const expiresAt  = new Date(Date.now() + TTL_MS);
    const leaseExpiresAt = new Date(Date.now() + LEASE_MS);

    const inserted = await queryOne<IdempotencyKey>(
      `INSERT INTO idempotency_keys (request_hash, endpoint, user_id, status, expires_at, claimed_by, lease_expires_at)
       VALUES ($1,$2,$3,'processing',$4,$5,$6)
       ON CONFLICT (request_hash) DO NOTHING
       RETURNING *`,
      [requestHash, endpoint, userId ?? null, expiresAt, ownerToken, leaseExpiresAt],
    );

    if (inserted) {
      idempotencyStateCounter.inc({ status: "processing" });
      return { row: inserted, ownerToken };
    }

    const existing = await queryOne<IdempotencyKey>(
      `SELECT * FROM idempotency_keys WHERE request_hash = $1`,
      [requestHash],
    );
    if (!existing) return null;

    if (existing.status === "completed") return null;

    if (existing.status === "failed") {
      await query(`DELETE FROM idempotency_keys WHERE id = $1`, [existing.id]);
      return idempotencyRepository.claim(requestHash, endpoint, userId);
    }

    const reclaimed = await queryOne<IdempotencyKey>(
      `UPDATE idempotency_keys
       SET claimed_by = $1, lease_expires_at = $2, updated_at = now()
       WHERE id = $3 AND status = 'processing' AND lease_expires_at < now()
       RETURNING *`,
      [ownerToken, leaseExpiresAt, existing.id],
    );

    if (reclaimed) {
      logger.warn("idempotency_lease_expired_reclaimed", {
        event: "idempotency_lease_expired_reclaimed", requestHash,
        previousOwner: existing.claimed_by,
      });
      idempotencyStateCounter.inc({ status: "reclaimed" });
      return { row: reclaimed, ownerToken };
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

  async markCompleted(id: string, ownerToken: string, statusCode: number, responseBody: Record<string, unknown>): Promise<boolean> {
    const result = await queryOne<{ id: string }>(
      `UPDATE idempotency_keys
       SET status = 'completed', status_code = $1, response_body = $2::jsonb, updated_at = now()
       WHERE id = $3 AND claimed_by = $4
       RETURNING id`,
      [statusCode, JSON.stringify(responseBody), id, ownerToken],
    );
    if (result) idempotencyStateCounter.inc({ status: "completed" });
    else {
      logger.warn("idempotency_mark_completed_lost_lease", { event: "idempotency_mark_completed_lost_lease", id });
    }
    return !!result;
  },

  async markFailed(id: string, ownerToken: string, reason: string): Promise<boolean> {
    const result = await queryOne<{ id: string }>(
      `UPDATE idempotency_keys
       SET status = 'failed', failure_reason = $1, updated_at = now()
       WHERE id = $2 AND claimed_by = $3
       RETURNING id`,
      [reason, id, ownerToken],
    );
    if (result) idempotencyStateCounter.inc({ status: "failed" });
    else {
      logger.warn("idempotency_mark_failed_lost_lease", { event: "idempotency_mark_failed_lost_lease", id });
    }
    return !!result;
  },

  async purgeExpired(): Promise<number> {
    const result = await query<{ id: string }>(`DELETE FROM idempotency_keys WHERE expires_at < now() RETURNING id`);
    return result.length;
  },
};