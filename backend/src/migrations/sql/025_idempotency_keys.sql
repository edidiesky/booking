/* 023 idempotency keys */

  DO $$ BEGIN
    CREATE TYPE idempotency_status AS ENUM ('processing', 'completed', 'failed');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;

  CREATE TABLE IF NOT EXISTS idempotency_keys (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_hash   VARCHAR(64)         NOT NULL UNIQUE,
    endpoint       VARCHAR(150)        NOT NULL,
    user_id        UUID,
    status         idempotency_status  NOT NULL DEFAULT 'processing',
    status_code    INT,
    response_body  JSONB,
    failure_reason TEXT,
    expires_at     TIMESTAMPTZ         NOT NULL,
    created_at     TIMESTAMPTZ         NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ         NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_idempotency_hash    ON idempotency_keys(request_hash);
  CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON idempotency_keys(expires_at);
  CREATE INDEX IF NOT EXISTS idx_idempotency_status  ON idempotency_keys(status, created_at);
  
