/* Invoices: guest tax invoices (on-demand) and host payout statements
     (automatic at checkout). Two document types, one table, one row per
     (booking_id, type) so re-requesting an already-generated document
     returns the same one instead of creating a duplicate with a new
     number. Sequential numbering uses native Postgres SEQUENCEs, atomic
     and duplicate-proof under concurrency without hand-rolled locking
     (the same class of bug the booking availability fix addressed).
     Known simplification: these sequences climb forever, they don't
     reset to 1 each January the way some formal per-year numbering
     schemes do, the year in "INV-2026-000142" reflects when it was
     issued, not a per-year counter. Revisit only if a specific
     jurisdiction's invoice rules require strict per-year reset. */

CREATE SEQUENCE IF NOT EXISTS guest_invoice_seq START 1;
   CREATE SEQUENCE IF NOT EXISTS host_statement_seq START 1;

   CREATE TABLE IF NOT EXISTS invoices (
     id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     invoice_number  VARCHAR(50) UNIQUE NOT NULL,
     type            VARCHAR(20) NOT NULL CHECK (type IN ('guest_invoice', 'host_statement')),
     booking_id      UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
     tenant_id       UUID NOT NULL REFERENCES tenants(id)  ON DELETE CASCADE,
     guest_user_id   UUID REFERENCES users(id),
     amount_ngn      NUMERIC(12,2) NOT NULL,
     pdf_url         TEXT,
     created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
     UNIQUE (booking_id, type)
   );
   CREATE INDEX IF NOT EXISTS idx_invoices_booking ON invoices(booking_id);
   CREATE INDEX IF NOT EXISTS idx_invoices_tenant  ON invoices(tenant_id, type);
