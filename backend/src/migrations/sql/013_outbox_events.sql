/* 013 outbox */

CREATE TABLE IF NOT EXISTS outbox_events (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type   VARCHAR(100)  NOT NULL,
    payload      JSONB         NOT NULL,
    status       outbox_status NOT NULL DEFAULT 'pending',
    retry_count  INT           NOT NULL DEFAULT 0,
    last_error   TEXT,
    processed_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_outbox_status  ON outbox_events(status, created_at);
  CREATE INDEX IF NOT EXISTS idx_outbox_retry   ON outbox_events(status, retry_count);
