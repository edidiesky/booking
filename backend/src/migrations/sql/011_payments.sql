/* 011 payments */

CREATE TABLE IF NOT EXISTS payments (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id              UUID           NOT NULL REFERENCES bookings(id),
    tenant_id               UUID           NOT NULL REFERENCES tenants(id),
    guest_user_id           UUID           NOT NULL REFERENCES users(id),
    gateway                 payment_gateway NOT NULL,
    transaction_id          VARCHAR(150)   UNIQUE,
    amount_ngn              NUMERIC(12,2)  NOT NULL,
    status                  payment_status NOT NULL DEFAULT 'pending',
    channel                 VARCHAR(50),
    paid_at                 TIMESTAMPTZ,
    refunded_at             TIMESTAMPTZ,
    idempotency_key         VARCHAR(128)   NOT NULL UNIQUE,
    metadata                JSONB          NOT NULL DEFAULT '{}',
    created_at              TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ    NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_payments_booking     ON payments(booking_id);
  CREATE INDEX IF NOT EXISTS idx_payments_transaction ON payments(transaction_id);
  CREATE INDEX IF NOT EXISTS idx_payments_idempotency ON payments(idempotency_key);
  CREATE INDEX IF NOT EXISTS idx_payments_status      ON payments(status, created_at DESC);
