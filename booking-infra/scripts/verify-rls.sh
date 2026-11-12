#!/bin/sh
# Smoke-test role setup through PgBouncer. Exit non-zero on any failure.
# Usage: sh booking-infra/scripts/verify-rls.sh
set -eu
APP_PW=$(docker exec postgres printenv APP_DB_PASSWORD)
WRK_PW=$(docker exec postgres printenv WORKER_DB_PASSWORD)
PG_PW=$(docker exec postgres printenv POSTGRES_PASSWORD)

q() { # password user sql
  docker exec -e PGPASSWORD="$1" postgres psql -h pgbouncer -p 6432 -U "$2" -d booking_platform -At -c "$3" 2>&1
}
fail=0
check() { # name expected actual
  if [ "$3" = "$2" ]; then echo "PASS  $1"; else echo "FAIL  $1 (expected '$2', got '$3')"; fail=1; fi
}

check "booking_app connects via PgBouncer"      "1" "$(q "$APP_PW" booking_app 'select 1')"
check "booking_worker connects via PgBouncer"   "1" "$(q "$WRK_PW" booking_worker 'select 1')"
check "booking_app sees 0 bookings w/o tenant"  "0" "$(q "$APP_PW" booking_app 'select count(*) from bookings')"
check "booking_app cannot UPDATE audit_events"  "ERROR:  permission denied for table audit_events" \
      "$(q "$APP_PW" booking_app 'update audit_events set tenant_id = tenant_id')"
check "role flags (app false/false, worker false/true)"        "booking_app|false|false
booking_worker|false|true" \
      "$(q "$PG_PW" postgres "select rolname||'|'||rolsuper||'|'||rolbypassrls from pg_roles where rolname in ('booking_app','booking_worker') order by rolname")"
exit $fail
