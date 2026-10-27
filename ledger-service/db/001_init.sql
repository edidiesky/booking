DO $$
BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS uq_ledger_tx_booking_once
    ON ledger_transactions (booking_id, transaction_type)
    WHERE booking_id IS NOT NULL
      AND transaction_type IN ('payment_received', 'escrow_release');
EXCEPTION WHEN unique_violation THEN
  RAISE WARNING 'uq_ledger_tx_booking_once NOT created: duplicate payment_received/escrow_release rows already exist - clean them up, the service still de-duplicates in code';
END $$;
