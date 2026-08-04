/* 014 webhook_logs */

CREATE TABLE IF NOT EXISTS webhook_logs (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gateway        payment_gateway    NOT NULL,
    transaction_id VARCHAR(150)       NOT NULL,
    raw_payload    JSONB              NOT NULL,
    failure_reason TEXT,
    retry_count    INT                NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMPTZ       NOT NULL DEFAULT now(),
    next_retry_at  TIMESTAMPTZ,
    status         webhook_log_status NOT NULL DEFAULT 'pending',
    created_at     TIMESTAMPTZ        NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ        NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_webhook_transaction ON webhook_logs(transaction_id);
  CREATE INDEX IF NOT EXISTS idx_webhook_status      ON webhook_logs(status, next_retry_at);
  CREATE INDEX IF NOT EXISTS idx_webhook_gateway     ON webhook_logs(gateway, created_at DESC);
