# Runbook: PgBouncer rejects a password that Postgres itself accepts

## Symptom

Direct connection to Postgres works fine:

```bash
docker exec -it postgres psql -U postgres -d booking_platform -c "SELECT 1;"
# works
```

But the same credentials fail through PgBouncer:

```bash
psql "postgresql://postgres:<pw>@localhost:6432/booking_platform" -c "SELECT 1;"
# password authentication failed for user "postgres"
```

And any app connecting only through PgBouncer sees a persistent,
retrying auth failure even though the password is confirmed correct
against Postgres directly.

## Root cause

`pgbouncer.ini` has `auth_type = scram-sha-256` with
`auth_file = /etc/pgbouncer/userlist.txt`. That file stores a
**pre-computed SCRAM verifier**, a static snapshot taken once, not the
plaintext password and not something PgBouncer derives at runtime.

Whenever the Postgres `postgres` role gets a new password, whether via
an explicit `ALTER ROLE ... PASSWORD`, a fresh `initdb`, or a restore,
Postgres generates a brand new SCRAM verifier internally. `userlist.txt`
does not update automatically. From that point on, PgBouncer is
authenticating client connections against a hash that no longer matches
the real role, while direct connections to Postgres (which check the
live verifier) continue to work fine, this asymmetry is the tell.

## Fix

Pull the current, real verifier directly from Postgres, don't
hand-generate one:

```bash
docker exec -it postgres psql -U postgres -d booking_platform -c \
  "SELECT rolpassword FROM pg_authid WHERE rolname='postgres';"
```

Write that exact string into `userlist.txt`:

```bash
echo '"postgres" "<REAL_HASH_FROM_ABOVE>"' > booking-infra/pgbouncer/userlist.txt
cat booking-infra/pgbouncer/userlist.txt   # confirm it wrote correctly, watch for shell $-mangling
```

Restart PgBouncer so it reloads the file:

```bash
docker compose --env-file booking-infra/.env.production \
  -f booking-infra/docker-compose.dev.yml restart pgbouncer
```

## Verification

Test PgBouncer in isolation, before touching any app container:

```bash
docker exec -it -u postgres postgres psql \
  "postgresql://postgres:<pw>@pgbouncer:6432/booking_platform" -c "SELECT 1;"
```

Should return `1`. Only after this passes, restart dependent app
containers and confirm `/health` shows `"postgres": true`.

## Prevention

This is a structural gap, not a one-off mistake: any future password
rotation or cluster reinitialization will silently break PgBouncer auth
again unless `userlist.txt` is regenerated in the same step. Options
worth considering as a follow-up (not done as part of this fix):
- Script the `pg_authid` → `userlist.txt` sync as part of the
  Postgres container's startup or the deploy process, so it can never
  drift.
- Switch to `auth_query` against `pg_shadow`/`pg_authid` instead of a
  static file, so PgBouncer always checks the live verifier.