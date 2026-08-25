# Runbook: Point-in-Time Recovery (PITR) restore

## Purpose

Restore the `booking-primary` Postgres cluster to a specific past moment,
recovering data lost to an accidental delete, bad migration, or similar,
without losing everything since the last base backup.

This procedure was run and verified end-to-end on 2026-08-25: a test
user was created, its exact row and timestamp recorded, the row was
deleted, and PITR restored it exactly, same id, same email, same
`created_at` to the microsecond.

## Prerequisites

- A working pgBackRest stanza with at least one completed base backup
  (`pgbackrest --stanza=booking-primary info` shows `status: ok`).
- Continuous WAL archiving confirmed working (`archive_mode=on`,
  `archive_command` actually succeeding, not just configured).
- A target timestamp to restore to. This must be a real point **after**
  the data you want to keep existed, and **before** the event you're
  recovering from.

## Procedure

### 1. Establish the target timestamp

If recovering from a live incident, use the last known-good time from
logs/monitoring. If rehearsing (as done here), capture it directly:

```bash
docker exec -it postgres psql -U postgres -d booking_platform -c "SELECT now();"
```

Record this exactly, down to the second. This is your `--target`.

### 2. Force the current WAL segment to archive

Postgres only archives a WAL segment once it's full or explicitly told
to switch. Anything written since the last natural segment boundary may
still be sitting unarchived locally. Force it so nothing needed for the
restore is at risk if the data directory gets wiped next:

```bash
docker exec -it postgres psql -U postgres -d booking_platform -c "SELECT pg_switch_wal();"
```

Confirm it landed in S3:

```bash
aws s3 ls s3://<bucket>/pgbackrest/archive/booking-primary/16-1/0000000100000000/ --recursive
```

### 3. Stop Postgres

Cannot restore into a data directory a live process has open:

```bash
docker compose --env-file booking-infra/.env.production \
  -f booking-infra/docker-compose.dev.yml stop postgres
```

### 4. Run the restore

```bash
docker compose --env-file booking-infra/.env.production \
  -f booking-infra/docker-compose.dev.yml \
  run --rm --no-deps -u postgres postgres \
  pgbackrest --stanza=booking-primary \
  --type=time --target="<TARGET_TIMESTAMP>" \
  --target-action=promote \
  --delta \
  restore
```

Flag reference:
- `--type=time --target=...`: restore to a specific moment, not just the
  latest backup.
- `--target-action=promote`: auto-promote to a writable state once the
  target is reached. Without this, pgBackRest pauses recovery and waits
  for a manual `pg_wal_replay_resume()`, the safer default for a real
  production incident (gives you a chance to verify before committing),
  but `promote` is appropriate for a scripted/rehearsed restore.
- `--delta`: reconcile against the existing data directory instead of
  requiring it fully empty first. Correct when the "damage" was data
  loss within an intact cluster (a bad DELETE, a bad migration), not a
  destroyed volume.

Expect `restore command end: completed successfully`, with a restore
size/file count matching the base backup it restored from.

### 5. Start Postgres and let it replay WAL to the target

```bash
docker compose --env-file booking-infra/.env.production \
  -f booking-infra/docker-compose.dev.yml up -d postgres
```

Watch the logs, this is not instant, WAL segments are fetched and
replayed one at a time:

```bash
docker logs postgres --tail=40
```

`FATAL: the database system is not yet accepting connections` /
`Consistent recovery state has not been yet reached` lines during this
window are expected, not errors, they're the healthcheck polling while
replay is still in progress.

Expect to eventually see `database system is ready to accept
connections` after the recovery/replay log lines.

## Verification

Query the specific row(s) you're trying to recover, don't just check
row counts:

```bash
docker exec -it postgres psql -U postgres -d booking_platform -c \
  "SELECT id, email, created_at FROM users;"
```

The recovered row must match the original exactly, including
`created_at` to the microsecond, not just "a similar-looking row."

Confirm PITR actually created a new timeline (proves the instance
genuinely branched at the recovery point, rather than replaying straight
through to the end of available WAL):

```bash
docker exec -it postgres psql -U postgres -d booking_platform -c \
  "SELECT pg_walfile_name(pg_current_wal_lsn());"
```

The WAL filename should start with `00000002` (timeline 2) or higher,
not `00000001`.

## Notes / things that will trip you up

- `docker exec` against the running Postgres container cannot be used to
  run the restore, the running container's entrypoint is Postgres itself
  (PID 1); stopping Postgres from inside would kill the container. Use
  `docker compose run --rm` instead, a one-off container sharing the
  same image and volume.
- The restore command must run as the `postgres` user (`-u postgres`),
  same reasoning as the pgBackRest root-vs-postgres runbook, running as
  root will fail with permission or role errors.
- `--target-action=promote` is a rehearsal/scripted-recovery choice.
  For a real production incident, consider omitting it (or using
  `pause`) so you can verify the restored state before the instance
  becomes writable and starts accepting new traffic.