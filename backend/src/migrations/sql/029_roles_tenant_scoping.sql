/* 021 roles.tenant_id — custom, tenant-scoped roles alongside the seeded
     system roles. NULL tenant_id = system role (host:admin etc), visible to
     everyone. Slug uniqueness has to be split into two partial indexes:
     system role slugs stay globally unique, custom role slugs only need to
     be unique within their own tenant, since NULL != NULL in a plain
     UNIQUE(tenant_id, slug) constraint and would let two different tenants
     silently collide on "the same" system-role-shaped slug otherwise. */

ALTER TABLE roles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
   ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_slug_key;
   DROP INDEX IF EXISTS idx_roles_slug;
   CREATE UNIQUE INDEX IF NOT EXISTS uq_roles_system_slug ON roles(slug) WHERE tenant_id IS NULL;
   CREATE UNIQUE INDEX IF NOT EXISTS uq_roles_tenant_slug ON roles(tenant_id, slug) WHERE tenant_id IS NOT NULL;
   CREATE INDEX IF NOT EXISTS idx_roles_tenant ON roles(tenant_id);
