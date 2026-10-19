CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS ledger_accounts (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID,
    account_type TEXT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_accounts_tenant_type
  ON ledger_accounts (tenant_id, account_type);

CREATE TABLE IF NOT EXISTS ledger_transactions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID NOT NULL,
    transaction_type TEXT NOT NULL,
    metadata         JSONB NOT NULL DEFAULT '{}',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ledger_entries (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ledger_transaction_id UUID NOT NULL,
    tenant_id             UUID NOT NULL,
    account_id            UUID NOT NULL,
    debit_ngn             NUMERIC(14,2) NOT NULL DEFAULT 0,
    credit_ngn            NUMERIC(14,2) NOT NULL DEFAULT 0,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
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

-- Once-per-booking escrow release (and payment_received) under concurrency
CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_tx_type_booking
  ON ledger_transactions (tenant_id, transaction_type, (metadata->>'bookingId'))
  WHERE metadata ? 'bookingId';
