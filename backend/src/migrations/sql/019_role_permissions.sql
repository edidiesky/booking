/* 019 role_permissions - M:N between roles and permissions */

CREATE TABLE IF NOT EXISTS role_permissions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id       UUID NOT NULL REFERENCES roles(id)       ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_role_permission UNIQUE(role_id, permission_id)
  );
  CREATE INDEX IF NOT EXISTS idx_rp_role       ON role_permissions(role_id);
  CREATE INDEX IF NOT EXISTS idx_rp_permission ON role_permissions(permission_id);
