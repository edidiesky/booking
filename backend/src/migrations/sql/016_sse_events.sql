/* 016 sse_connections outbox */

CREATE TABLE IF NOT EXISTS sse_events (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID         NOT NULL,
    tenant_id  UUID         REFERENCES tenants(id),
    event_type VARCHAR(100) NOT NULL,
    payload    JSONB        NOT NULL,
    delivered  BOOLEAN      NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_sse_user    ON sse_events(user_id, delivered, created_at);
  CREATE INDEX IF NOT EXISTS idx_sse_created ON sse_events(created_at);
