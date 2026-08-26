/* 048 rate_limit_rules */

CREATE TABLE IF NOT EXISTS rate_limit_rules (
    id           UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    id_type      TEXT           NOT NULL CHECK (id_type IN ('ip', 'user_id', 'api_key')),
    id_value     TEXT           NOT NULL,
    resource     TEXT           NOT NULL,
    algorithm    TEXT           NOT NULL CHECK (algorithm IN ('token-bucket', 'sliding-window-log')),
    max_request  INT            NOT NULL CHECK (max_request > 0),
    interval_ms  INT            NOT NULL CHECK (interval_ms > 0),
    enabled      BOOLEAN        NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ    NOT NULL DEFAULT now(),

    CONSTRAINT uq_rate_limit_rules_identity UNIQUE (id_type, id_value, resource)
  );

  CREATE INDEX IF NOT EXISTS idx_rate_limit_rules_enabled ON rate_limit_rules(enabled, created_at);