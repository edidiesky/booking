-- Orchestration-service schema (owned entirely by this service).
-- Idempotent: safe to run on every boot.

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

-- Additive columns (added after first release; ADD COLUMN IF NOT EXISTS keeps old volumes working)
ALTER TABLE saga_instances
  ADD COLUMN IF NOT EXISTS idempotency_key       TEXT,
  ADD COLUMN IF NOT EXISTS last_error           TEXT,
  ADD COLUMN IF NOT EXISTS compensation_cursor  INT,
  ADD COLUMN IF NOT EXISTS compensation_attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS forward_attempts     INT NOT NULL DEFAULT 0;

-- Start-request idempotency: one saga per key.
CREATE UNIQUE INDEX IF NOT EXISTS uq_saga_instances_idempotency
  ON saga_instances (saga_type, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- At most ONE active saga per booking (double-click / client retry / two tabs can never
-- start two payment flows for the same booking). Finished sagas don't block a new attempt.
CREATE UNIQUE INDEX IF NOT EXISTS uq_saga_instances_active_booking
  ON saga_instances (saga_type, booking_id)
  WHERE booking_id IS NOT NULL AND status IN ('running', 'compensating');

-- Lookup by booking (webhook resume path) - most recent first.
CREATE INDEX IF NOT EXISTS idx_saga_instances_booking
  ON saga_instances (booking_id, created_at DESC)
  WHERE booking_id IS NOT NULL;

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
