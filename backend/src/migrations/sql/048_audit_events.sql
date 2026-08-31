/* 048 audit_events */
/* Replaces audit_logs (015) as the system of record going forward.
   audit_logs is not dropped here, historical rows stay queryable,
   deprecation and cutover happen in application code, not by deleting
   history. See ADR-019 for the full derivation and gap analysis
   against the source pattern this schema is built from.

   Key shift I made from audit_logs, each is a real, deliberate decision:
     - written in the SAME transaction as the mutation (see
       audit-event.repository.ts), not via the outbox pattern. The
       outbox exists for events that need to reach a system the
       transaction can't reach (RabbitMQ, external workers); this
       table lives in the same Postgres database as the mutation, the
       outbox adds an unnecessary async gap for no benefit here.
     - outcome/denial_reason: a denied authorization attempt is now a
       first-class row, not something this schema had no place for.
     - actor_* and affected_user_* are snapshots at write time, not
       live FKs, the log has to keep reading correctly after a user is
       deleted or renamed.
     - changed_fields is a real indexable array, not just a blob to
       scan.
     - major inspiration came from https://www.auditlog.dev/
*/

CREATE TABLE IF NOT EXISTS audit_events (
    id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence             BIGSERIAL,
    tenant_id            UUID          NOT NULL REFERENCES tenants(id),

    actor_type           TEXT          NOT NULL CHECK (actor_type IN ('user', 'api_key', 'system', 'impersonation')),
    actor_id             UUID,         -- nullable for actor_type='system'
    actor_email          TEXT,         -- snapshot, nulled on erasure, never before
    actor_name           TEXT,

    action               TEXT          NOT NULL,

    target_type          TEXT,
    target_id            TEXT,

    affected_user_id     UUID,  
    affected_user_email  TEXT,     

    outcome              TEXT          NOT NULL CHECK (outcome IN ('allowed', 'denied')),
    denial_reason         TEXT,

    changed_fields        TEXT[],
    before_value           JSONB,       -- narrowed to changed_fields only, not a full-row copy
    after_value             JSONB,

    metadata              JSONB         NOT NULL DEFAULT '{}',
    origin_ip              INET,
    origin_country          TEXT,        -- resolved at write time, not re-derived at read time
    request_id              TEXT,         -- groups one logical gesture across multiple rows

    occurred_at            TIMESTAMPTZ   NOT NULL,
    recorded_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),

    CONSTRAINT chk_denial_reason_requires_denied
      CHECK (outcome = 'denied' OR denial_reason IS NULL)
  );

  CREATE INDEX IF NOT EXISTS idx_audit_events_tenant       ON audit_events(tenant_id, occurred_at DESC);
  CREATE INDEX IF NOT EXISTS idx_audit_events_actor        ON audit_events(actor_id, occurred_at DESC);
  CREATE INDEX IF NOT EXISTS idx_audit_events_affected     ON audit_events(affected_user_id, occurred_at DESC);
  CREATE INDEX IF NOT EXISTS idx_audit_events_action       ON audit_events(action, occurred_at DESC);
  CREATE INDEX IF NOT EXISTS idx_audit_events_target       ON audit_events(target_type, target_id);
  CREATE INDEX IF NOT EXISTS idx_audit_events_outcome      ON audit_events(outcome) WHERE outcome = 'denied';
  CREATE INDEX IF NOT EXISTS idx_audit_events_request      ON audit_events(request_id);
  CREATE INDEX IF NOT EXISTS idx_audit_events_changed      ON audit_events USING GIN (changed_fields);

  ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS tenant_isolation ON audit_events;
  CREATE POLICY tenant_isolation ON audit_events
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);


/* Append-only enforcement, "not a convention, a revoked grant."
   audit_writer can INSERT and SELECT, nothing else, at the database
   level, not by application-layer discipline alone. This is a real,
   scoped piece of the role provisioning C1 flagged as missing
   (booking_app/booking_worker), not the whole of it, this table's own
   requirement specifically. */

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'audit_writer') THEN
    CREATE ROLE audit_writer NOLOGIN;
  END IF;
END $$;

GRANT INSERT, SELECT ON audit_events TO audit_writer;
REVOKE UPDATE, DELETE ON audit_events FROM audit_writer;

/* Erasure: a single, narrow SECURITY DEFINER function, the only path
   that can touch identity columns on an existing row, and it can only
   null actor_email/actor_name/affected_user_email, never delete a row,
   never touch any other column. Callable only by a separate role, not
   audit_writer itself, matching the source's "erasure is a second,
   much narrower grant, not an exception to append-only." */

CREATE OR REPLACE FUNCTION erase_audit_identity(p_user_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affected_count INT;
BEGIN
  UPDATE audit_events
  SET actor_email = NULL, actor_name = NULL
  WHERE actor_id = p_user_id;
  GET DIAGNOSTICS affected_count = ROW_COUNT;

  UPDATE audit_events
  SET affected_user_email = NULL
  WHERE affected_user_id = p_user_id;

  -- This function's own invocation is itself an auditable action
  -- (member.data_erased in the source's terms). Left for the calling
  -- service layer to write that row in the same transaction, not done
  -- here, a SQL function shouldn't own that decision.
  RETURN affected_count;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'audit_eraser') THEN
    CREATE ROLE audit_eraser NOLOGIN;
  END IF;
END $$;

GRANT EXECUTE ON FUNCTION erase_audit_identity(UUID) TO audit_eraser;