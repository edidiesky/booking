ALTER TABLE outbox_events
  ADD COLUMN IF NOT EXISTS claimed_by       UUID,
  ADD COLUMN IF NOT EXISTS lease_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_outbox_lease ON outbox_events(status, lease_expires_at);