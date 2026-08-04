/* 012 escrow_ledger */

CREATE TABLE IF NOT EXISTS escrow_ledger (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id       UUID          NOT NULL UNIQUE REFERENCES bookings(id),
    tenant_id        UUID          NOT NULL REFERENCES tenants(id),
    amount_ngn       NUMERIC(12,2) NOT NULL,
    platform_fee_ngn NUMERIC(12,2) NOT NULL,
    host_payout_ngn  NUMERIC(12,2) NOT NULL,
    status           escrow_status NOT NULL DEFAULT 'held',
    held_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    released_at      TIMESTAMPTZ,
    refunded_at      TIMESTAMPTZ,
    refund_amount_ngn NUMERIC(12,2),
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_escrow_tenant  ON escrow_ledger(tenant_id, status);
  CREATE INDEX IF NOT EXISTS idx_escrow_booking ON escrow_ledger(booking_id);
