# Runbook: app keeps failing to authenticate to Postgres after a volume reset, even though the password is correct

## Symptom

After running `docker volume rm <postgres_data volume>` and recreating
the `postgres` container (fresh `initdb`), an already-running app
container keeps logging:

```
{"error":"server login has been failing, cached error: password authentication failed for user \"postgres\" (server_login_retry)"}
```

even though `.env.production`'s `POSTGRES_PASSWORD` was never changed
and matches what the fresh `initdb` used.

## Root cause

The app container was started **before** the Postgres volume reset and
never itself restarted. Its connection pool (and/or PgBouncer sitting in
front of it, see the separate userlist.txt runbook) is still holding
credentials or cached connection state from before the reset. A fresh
`initdb` generates a new SCRAM verifier for the role even when the
plaintext password string is unchanged, anything that cached the old
verifier or an open session against the old cluster is now talking to a
cluster that no longer recognizes it.

## Fix

Restart the dependent container(s) so they reconnect fresh:

```bash
docker compose --env-file booking-infra/.env.production \
  -f booking-infra/docker-compose.dev.yml restart booking
```

If multiple services could be holding stale state (PgBouncer, workers,
the app), a full stack restart is more reliable than restarting them
one at a time:

```bash
docker compose --env-file booking-infra/.env.production \
  -f booking-infra/docker-compose.dev.yml \
  -f booking-infra/docker-compose.monitoring.yml \
  -f booking-infra/docker-compose.workers.yml \
  down          # no -v flag: preserves volumes

docker compose --env-file booking-infra/.env.production \
  -f booking-infra/docker-compose.dev.yml \
  -f booking-infra/docker-compose.monitoring.yml \
  -f booking-infra/docker-compose.workers.yml \
  up -d
```

## Verification

```bash
curl http://localhost:4000/health
```

Should show `"postgres": true`. Also check `docker logs <container>`
for `pg_connected` rather than `pg_connection_attempt_failed`.

## Prevention

Any time the Postgres data volume is reset or the cluster is
reinitialized mid-session, restart every other container that holds a
Postgres connection (app, workers, PgBouncer) as part of the same
operation, not as an afterthought once errors appear.