/*
  Property and room type CSV import.

  import_batches is the durable record of each import: live progress goes
  over Redis pub/sub, but a client that connects late or reconnects reads
  its snapshot from here, and the report outlives Redis job TTLs.

  No row-level security on import_batches: the API inserts it on a separate,
  immediately committed connection (so the worker never sees a message for a
  row that does not exist yet) and the SSE stream reads it outside a tenant
  transaction (so a long stream does not pin a pooled connection). Every
  query filters by tenant_id explicitly instead.

  external_ref is the seller's own id from the file. The partial unique
  indexes make imports idempotent: re-sending a file or a RabbitMQ
  redelivery inserts nothing twice. Existing rows keep NULL and are unaffected.
*/

CREATE TABLE IF NOT EXISTS import_batches (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by          UUID        NOT NULL REFERENCES users(id),
  status              TEXT        NOT NULL DEFAULT 'queued'
                      CHECK (status IN ('queued','downloading','validating','importing','completed','failed')),
  file_public_id      TEXT        NOT NULL,
  file_name           TEXT,
  progress            SMALLINT    NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  totals              JSONB       NOT NULL DEFAULT '{}'::jsonb,
  errors              JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_properties  JSONB       NOT NULL DEFAULT '[]'::jsonb,
  failure_reason      TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_import_batches_tenant_created
  ON import_batches (tenant_id, created_at DESC);

-- A double-clicked Send, or the same file sent twice while the first run is
-- still going, cannot start a second import of that file.
CREATE UNIQUE INDEX IF NOT EXISTS uq_import_batches_active_file
  ON import_batches (tenant_id, file_public_id)
  WHERE status NOT IN ('completed', 'failed');

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS external_ref    VARCHAR(64),
  ADD COLUMN IF NOT EXISTS import_batch_id UUID REFERENCES import_batches(id) ON DELETE SET NULL;

ALTER TABLE room_types
  ADD COLUMN IF NOT EXISTS external_ref    VARCHAR(64),
  ADD COLUMN IF NOT EXISTS import_batch_id UUID REFERENCES import_batches(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_properties_tenant_external_ref
  ON properties (tenant_id, external_ref)
  WHERE external_ref IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_room_types_property_external_ref
  ON room_types (property_id, external_ref)
  WHERE external_ref IS NOT NULL;