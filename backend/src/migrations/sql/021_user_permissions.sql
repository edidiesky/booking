/* 021 user_permissions - direct per-user overrides (grant OR deny) */

CREATE TABLE IF NOT EXISTS user_permissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID          NOT NULL REFERENCES users(id)       ON DELETE CASCADE,
    tenant_id       UUID          NOT NULL REFERENCES tenants(id)     ON DELETE CASCADE,
    permission_id   UUID          NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted         BOOLEAN       NOT NULL,
    assigned_by     VARCHAR(100)  NOT NULL,
    assigned_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    reason          TEXT,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_permission UNIQUE(user_id, tenant_id, permission_id)
  );
  CREATE INDEX IF NOT EXISTS idx_user_perm_user   ON user_permissions(user_id, tenant_id);
  CREATE INDEX IF NOT EXISTS idx_user_perm_perm   ON user_permissions(permission_id);
