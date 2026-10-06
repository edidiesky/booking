/* 059: double-entry ledger */

CREATE TABLE IF NOT EXISTS ledger_accounts (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID REFERENCES tenants(id),
    account_type TEXT NOT NULL CHECK (account_type IN (
        'gateway_clearing',
        'escrow_held',
        'platform_revenue',
        'host_payable',
        'cash_paid_out',
        'refund_payable',
        'chargeback_loss',
        'host_clawback_receivable'
    )),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_ledger_account UNIQUE NULLS NOT DISTINCT (tenant_id, account_type)
);

CREATE TABLE IF NOT EXISTS ledger_transactions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN (
        'payment_received',
        'escrow_release',
        'payout',
        'refund',
        'chargeback',
        'chargeback_recovered_from_host'
    )),
    booking_id       UUID REFERENCES bookings(id),
    payment_id       UUID REFERENCES payments(id),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata         JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS ledger_entries (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ledger_transaction_id UUID NOT NULL REFERENCES ledger_transactions(id),
    account_id            UUID NOT NULL REFERENCES ledger_accounts(id),
    debit_ngn             NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (debit_ngn >= 0),
    credit_ngn            NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (credit_ngn >= 0),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_debit_xor_credit CHECK (
        (debit_ngn > 0 AND credit_ngn = 0) OR (credit_ngn > 0 AND debit_ngn = 0)
    )
);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_transaction
  ON ledger_entries(ledger_transaction_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_account
  ON ledger_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_ledger_transactions_booking
  ON ledger_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_ledger_transactions_payment
  ON ledger_transactions(payment_id)
  WHERE payment_id IS NOT NULL;

CREATE OR REPLACE FUNCTION check_ledger_balance() RETURNS TRIGGER AS $$
DECLARE
    v_diff NUMERIC(14,2);
BEGIN
    SELECT COALESCE(SUM(debit_ngn), 0) - COALESCE(SUM(credit_ngn), 0)
    INTO v_diff
    FROM ledger_entries
    WHERE ledger_transaction_id = NEW.ledger_transaction_id;

    IF v_diff != 0 THEN
        RAISE EXCEPTION
          'Ledger transaction % does not balance: debits - credits = %',
          NEW.ledger_transaction_id, v_diff;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ledger_balance ON ledger_entries;
CREATE CONSTRAINT TRIGGER trg_ledger_balance
    AFTER INSERT ON ledger_entries
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION check_ledger_balance();

INSERT INTO ledger_accounts (tenant_id, account_type)
VALUES
  (NULL, 'gateway_clearing'),
  (NULL, 'platform_revenue'),
  (NULL, 'chargeback_loss')
ON CONFLICT DO NOTHING;