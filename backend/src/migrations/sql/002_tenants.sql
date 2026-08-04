
CREATE TABLE IF NOT EXISTS tenants (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                VARCHAR(100)  NOT NULL UNIQUE,
    name                VARCHAR(255)  NOT NULL,
    owner_user_id       UUID          NOT NULL,
    platform_fee_pct    NUMERIC(5,2)  NOT NULL DEFAULT 10.00,
    cancellation_policy JSONB         NOT NULL DEFAULT '[]',
    status              tenant_status NOT NULL DEFAULT 'draft',
    settings            JSONB         NOT NULL DEFAULT '{"timezone":"Africa/Lagos","currency":"NGN","locale":"en-NG"}',
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_tenants_slug   ON tenants(slug);
  CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
