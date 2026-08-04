/* 008 availability_calendar */

CREATE TABLE IF NOT EXISTS availability_calendar (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_type_id       UUID          NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
    tenant_id          UUID          NOT NULL REFERENCES tenants(id)    ON DELETE CASCADE,
    date               DATE          NOT NULL,
    available_count    INT           NOT NULL,
    price_override_ngn NUMERIC(12,2),
    is_blocked         BOOLEAN       NOT NULL DEFAULT false,
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_availability UNIQUE(room_type_id, date)
  );
  CREATE INDEX IF NOT EXISTS idx_avail_room_date ON availability_calendar(room_type_id, date);
