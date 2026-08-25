# Runbook: migrations fail with "Connection terminated unexpectedly" through PgBouncer

## Symptom

Running a migration script against PgBouncer (`localhost:6432`) fails
partway through with:

```
Error: Connection terminated unexpectedly
    at Connection.<anonymous> (.../pg/lib/client.js:199:73)
```

No useful SQL-level error, the connection simply dies mid-operation.

## Root cause

The migration runner's first statement is
`SELECT pg_advisory_lock($1)`, the **session-scoped** advisory lock
function (not `pg_advisory_xact_lock`, the transaction-scoped variant).
Session-scoped locks require the same physical Postgres backend
connection to stay attached to the client for the entire duration of the
lock.

PgBouncer here runs in `pool_mode = transaction` (`pgbouncer.ini`),
which only guarantees a physical backend connection to a client for the
duration of a single transaction. An autocommit statement like a bare
`SELECT pg_advisory_lock(...)` outside an explicit `BEGIN` can have its
physical connection handed back to the pool immediately after, breaking
the session-level guarantee the lock depends on. The client's mental
model of "my session" and Postgres's actual backend no longer agree,
and the connection can terminate unexpectedly as a result.

## Fix

Do not run DDL, session-scoped advisory locks, or other
session-dependent operations through a transaction-mode PgBouncer
connection. Connect directly to Postgres instead:

```bash
export DATABASE_URL="postgresql://postgres:<pw>@localhost:5432/booking_platform"
npm run migrate
```

(Requires `postgres` to have a published port, see the
`host-to-docker-postgres-connectivity.md` runbook.)

## Verification

```bash
npm run migrate
```

Should complete without a `Connection terminated` error, and yield
either `migrations_up_to_date` or `migrations_complete`.

## Prevention

Treat PgBouncer (in transaction mode) as application-traffic-only.
Anything doing DDL, advisory locks, `LISTEN`/`NOTIFY`, or other
session-scoped Postgres features should connect directly to Postgres,
never through the transaction-mode pooler. Document this split clearly
wherever `DATABASE_URL` is configured for migration tooling vs. the
running application.