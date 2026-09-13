/* tenant_subdomain */
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS subdomain               TEXT,
  ADD COLUMN IF NOT EXISTS custom_domain           TEXT,
  ADD COLUMN IF NOT EXISTS custom_domain_status    TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS custom_domain_verified_at TIMESTAMPTZ;

ALTER TABLE tenants
  ADD CONSTRAINT chk_tenants_custom_domain_status
    CHECK (custom_domain_status IN ('none','pending','verified','failed'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_subdomain
  ON tenants (subdomain) WHERE subdomain IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_custom_domain
  ON tenants (custom_domain) WHERE custom_domain IS NOT NULL;