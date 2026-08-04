/* 006 properties */

CREATE TABLE IF NOT EXISTS properties (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID               NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name           VARCHAR(255)       NOT NULL,
    description    TEXT,
    property_type  property_type_enum NOT NULL,
    address        JSONB              NOT NULL DEFAULT '{}',
    amenities      TEXT[]             NOT NULL DEFAULT '{}',
    images         TEXT[]             NOT NULL DEFAULT '{}',
    check_in_time  TIME               NOT NULL DEFAULT '14:00',
    check_out_time TIME               NOT NULL DEFAULT '11:00',
    status         property_status    NOT NULL DEFAULT 'draft',
    created_at     TIMESTAMPTZ        NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ        NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_properties_tenant ON properties(tenant_id, status);
