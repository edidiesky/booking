-- booking-service owns ONLY: event_store + reserve idempotency.
-- bookings / availability_calendar / booking_locks / escrow_ledger belong to the
-- monolith migrations (backend/src/migrations/sql/008-012) and share this database.
-- Do NOT redefine them here (CREATE TABLE IF NOT EXISTS silently skipped them before,
-- hiding the fact that the shapes differed).

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
CREATE INDEX IF NOT EXISTS idx_event_store_aggregate ON event_store (aggregate_id, version);

-- Idempotent reserve: one booking per Idempotency-Key (the saga sends saga:<id>:reserve).
CREATE TABLE IF NOT EXISTS booking_reserve_idempotency (
    idempotency_key TEXT PRIMARY KEY,
    booking_id      UUID NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
