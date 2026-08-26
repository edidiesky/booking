import { PoolClient } from "pg";
import { query, queryOne } from "../../config/database";

export type CheckpointStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "failed"
  | "abandoned";

export interface JobCheckpoint<TCursor = Record<string, unknown>> {
  id: string;
  job_type: string;
  job_id: string;
  tenant_id: string;
  status: CheckpointStatus;
  cursor: TCursor;
  rows_processed: number;
  rows_failed: number;
  claimed_by: string | null;
  claimed_at: Date | null;
  lease_expires_at: Date | null;
  attempt_count: number;
  last_error: string | null;
  created_at: Date;
  updated_at: Date;
}

const DEFAULT_LEASE_SECONDS = 120;

export const checkpointRepository = {
  /**
   * Idempotent: creates the checkpoint row if it doesn't exist yet.
   * Call once when a job is first enqueued, before any worker attempts
   * to claim it. Safe to call again on retry, does nothing if the row
   * already exists.
   */
  async ensureExists(
    jobType: string,
    jobId: string,
    tenantId: string,
    client?: PoolClient,
  ): Promise<void> {
    const sql = `
      INSERT INTO job_checkpoints (job_type, job_id, tenant_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (job_type, job_id) DO NOTHING`;
    const params = [jobType, jobId, tenantId];
    if (client) {
      await client.query(sql, params);
    } else {
      await query(sql, params);
    }
  },

  /**
   * Atomic claim. Succeeds if the job is unclaimed (pending) or its
   * previous claim's lease has expired (abandoned by a crashed worker).
   * Returns null if another worker currently holds a live claim, the
   * caller should back off (nack/requeue), not retry immediately in a
   * tight loop.
   */
  async claim(
    jobType: string,
    jobId: string,
    workerInstanceId: string,
    leaseSeconds: number = DEFAULT_LEASE_SECONDS,
  ): Promise<JobCheckpoint | null> {
    const sql = `
      UPDATE job_checkpoints
      SET status = 'in_progress',
          claimed_by = $3,
          claimed_at = now(),
          lease_expires_at = now() + ($4 || ' seconds')::interval,
          attempt_count = attempt_count + 1,
          updated_at = now()
      WHERE job_type = $1 AND job_id = $2
        AND (
          status = 'pending'
          OR (status = 'in_progress' AND lease_expires_at < now())
        )
      RETURNING *`;
    return queryOne<JobCheckpoint>(sql, [
      jobType,
      jobId,
      workerInstanceId,
      String(leaseSeconds),
    ]);
  },

  /**
   * Renew the lease on a long-running chunk without changing the
   * cursor. Call periodically during a single chunk's processing if a
   * chunk can plausibly take longer than the lease duration, prevents
   * another worker from stealing a claim that's still genuinely active.
   */
  async renewLease(
    jobType: string,
    jobId: string,
    workerInstanceId: string,
    leaseSeconds: number = DEFAULT_LEASE_SECONDS,
  ): Promise<void> {
    await query(
      `UPDATE job_checkpoints
       SET lease_expires_at = now() + ($4 || ' seconds')::interval,
           updated_at = now()
       WHERE job_type = $1 AND job_id = $2 AND claimed_by = $3
         AND status = 'in_progress'`,
      [jobType, jobId, workerInstanceId, String(leaseSeconds)],
    );
  },

  /**
   * Advance the durable cursor after a chunk successfully commits.
   * Only succeeds if the caller still holds the claim (claimed_by
   * match), guards against a stale/expired-lease worker writing a
   * cursor after another worker has already reclaimed the job.
   */
  async advance(
    jobType: string,
    jobId: string,
    workerInstanceId: string,
    cursor: Record<string, unknown>,
    rowsProcessedIncrement: number,
    rowsFailedIncrement = 0,
  ): Promise<JobCheckpoint | null> {
    return queryOne<JobCheckpoint>(
      `UPDATE job_checkpoints
       SET cursor = $4::jsonb,
           rows_processed = rows_processed + $5,
           rows_failed = rows_failed + $6,
           updated_at = now()
       WHERE job_type = $1 AND job_id = $2 AND claimed_by = $3
         AND status = 'in_progress'
       RETURNING *`,
      [
        jobType,
        jobId,
        workerInstanceId,
        JSON.stringify(cursor),
        rowsProcessedIncrement,
        rowsFailedIncrement,
      ],
    );
  },

  async complete(
    jobType: string,
    jobId: string,
    workerInstanceId: string,
  ): Promise<void> {
    await query(
      `UPDATE job_checkpoints
       SET status = 'completed', updated_at = now()
       WHERE job_type = $1 AND job_id = $2 AND claimed_by = $3`,
      [jobType, jobId, workerInstanceId],
    );
  },

  async fail(
    jobType: string,
    jobId: string,
    workerInstanceId: string,
    errorMessage: string,
  ): Promise<void> {
    await query(
      `UPDATE job_checkpoints
       SET status = 'failed', last_error = $4, updated_at = now()
       WHERE job_type = $1 AND job_id = $2 AND claimed_by = $3`,
      [jobType, jobId, workerInstanceId, errorMessage.slice(0, 2000)],
    );
  },

  async getByJob(
    jobType: string,
    jobId: string,
  ): Promise<JobCheckpoint | null> {
    return queryOne<JobCheckpoint>(
      `SELECT * FROM job_checkpoints WHERE job_type = $1 AND job_id = $2`,
      [jobType, jobId],
    );
  },
};