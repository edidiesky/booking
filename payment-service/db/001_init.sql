CREATE TABLE IF NOT EXISTS payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id      UUID NOT NULL,
    tenant_id       UUID NOT NULL,
    amount_ngn      NUMERIC(14,2) NOT NULL,
    gateway         TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending',
    transaction_id  TEXT,
    redirect_url    TEXT,
    paid_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_booking_gateway_pending
  ON payments (booking_id, gateway)
  WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS idempotency_keys (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_hash     TEXT NOT NULL UNIQUE,
    endpoint         TEXT NOT NULL,
    user_id          TEXT,
    status           TEXT NOT NULL DEFAULT 'processing'
                     CHECK (status IN ('processing', 'completed', 'failed')),
    response_body    JSONB,
    failure_reason   TEXT,
    lease_expires_at TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS outbox_events (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_type       TEXT NOT NULL,
    payload          JSONB NOT NULL,
    tenant_id        UUID NOT NULL,
    published_at     TIMESTAMPTZ,
    claimed_by       UUID,
    lease_expires_at TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
