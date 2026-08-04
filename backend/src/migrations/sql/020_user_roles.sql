/* 020 user_roles - which role a user holds in a tenant */

CREATE TABLE IF NOT EXISTS user_roles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID          NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    tenant_id       UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role_id         UUID          NOT NULL REFERENCES roles(id)   ON DELETE RESTRICT,
    assigned_by     VARCHAR(100)  NOT NULL,
    assigned_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    reason          TEXT,
    is_active       BOOLEAN       NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_tenant_role UNIQUE(user_id, tenant_id)
  );
  CREATE INDEX IF NOT EXISTS idx_user_roles_user        ON user_roles(user_id, is_active);
  CREATE INDEX IF NOT EXISTS idx_user_roles_tenant      ON user_roles(tenant_id, is_active);
  CREATE INDEX IF NOT EXISTS idx_user_roles_role        ON user_roles(role_id);
