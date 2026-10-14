
CREATE TABLE IF NOT EXISTS bookings (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID NOT NULL,
    room_type_id      UUID NOT NULL,
    guest_user_id     UUID NOT NULL,
    check_in          DATE NOT NULL,
    check_out         DATE NOT NULL,
    rooms_count       INT NOT NULL,
    total_amount_ngn  NUMERIC(14,2) NOT NULL,
    status            TEXT NOT NULL DEFAULT 'pending_payment',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS availability_calendar (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_type_id  UUID NOT NULL,
    date          DATE NOT NULL,
    available     BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (room_type_id, date)
);

CREATE TABLE IF NOT EXISTS booking_locks (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id   UUID NOT NULL REFERENCES bookings(id),
    room_type_id UUID NOT NULL,
    check_in     DATE NOT NULL,
    check_out    DATE NOT NULL,
    expires_at   TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_availability_room_date ON availability_calendar (room_type_id, date);

CREATE TABLE IF NOT EXISTS event_store (
    id             BIGSERIAL PRIMARY KEY,
    aggregate_id   UUID NOT NULL,
    aggregate_type TEXT NOT NULL,
    event_type     TEXT NOT NULL,
    payload        JSONB NOT NULL,
    version        INT NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (aggregate_id, version)
);

CREATE INDEX IF NOT EXISTS idx_event_store_aggregate
  ON event_store (aggregate_id, version);
