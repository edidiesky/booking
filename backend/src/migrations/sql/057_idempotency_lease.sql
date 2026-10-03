ALTER TABLE idempotency_keys
  ADD COLUMN IF NOT EXISTS claimed_by       UUID,
  ADD COLUMN IF NOT EXISTS lease_expires_at TIMESTAMPTZ;

UPDATE idempotency_keys
SET lease_expires_at = updated_at + interval '2 minutes'
WHERE status = 'processing' AND lease_expires_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_idempotency_lease ON idempotency_keys(status, lease_expires_at);