
CREATE INDEX IF NOT EXISTS idx_payments_tenant_created
  ON payments (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_tenant_created
  ON bookings (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_escrow_tenant_created
  ON escrow_ledger (tenant_id, created_at DESC);

  