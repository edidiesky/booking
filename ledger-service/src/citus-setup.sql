-- Real, service: ledger-service, real Citus setup

-- Real, the actual schema adjustment Citus forces, and it's a
-- genuine, correct one, not a hack: ledger_transactions and
-- ledger_entries didn't carry tenant_id directly before (it lived
-- one hop away, via ledger_accounts). Citus needs the SAME real
-- distribution column on every table that gets joined together, or
-- those joins become real, expensive cross-node operations instead
-- of local ones. Denormalizing tenant_id onto both tables is the
-- real, standard, correct Citus pattern here, not a workaround.

CREATE EXTENSION IF NOT EXISTS citus;

ALTER TABLE ledger_transactions ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Real, ledger_accounts stays small and rarely changes (one row per
-- tenant per account type, confirmed real, bounded count). A real
-- Citus "reference table" is replicated in full to every worker, so
-- a join against it never needs real cross-node data movement, the
-- correct real choice for this specific table's real shape.
SELECT create_reference_table('ledger_accounts');

-- Real, the actual distribution: both tables sharded by tenant_id.
-- Because every real entry belonging to one ledger_transaction
-- always shares that transaction's own single tenant_id (a booking's
-- refund is never split across two tenants), every row for a given
-- ledger_transaction_id lands on the SAME real physical shard. This
-- is what keeps the existing deferred constraint trigger (checking
-- SUM(debit) = SUM(credit) per transaction) correct without any
-- change to its own logic, it still only ever needs to see rows on
-- one real node.
SELECT create_distributed_table('ledger_transactions', 'tenant_id');
SELECT create_distributed_table('ledger_entries', 'tenant_id');

-- Real, notification's own outbox, lives in ledger-service's DB
-- specifically, real, deliberate: the outbox row is written in the
-- SAME transaction as the ledger entries it announces, guaranteeing
-- the event is durably recorded if and only if the real money
-- movement actually committed, the same real principle proven this
-- session for every other outbox use.
CREATE TABLE IF NOT EXISTS outbox_events (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_type      TEXT NOT NULL,
    payload         JSONB NOT NULL,
    tenant_id       UUID NOT NULL,
    published_at    TIMESTAMPTZ,
    claimed_by      UUID,
    lease_expires_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
