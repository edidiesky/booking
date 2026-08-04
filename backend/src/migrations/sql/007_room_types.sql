/* 007 room_types */

CREATE TABLE IF NOT EXISTS room_types (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id    UUID         NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    tenant_id      UUID         NOT NULL REFERENCES tenants(id)    ON DELETE CASCADE,
    name           VARCHAR(255) NOT NULL,
    description    TEXT,
    max_occupancy  INT          NOT NULL DEFAULT 2,
    base_price_ngn NUMERIC(12,2) NOT NULL,
    images         TEXT[]       NOT NULL DEFAULT '{}',
    amenities      TEXT[]       NOT NULL DEFAULT '{}',
    quantity       INT          NOT NULL DEFAULT 1,
    status         room_status  NOT NULL DEFAULT 'active',
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_room_types_property ON room_types(property_id, status);
  CREATE INDEX IF NOT EXISTS idx_room_types_tenant   ON room_types(tenant_id);
