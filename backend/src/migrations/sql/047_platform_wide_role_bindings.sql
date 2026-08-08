

ALTER TABLE user_roles ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE user_permissions ALTER COLUMN tenant_id DROP NOT NULL;

ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS uq_user_tenant_role;
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_roles_tenant_scoped ON user_roles(user_id, tenant_id) WHERE tenant_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_roles_platform_wide ON user_roles(user_id)            WHERE tenant_id IS NULL;

ALTER TABLE user_permissions DROP CONSTRAINT IF EXISTS uq_user_permission;
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_permissions_tenant_scoped ON user_permissions(user_id, tenant_id, permission_id) WHERE tenant_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_permissions_platform_wide ON user_permissions(user_id, permission_id)            WHERE tenant_id IS NULL;

-- Backfill: bind every existing platform:admin user to the already-seeded
-- 'platform:admin' role. Requires seedService.seedAll() to have run first,
-- confirm with: SELECT slug FROM roles WHERE slug = 'platform:admin';
DO $$
DECLARE
  v_role_id UUID;
BEGIN
  SELECT id INTO v_role_id FROM roles WHERE slug = 'platform:admin' AND tenant_id IS NULL;
  IF v_role_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, tenant_id, role_id, assigned_by)
    SELECT id, NULL, v_role_id, 'system-migration'
    FROM users WHERE user_type = 'platform:admin';
  END IF;
END $$;