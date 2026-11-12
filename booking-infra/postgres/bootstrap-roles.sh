#!/bin/sh
# Idempotent role provisioning. Runs as the one-shot `db-roles` service on every
# `up`, so existing volumes and fresh ones converge to the same state.
set -eu

: "${POSTGRES_USER:?}" "${POSTGRES_DB:?}" "${POSTGRES_PASSWORD:?}"
: "${PGBOUNCER_AUTH_PASSWORD:?}" "${APP_DB_PASSWORD:?}" "${WORKER_DB_PASSWORD:?}"

export PGHOST=postgres PGPASSWORD="$POSTGRES_PASSWORD"

psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -v pgb_pass="$PGBOUNCER_AUTH_PASSWORD" \
  -v app_pass="$APP_DB_PASSWORD" \
  -v worker_pass="$WORKER_DB_PASSWORD" <<'SQL'

SELECT format('CREATE ROLE %I LOGIN', r)
FROM (VALUES ('pgbouncer'), ('booking_app'), ('booking_worker')) v(r)
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) \gexec

ALTER ROLE pgbouncer      LOGIN NOSUPERUSER NOBYPASSRLS PASSWORD :'pgb_pass';
ALTER ROLE booking_app    LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS CONNECTION LIMIT 100 PASSWORD :'app_pass';
ALTER ROLE booking_worker LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE BYPASSRLS   CONNECTION LIMIT 30  PASSWORD :'worker_pass';

GRANT CONNECT ON DATABASE :"DBNAME" TO booking_app, booking_worker;

GRANT USAGE ON SCHEMA public TO booking_app, booking_worker;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO booking_app, booking_worker;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO booking_app, booking_worker;

ALTER DEFAULT PRIVILEGES FOR ROLE :"USER" IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO booking_app, booking_worker;
ALTER DEFAULT PRIVILEGES FOR ROLE :"USER" IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO booking_app, booking_worker;

-- app schema (assign_user_role, etc.)
CREATE SCHEMA IF NOT EXISTS app;
GRANT USAGE ON SCHEMA app TO booking_app, booking_worker;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app TO booking_app, booking_worker;
ALTER DEFAULT PRIVILEGES FOR ROLE :"USER" IN SCHEMA app
  GRANT EXECUTE ON FUNCTIONS TO booking_app, booking_worker;


-- Tables created by later migrations (which run as the owner role)
ALTER DEFAULT PRIVILEGES FOR ROLE :"USER" IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO booking_app, booking_worker;
ALTER DEFAULT PRIVILEGES FOR ROLE :"USER" IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO booking_app, booking_worker;

-- audit_events is append-only (migration 048). The blanket grant above gives
-- UPDATE/DELETE back, so strip it again on every run, after the grants.
SELECT format('REVOKE UPDATE, DELETE ON audit_events FROM booking_app, booking_worker')
WHERE to_regclass('public.audit_events') IS NOT NULL \gexec

-- PgBouncer auth_query lookup
CREATE OR REPLACE FUNCTION public.pgbouncer_lookup(p_username text)
RETURNS TABLE (username text, password text)
LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog AS $$
  SELECT rolname::text, rolpassword::text FROM pg_authid
  WHERE rolname = p_username AND rolcanlogin
$$;
REVOKE ALL ON FUNCTION public.pgbouncer_lookup(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pgbouncer_lookup(text) TO pgbouncer;
SQL

echo "roles bootstrapped"
