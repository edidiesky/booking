/* 018 permissions */

CREATE TABLE IF NOT EXISTS permissions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource    VARCHAR(100)  NOT NULL,
    action      VARCHAR(100)  NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_permissions_resource_action UNIQUE(resource, action)
  );
  CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource, action);
