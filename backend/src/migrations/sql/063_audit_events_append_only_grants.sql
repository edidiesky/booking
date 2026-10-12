/* 063: audit_events is append-only (048). Default privileges grant
   UPDATE/DELETE on every new table to the runtime roles, so strip them here.
   Guarded because the roles do not exist in environments that never ran
   bootstrap-roles.sh (e.g. Testcontainers). bootstrap-roles.sh repeats the
   revoke on each run, since its blanket GRANT re-adds the privileges. */

DO $$
DECLARE r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['booking_app', 'booking_worker'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('REVOKE UPDATE, DELETE ON public.audit_events FROM %I', r);
    END IF;
  END LOOP;
END $$;