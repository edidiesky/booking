CREATE TABLE IF NOT EXISTS saga_instances (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    saga_type        TEXT NOT NULL,
    status           TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','completed','compensating','compensated','failed')),
    current_step     INT NOT NULL DEFAULT 0,
    context          JSONB NOT NULL DEFAULT '{}',
    booking_id       UUID,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    claimed_by       UUID,
    lease_expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_saga_instances_resumable
  ON saga_instances (status, lease_expires_at)
  WHERE status IN ('running', 'compensating');

CREATE TABLE IF NOT EXISTS saga_resume_signals (
    booking_id   UUID PRIMARY KEY,
    received_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    consumed_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_saga_resume_signals_pending
  ON saga_resume_signals (booking_id)
  WHERE consumed_at IS NULL;
