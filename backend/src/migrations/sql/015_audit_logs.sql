/* 015 audit_logs */

CREATE TABLE IF NOT EXISTS audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID,
    user_id     UUID,
    action      audit_action  NOT NULL,
    resource    VARCHAR(100)  NOT NULL,
    resource_id VARCHAR(200),
    old_value   JSONB,
    new_value   JSONB,
    ip_address  VARCHAR(45),
    user_agent  VARCHAR(500),
    request_id  VARCHAR(100),
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_audit_tenant   ON audit_logs(tenant_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_audit_user     ON audit_logs(user_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource, resource_id);
  CREATE INDEX IF NOT EXISTS idx_audit_action   ON audit_logs(action, created_at DESC);
