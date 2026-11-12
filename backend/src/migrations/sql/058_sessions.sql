/*
  1. the session persists for a long time giving us a clear view of the user's history
  2. we can easily retrieve browing hsitory, adn also revoke access
  3. It also uses Redis for fast Read path too. (session-version:<userId>) */

CREATE TABLE IF NOT EXISTS sessions (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    device_label    TEXT          NOT NULL,     
    device_type     TEXT          NOT NULL,      
    os              TEXT,
    browser         TEXT,
    ip_address      INET          NOT NULL,
    city            TEXT,
    country         TEXT,

    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    last_active_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),

    revoked_at      TIMESTAMPTZ,
    revoked_reason  TEXT       
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_active
  ON sessions (user_id, created_at)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_ip ON sessions (ip_address);