#!/usr/bin/env bash
# Database alert test helper.
# Run from booking-infra:   ./scripts/test-db-alerts.sh <command>
# Every test has an undo. `cleanup` restores everything.
export MSYS_NO_PATHCONV=1   # stop Git Bash rewriting /paths inside docker commands

PROM="${PROM:-http://localhost:9090}"
PSQL="docker exec -i postgres psql -U postgres -d booking_platform -q"
HOLD="${HOLD:-300}"         # seconds that lock / idle sessions stay open

# "title::PromQL" : same expressions the Grafana rules use
CHECKS=(
  'pg_up (1 = healthy)::pg_up'
  'postgres scrape target (1 = healthy)::up{job="postgres"}'
  'Connections ratio (alert > 0.8)::max(pg_connections_total) / max(pg_connections_max_connections)'
  'Idle-in-txn max age s (alert > 60)::pg_idle_in_transaction_max_age_seconds'
  'Sessions waiting on locks (alert > 0)::pg_blocking_sessions_waiting_count'
  'Deadlocks last 5m (alert > 0)::increase(pg_deadlocks_deadlocks{datname="booking_platform"}[5m])'
  'Dead pct, tables >1000 dead (alert > 20; empty = ok)::max(pg_dead_tuples_dead_pct and on(schemaname, table_name) (pg_dead_tuples_n_dead_tup > 1000))'
  'Secs since autovacuum (alert > 86400; empty = ok)::max(pg_dead_tuples_seconds_since_autovacuum and on(schemaname, table_name) (pg_dead_tuples_n_dead_tup > 1000))'
  'Cache hit ratio (alert < 0.95)::sum(rate(pg_cache_hit_blks_hit{datname="booking_platform"}[10m])) / (sum(rate(pg_cache_hit_blks_hit{datname="booking_platform"}[10m])) + sum(rate(pg_cache_hit_blks_read{datname="booking_platform"}[10m])))'
  'Replica disconnected (1 = NO replica; empty = ok)::absent(pg_replication_lag_lag_bytes)'
  'Replica replay lag s (alert > 30)::max(pg_replication_lag_replay_lag_seconds)'
  'Replica lag bytes (alert > 104857600)::max(pg_replication_lag_lag_bytes)'
  'pgbouncer_up (1 = healthy)::pgbouncer_up'
  'PgBouncer clients waiting (alert > 0)::sum(pgbouncer_pools_client_waiting_connections)'
  'PgBouncer max wait s (alert > 5)::max(pgbouncer_pools_client_maxwait_seconds)'
)

check() {
  for e in "${CHECKS[@]}"; do
    title="${e%%::*}"; expr="${e#*::}"
    out=$(curl -s -G "$PROM/api/v1/query" --data-urlencode "query=$expr") \
      || { echo "Prometheus unreachable at $PROM"; return 1; }
    if ! echo "$out" | grep -q '"status":"success"'; then
      printf 'ERROR      %s\n' "$title"
    elif echo "$out" | grep -q '"result":\[\]'; then
      printf 'NO DATA    %s\n' "$title"
    else
      val=$(echo "$out" | sed -E 's/.*"value":\[[0-9.]+,"([^"]*)"\].*/\1/')
      printf 'value=%-8s %s\n' "$val" "$title"
    fi
  done
}

case "${1:-}" in
  check)
    check ;;

  pg-down)
    docker exec postgres psql -U postgres -c "ALTER ROLE pganalyze NOLOGIN;"
    echo "Exporter cannot log in, so pg_up = 0. 'Postgres down' fires in ~3 min." ;;

  exporter-down)
    docker stop postgres-exporter
    echo "'Postgres exporter not scraped' fires in ~4 min ('Postgres down' may also fire on no-data)." ;;

  idle-txn)
    echo "Holding an open transaction for ${HOLD}s (Ctrl+C to stop early)..."
    ( echo "BEGIN;"; sleep "$HOLD" ) | $PSQL ;;

  lock-wait)
    $PSQL -c "CREATE TABLE IF NOT EXISTS alert_test_lock(id int);"
    ( echo "BEGIN; LOCK TABLE alert_test_lock IN ACCESS EXCLUSIVE MODE;"; sleep "$HOLD" ) | $PSQL &
    sleep 3
    $PSQL -c "SELECT count(*) FROM alert_test_lock;" &
    echo "One session holds a lock, another waits for ${HOLD}s. 'Sessions waiting on locks' fires in ~4 min."
    echo "'Idle in transaction too long' will fire too, because the lock holder sits idle."
    wait ;;

  deadlock)
    $PSQL -c "CREATE TABLE IF NOT EXISTS alert_test_dl(id int primary key, v int); INSERT INTO alert_test_dl VALUES (1,0),(2,0) ON CONFLICT DO NOTHING;"
    $PSQL -c "BEGIN; UPDATE alert_test_dl SET v=v+1 WHERE id=1; SELECT pg_sleep(2); UPDATE alert_test_dl SET v=v+1 WHERE id=2; COMMIT;" &
    $PSQL -c "BEGIN; UPDATE alert_test_dl SET v=v+1 WHERE id=2; SELECT pg_sleep(2); UPDATE alert_test_dl SET v=v+1 WHERE id=1; COMMIT;" &
    wait
    echo "An 'ERROR: deadlock detected' above is expected. 'Deadlocks detected' fires in ~2 min." ;;

  bloat)
    $PSQL -c "DROP TABLE IF EXISTS alert_test_bloat; CREATE TABLE alert_test_bloat(id int, v int) WITH (autovacuum_enabled=false); INSERT INTO alert_test_bloat SELECT g, 0 FROM generate_series(1,5000) g; UPDATE alert_test_bloat SET v=1; UPDATE alert_test_bloat SET v=2;"
    echo "10,000 dead tuples on 5,000 live rows, autovacuum off. 'Dead tuples high' needs 15 min pending, so ~17 min." ;;

  replica-down)
    docker stop postgres-replica
    echo "'Replica disconnected' fires in ~5 min." ;;

  replica-lag)
    docker exec postgres-replica psql -U postgres -c "SELECT pg_wal_replay_pause();" \
      || { echo "Could not pause replay on the replica"; exit 1; }
    $PSQL -c "DROP TABLE IF EXISTS alert_test_wal; CREATE TABLE alert_test_wal AS SELECT g, repeat('x', 200) AS pad FROM generate_series(1,700000) g;"
    echo "Replay paused, ~150MB of WAL generated. 'Replica more than 100MB behind' fires in ~7 min." ;;

  pgbouncer-down)
    docker stop pgbouncer
    echo "The app loses its DB path while this is stopped. 'PgBouncer exporter cannot reach PgBouncer' fires in ~3 min." ;;

  cleanup)
    $PSQL -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE application_name='psql' AND pid <> pg_backend_pid();" >/dev/null
    $PSQL -c "DROP TABLE IF EXISTS alert_test_lock, alert_test_dl, alert_test_bloat, alert_test_wal;"
    docker exec postgres psql -U postgres -c "ALTER ROLE pganalyze LOGIN;"
    docker start postgres-exporter postgres-replica pgbouncer >/dev/null
    sleep 5
    docker exec postgres-replica psql -U postgres -c "SELECT pg_wal_replay_resume();" 2>/dev/null \
      || echo "Replica still starting: re-run cleanup in a minute to resume replay."
    echo "Restored. 'Resolved' messages arrive within a few minutes." ;;

  *)
    echo "Usage: $0 <command>"
    echo "  check           run every alert query against Prometheus and show the value"
    echo "  pg-down         block the exporter's login        -> Postgres down"
    echo "  exporter-down   stop postgres-exporter            -> exporter not scraped"
    echo "  idle-txn        hold an open transaction          -> idle in transaction"
    echo "  lock-wait       hold a lock, queue a query        -> sessions waiting on locks"
    echo "  deadlock        force a deadlock                  -> deadlocks detected"
    echo "  bloat           create dead tuples, autovacuum off-> dead tuples high"
    echo "  replica-down    stop the replica                  -> replica disconnected"
    echo "  replica-lag     pause replay, generate WAL        -> replica >100MB behind"
    echo "  pgbouncer-down  stop PgBouncer                    -> pooler down"
    echo "  cleanup         undo everything above" ;;
esac