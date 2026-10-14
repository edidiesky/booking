import { Pool } from "pg";

export type SagaStatus =
  | "running"
  | "completed"
  | "compensating"
  | "compensated"
  | "failed";

export const sagaRepository = {
  async insert(
    pool: Pool,
    sagaType: string,
    context: unknown,
    bookingId?: string,
  ): Promise<string> {
    const result = await pool.query<{ id: string }>(
      `INSERT INTO saga_instances (saga_type, context, booking_id)
       VALUES ($1, $2::jsonb, $3) RETURNING id`,
      [sagaType, JSON.stringify(context), bookingId ?? null],
    );
    return result.rows[0]!.id;
  },

  async claim(pool: Pool, sagaId: string, leaseMs: number) {
    const result = await pool.query<{
      id: string;
      current_step: number;
      context: unknown;
    }>(
      `UPDATE saga_instances
       SET claimed_by = gen_random_uuid(),
           lease_expires_at = now() + ($2 * interval '1 millisecond'),
           updated_at = now()
       WHERE id = $1
         AND status IN ('running', 'compensating')
         AND (lease_expires_at IS NULL OR lease_expires_at < now())
       RETURNING id, current_step, context`,
      [sagaId, leaseMs],
    );
    return result.rows[0] ?? null;
  },

  async findById(pool: Pool, sagaId: string) {
    const result = await pool.query<{
      status: SagaStatus;
      context: unknown;
      current_step: number;
      booking_id: string | null;
    }>(
      `SELECT status, context, current_step, booking_id FROM saga_instances WHERE id = $1`,
      [sagaId],
    );
    return result.rows[0] ?? null;
  },

  async findRunningByBookingId(pool: Pool, bookingId: string) {
    const result = await pool.query<{ id: string }>(
      `SELECT id FROM saga_instances
       WHERE booking_id = $1 AND status = 'running'
       LIMIT 1`,
      [bookingId],
    );
    return result.rows[0] ?? null;
  },

  async updateProgress(
    pool: Pool,
    sagaId: string,
    step: number,
    context: unknown,
  ) {
    const bookingId = extractBookingId(context);
    await pool.query(
      `UPDATE saga_instances
       SET current_step = $1,
           context = $2::jsonb,
           booking_id = COALESCE($4::uuid, booking_id),
           updated_at = now()
       WHERE id = $3`,
      [step, JSON.stringify(context), sagaId, bookingId],
    );
  },

  async updateStatus(pool: Pool, sagaId: string, status: SagaStatus) {
    await pool.query(
      `UPDATE saga_instances
       SET status = $1, updated_at = now(), lease_expires_at = NULL, claimed_by = NULL
       WHERE id = $2`,
      [status, sagaId],
    );
  },

  async markPaused(
    pool: Pool,
    sagaId: string,
    nextStep: number,
    context: unknown,
  ) {
    const bookingId = extractBookingId(context);
    await pool.query(
      `UPDATE saga_instances
       SET status = 'running',
           current_step = $2,
           context = $3::jsonb,
           booking_id = COALESCE($4::uuid, booking_id),
           lease_expires_at = NULL,
           claimed_by = NULL,
           updated_at = now()
       WHERE id = $1`,
      [sagaId, nextStep, JSON.stringify(context), bookingId],
    );
  },

  /** Webhook arrived before pause completed — store signal */
  async recordResumeSignal(pool: Pool, bookingId: string) {
    await pool.query(
      `INSERT INTO saga_resume_signals (booking_id)
       VALUES ($1)
       ON CONFLICT (booking_id) DO UPDATE
         SET received_at = now(), consumed_at = NULL`,
      [bookingId],
    );
  },

  async consumeResumeSignal(pool: Pool, bookingId: string): Promise<boolean> {
    const result = await pool.query(
      `UPDATE saga_resume_signals
       SET consumed_at = now()
       WHERE booking_id = $1 AND consumed_at IS NULL
       RETURNING booking_id`,
      [bookingId],
    );
    return (result.rowCount ?? 0) > 0;
  },

  /** Expired leases still running/compensating — reclaimable */
  async listExpiredLeases(pool: Pool, limit = 50) {
    const result = await pool.query<{ id: string; saga_type: string }>(
      `SELECT id, saga_type FROM saga_instances
       WHERE status IN ('running', 'compensating')
         AND lease_expires_at IS NOT NULL
         AND lease_expires_at < now()
       ORDER BY lease_expires_at ASC
       LIMIT $1`,
      [limit],
    );
    return result.rows;
  },

  /** Paused (no lease) longer than timeout — candidate for expire/compensate */
  async listStalePaused(pool: Pool, pauseTimeoutMs: number, limit = 50) {
    const result = await pool.query<{
      id: string;
      saga_type: string;
      context: unknown;
      current_step: number;
    }>(
      `SELECT id, saga_type, context, current_step FROM saga_instances
       WHERE status = 'running'
         AND lease_expires_at IS NULL
         AND updated_at < now() - ($1 * interval '1 millisecond')
       ORDER BY updated_at ASC
       LIMIT $2`,
      [pauseTimeoutMs, limit],
    );
    return result.rows;
  },
};

function extractBookingId(context: unknown): string | null {
  if (
    context &&
    typeof context === "object" &&
    "bookingId" in context &&
    typeof (context as { bookingId?: unknown }).bookingId === "string"
  ) {
    return (context as { bookingId: string }).bookingId;
  }
  return null;
}
