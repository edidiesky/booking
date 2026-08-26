/* 048 job_checkpoints */
/* Durable, lease-based checkpoint/resume tracking for long-running,
   chunked worker jobs. Separate from job_repository's Redis-backed
   progress state (job:<type>:<id>), which is ephemeral UI display data
   with a 24h TTL, not a resume mechanism. This table is the durable
   source of truth a crashed worker resumes from. */

CREATE TABLE IF NOT EXISTS job_checkpoints (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type          TEXT         NOT NULL,
    job_id            TEXT         NOT NULL,
    tenant_id         UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    status            TEXT         NOT NULL DEFAULT 'pending'
                                    CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'abandoned')),
    cursor            JSONB        NOT NULL DEFAULT '{}'::jsonb,
    rows_processed    INT          NOT NULL DEFAULT 0,
    rows_failed       INT          NOT NULL DEFAULT 0,
    claimed_by        TEXT,
    claimed_at        TIMESTAMPTZ,
    lease_expires_at  TIMESTAMPTZ,
    attempt_count     INT          NOT NULL DEFAULT 0,
    last_error        TEXT,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),

    UNIQUE (job_type, job_id)
  );

  CREATE INDEX IF NOT EXISTS idx_job_checkpoints_tenant ON job_checkpoints(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_job_checkpoints_status ON job_checkpoints(status)
    WHERE status IN ('pending', 'in_progress');