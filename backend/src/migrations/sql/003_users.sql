/* 003 users */

CREATE TABLE IF NOT EXISTS users (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email             VARCHAR(255)     NOT NULL UNIQUE,
    phone             VARCHAR(30),
    password_hash     VARCHAR(255)     NOT NULL,
    first_name        VARCHAR(100),
    last_name         VARCHAR(100),
    profile_image     VARCHAR(500),
    user_type         user_type_enum   NOT NULL,
    tenant_id         UUID             REFERENCES tenants(id) ON DELETE SET NULL,
    status            user_status_enum NOT NULL DEFAULT 'draft',
    is_email_verified BOOLEAN          NOT NULL DEFAULT false,
    last_active_at    TIMESTAMPTZ,
    created_at        TIMESTAMPTZ      NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ      NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_users_email  ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id, status);
