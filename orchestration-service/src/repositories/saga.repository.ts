import { Pool } from "pg";

export type SagaStatus =
  | "running"
  | "completed"
  | "compensating"
  | "compensated"
  | "failed";

export interface ClaimedSaga {
  id: string;
  status: SagaStatus;
  current_step: number;
  context: unknown;
  compensation_cursor: number | null;
  compensation_attempts: number;
  forward_attempts: number;
}

export interface SagaRecord {
  id: string;
  status: SagaStatus;
  context: unknown;
  current_step: number;
  booking_id: string | null;
  last_error: string | null;
}

function extractBookingId(context: unknown): string | null {
  if (
    context &&
    typeof context === "object" &&
    typeof (context as { bookingId?: unknown }).bookingId === "string"
  ) {
    return (context as { bookingId: string }).bookingId;
  }
  return null;
}

const RECORD_COLS = `id, status, context, current_step, booking_id, last_error`;

export const sagaRepository = {
  /**
   * Inserts a saga. If a unique rule rejects it, returns the saga that already owns it:
   *   - same idempotency key, or
   *   - the booking's currently ACTIVE saga (one active saga per booking).
   */
  async insert(
    pool: Pool,
    sagaType: string,
    context: unknown,
    bookingId?: string,
    idempotencyKey?: string,
  ): Promise<{ id: string; created: boolean }> {
    const inserted = await pool.query<{ id: string }>(
      `INSERT INTO saga_instances (saga_type, context, booking_id, idempotency_key)
       VALUES ($1, $2::jsonb, $3, $4)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [sagaType, JSON.stringify(context), bookingId ?? null, idempotencyKey ?? null],
    );
    if (inserted.rows[0]) return { id: inserted.rows[0].id, created: true };

    const existing = await pool.query<{ id: string }>(
      `SELECT id FROM saga_instances
        WHERE saga_type = $1
          AND ( ($2::text IS NOT NULL AND idempotency_key = $2)
             OR ($3::uuid IS NOT NULL AND booking_id = $3 AND status IN ('running','compensating')) )
        ORDER BY created_at DESC LIMIT 1`,
      [sagaType, idempotencyKey ?? null, bookingId ?? null],
    );
    return { id: existing.rows[0]!.id, created: false };
  },

  async claim(pool: Pool, sagaId: string, leaseMs: number): Promise<ClaimedSaga | null> {
    const result = await pool.query<ClaimedSaga>(
      `UPDATE saga_instances
       SET claimed_by = gen_random_uuid(),
           lease_expires_at = now() + ($2 * interval '1 millisecond'),
           updated_at = now()
       WHERE id = $1
         AND status IN ('running', 'compensating')
         AND (lease_expires_at IS NULL OR lease_expires_at < now())
       RETURNING id, status, current_step, context,
                 compensation_cursor, compensation_attempts, forward_attempts`,
      [sagaId, leaseMs],
    );
    return result.rows[0] ?? null;
  },

  /** Heartbeat: keeps the lease alive while a long saga is still working. */
  async renewLease(pool: Pool, sagaId: string, leaseMs: number) {
    await pool.query(
      `UPDATE saga_instances
       SET lease_expires_at = now() + ($2 * interval '1 millisecond'), updated_at = now()
       WHERE id = $1 AND claimed_by IS NOT NULL`,
      [sagaId, leaseMs],
    );
  },

  async findById(pool: Pool, sagaId: string): Promise<SagaRecord | null> {
    const r = await pool.query<SagaRecord>(
      `SELECT ${RECORD_COLS} FROM saga_instances WHERE id = $1`,
      [sagaId],
    );
    return r.rows[0] ?? null;
  },

  /** Most recent saga for a booking, whatever its status. */
  async findByBookingId(pool: Pool, bookingId: string): Promise<SagaRecord | null> {
    const r = await pool.query<SagaRecord>(
      `SELECT ${RECORD_COLS} FROM saga_instances
       WHERE booking_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [bookingId],
    );
    return r.rows[0] ?? null;
  },

  async updateProgress(pool: Pool, sagaId: string, step: number, context: unknown) {
    await pool.query(
      `UPDATE saga_instances
       SET current_step = $1, context = $2::jsonb,
           booking_id = COALESCE($4::uuid, booking_id),
           forward_attempts = 0, updated_at = now()
       WHERE id = $3`,
      [step, JSON.stringify(context), sagaId, extractBookingId(context)],
    );
  },

  async updateStatus(pool: Pool, sagaId: string, status: SagaStatus, error?: string) {
    await pool.query(
      `UPDATE saga_instances
       SET status = $1, last_error = COALESCE($3, last_error),
           updated_at = now(), lease_expires_at = NULL, claimed_by = NULL
       WHERE id = $2`,
      [status, sagaId, error ?? null],
    );
  },

  /** Park at a wait point: no lease, so a webhook (or the timeout sweeper) can claim it. */
  async markPaused(pool: Pool, sagaId: string, nextStep: number, context: unknown) {
    await pool.query(
      `UPDATE saga_instances
       SET status = 'running', current_step = $2, context = $3::jsonb,
           booking_id = COALESCE($4::uuid, booking_id),
           forward_attempts = 0,
           lease_expires_at = NULL, claimed_by = NULL, updated_at = now()
       WHERE id = $1`,
      [sagaId, nextStep, JSON.stringify(context), extractBookingId(context)],
    );
  },

  /** Enter compensation while still holding the lease. */
  async beginCompensation(pool: Pool, sagaId: string, error: string, cursor: number) {
    await pool.query(
      `UPDATE saga_instances
       SET status = 'compensating', last_error = $2, compensation_cursor = $3,
           updated_at = now()
       WHERE id = $1`,
      [sagaId, error, cursor],
    );
  },

  async saveCompensationCursor(pool: Pool, sagaId: string, cursor: number) {
    await pool.query(
      `UPDATE saga_instances SET compensation_cursor = $2, updated_at = now() WHERE id = $1`,
      [sagaId, cursor],
    );
  },

  /** Release the lease with a backoff: the sweeper re-claims once it expires. */
  async scheduleCompensationRetry(
    pool: Pool, sagaId: string, attempts: number, error: string, delayMs: number,
  ) {
    await pool.query(
      `UPDATE saga_instances
       SET status = 'compensating', compensation_attempts = $2, last_error = $3,
           lease_expires_at = now() + ($4 * interval '1 millisecond'),
           claimed_by = NULL, updated_at = now()
       WHERE id = $1`,
      [sagaId, attempts, error, delayMs],
    );
  },

  async scheduleForwardRetry(
    pool: Pool, sagaId: string, step: number, context: unknown,
    attempts: number, error: string, delayMs: number,
  ) {
    await pool.query(
      `UPDATE saga_instances
       SET status = 'running', current_step = $2, context = $3::jsonb,
           forward_attempts = $4, last_error = $5,
           lease_expires_at = now() + ($6 * interval '1 millisecond'),
           claimed_by = NULL, updated_at = now()
       WHERE id = $1`,
      [sagaId, step, JSON.stringify(context), attempts, error, delayMs],
    );
  },

  async recordResumeSignal(pool: Pool, bookingId: string) {
    await pool.query(
      `INSERT INTO saga_resume_signals (booking_id) VALUES ($1)
       ON CONFLICT (booking_id) DO UPDATE SET received_at = now(), consumed_at = NULL`,
      [bookingId],
    );
  },

  async consumeResumeSignal(pool: Pool, bookingId: string): Promise<boolean> {
    const r = await pool.query(
      `UPDATE saga_resume_signals SET consumed_at = now()
       WHERE booking_id = $1 AND consumed_at IS NULL RETURNING booking_id`,
      [bookingId],
    );
    return (r.rowCount ?? 0) > 0;
  },

  /** Leases that expired (crash / scheduled retry), plus legacy leaseless compensating rows. */
  async listExpiredLeases(pool: Pool, limit = 50) {
    const r = await pool.query<{ id: string; saga_type: string }>(
      `SELECT id, saga_type FROM saga_instances
       WHERE status IN ('running', 'compensating')
         AND ( (lease_expires_at IS NOT NULL AND lease_expires_at < now())
            OR (status = 'compensating' AND lease_expires_at IS NULL) )
       ORDER BY updated_at ASC LIMIT $1`,
      [limit],
    );
    return r.rows;
  },

  /** Parked awaiting an external event for longer than the timeout. */
  async listStalePaused(pool: Pool, pauseTimeoutMs: number, limit = 50) {
    const r = await pool.query<{ id: string; saga_type: string }>(
      `SELECT id, saga_type FROM saga_instances
       WHERE status = 'running' AND lease_expires_at IS NULL AND forward_attempts = 0
         AND updated_at < now() - ($1 * interval '1 millisecond')
       ORDER BY updated_at ASC LIMIT $2`,
      [pauseTimeoutMs, limit],
    );
    return r.rows;
  },
};
