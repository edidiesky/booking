# Study notes: PITR, WAL archiving, and connection pooling

Built from real work this session, not textbook summary. Each section
ties back to something actually verified against a running Postgres
instance.

## 1. WAL, checkpoints, and why archiving matters

**WAL (Write-Ahead Log)**: before Postgres modifies a data page, it
writes the change to WAL first. If the process crashes mid-write, WAL is
replayed on restart to bring the data files back to a consistent state.
This is why `archive_mode=off` + a container restart still recovers
cleanly, crash recovery is a separate, always-on mechanism from
continuous archiving.

**Checkpoint**: a point where Postgres guarantees all changes up to that
point are durably written to the actual data files, not just WAL. After
a checkpoint, WAL segments before it are no longer needed for crash
recovery, only for archiving/replication/PITR.

**`checkpoint_timeout`** (default 5min) and **`max_wal_size`** (default
1GB): the two levers controlling checkpoint frequency. Whichever
threshold is hit first (time or WAL volume) triggers a checkpoint.
Frequent checkpoints = more I/O overhead, less WAL to replay on crash.
Infrequent checkpoints = better sustained write throughput, longer crash
recovery.

**Why archiving is a separate concern from crash recovery**: WAL kept
only for crash recovery gets recycled once no longer needed locally.
`archive_mode=on` + `archive_command` copies each completed segment
somewhere durable (S3, in this project) before that recycling happens,
that's what makes PITR possible, replaying archived WAL forward from a
base backup to any point in time, not just "back to the last crash."

**Interview-style question**: *"What's the difference between a backup
and WAL archiving?"* A base backup is a snapshot at one moment. WAL
archiving is the continuous stream of every change since. PITR needs
both: restore the snapshot, then replay archived WAL forward to the
exact target moment. A base backup alone only gets you back to when the
backup was taken, not to "five minutes before the incident."

## 2. pgBackRest mechanics (verified this session)

**Stanza**: pgBackRest's unit of configuration, one stanza per Postgres
cluster. `stanza-create` is a one-time operation that initializes
`archive.info`/`backup.info` catalog files in the repo (S3, here).
Nothing can archive or back up successfully before this runs, confirmed
directly: `archive-push` failed with `FileMissingError` on `archive.info`
until `stanza-create` completed.

**`archive-push` / `archive-get`**: the two directions. Postgres calls
`archive-push` (via `archive_command`) to ship a completed WAL segment
out. During restore, Postgres calls `archive-get` (via
`restore_command`, configured automatically by pgBackRest's restore) to
pull segments back in one at a time as it replays forward.

**Full vs incremental backup**: `pgbackrest backup` defaults to
incremental if a prior backup exists, full otherwise. Confirmed in this
session's first backup: `WARN: no prior backup exists, incr backup has
been changed to full`.

**`--delta` restore**: reconciles against an existing (possibly
partially intact) data directory rather than requiring it empty. Matters
for the realistic case, recovering from bad data, not a destroyed disk.

**Timelines**: every PITR restore creates a new timeline (Postgres
increments the timeline ID, e.g. `1` → `2`). This exists because after
restoring to a past point and diverging (new writes happen post-restore
that never existed on the original timeline), the WAL history has
literally branched, Postgres needs to know which branch any given WAL
segment belongs to. Verified directly: `pg_walfile_name(...)` after
restore returned a filename prefixed `00000002`, not `00000001`.

**Interview-style question**: *"Why does PITR create a new timeline
instead of just continuing the old one?"* Because the restored instance
and the original (if it still existed) would both have valid claims to
WAL positions after the restore point, with different contents. The
timeline ID disambiguates which lineage a given WAL segment belongs to,
without it, replaying WAL after a restore would be genuinely ambiguous.

## 3. Root vs. postgres user in containers (verified this session)

`docker exec <container> <cmd>` runs as root by default. Postgres and
anything it spawns (including `archive_command`'s pgbackrest calls) run
as the `postgres` OS user. Running pgBackRest commands as root
manually causes two real, distinct failures, seen directly this
session:

1. Auth failure (`role "root" does not exist`), pgBackRest tries to
   connect to Postgres as the OS user it's running as.
2. Leftover root-owned files/directories (`/tmp/pgbackrest`,
   `/var/log/pgbackrest`) that then block the correctly-run `postgres`
   user from its own working directories, since `postgres` isn't in the
   `root` group.

Always `-u postgres` when running pgBackRest commands by hand.

## 4. PgBouncer pooling modes and why they matter

**Transaction pooling** (`pool_mode = transaction`, used in this
project): a physical Postgres connection is only guaranteed to a client
for the duration of one transaction. The instant a transaction commits,
that physical connection can be handed to a completely different
client.

**Why this breaks session-scoped features**: `SET` (not `SET LOCAL`),
session-scoped advisory locks (`pg_advisory_lock`, not
`pg_advisory_xact_lock`), prepared statement caching, `LISTEN`/`NOTIFY`,
all assume "my session" persists across multiple statements/round-trips.
Under transaction pooling, "my session" is a fiction, the physical
connection underneath can change between any two statements that aren't
inside the same transaction.

**Verified this session**: a migration script's first statement was a
bare `SELECT pg_advisory_lock($1)` (session-scoped, outside any
transaction). Run through PgBouncer in transaction mode, this produced
`Connection terminated unexpectedly`, real, reproducible. Fix: connect
directly to Postgres for anything session-dependent (DDL, advisory
locks), reserve the pooler for ordinary application query traffic.

**`SET LOCAL` vs `SET`**: this project's RLS tenant-context uses
`SET LOCAL app.current_tenant_id = ...` specifically because it's
transaction-scoped, safe under transaction pooling. A bare `SET` would
leak tenant context across unrelated requests that happen to land on the
same physical connection after pooling hands it off.

**Interview-style question**: *"Why would you choose transaction pooling
over session pooling for PgBouncer, given it breaks things like advisory
locks?"* Transaction pooling allows far higher `max_client_conn` relative
to `default_pool_size`, since physical connections are shared much more
aggressively, critical when Postgres's own `max_connections` is a hard
limit and you have many more application-level clients than that. The
tradeoff is real: you gain connection scalability, you lose
session-level semantics, anything needing those has to bypass the
pooler.

## 5. Auth: SCRAM verifiers and PgBouncer's userlist.txt

Postgres (since v10, default `password_encryption=scram-sha-256`) stores
passwords as a **SCRAM verifier**, not the plaintext, not a simple hash
of it, queryable via `SELECT rolpassword FROM pg_authid WHERE rolname=...`.

PgBouncer with `auth_type = scram-sha-256` and a static `auth_file`
(`userlist.txt`) stores its own **copy** of that verifier. It does not
derive it live from Postgres. Any time the role's password changes
(explicit rotation, or implicitly via a fresh `initdb`, which generates
a brand new verifier even if the plaintext string is unchanged),
`userlist.txt` goes stale silently, no error until something actually
tries to authenticate through PgBouncer.

**Verified this session**: after two `initdb` resets, direct
`psql` connections to Postgres worked (checking the live verifier),
while PgBouncer connections failed (checking the stale `userlist.txt`
copy), same password, different result, that asymmetry is the
diagnostic signal.

**Fix applied**: pull the real verifier directly from
`pg_authid.rolpassword` and overwrite `userlist.txt` with it, don't
hand-generate a hash.

**Interview-style question**: *"How would you avoid this class of bug
long-term?"* Either automate `userlist.txt` regeneration as part of
Postgres startup/deploy (so it can never drift), or switch PgBouncer to
`auth_query` against `pg_shadow`/a security-definer function, which
checks the live verifier on every connection instead of a cached copy.
The static-file approach is the root cause, not the specific staleness
incident.

## 6. Quick reference: commands used this session

```bash
# WAL archiving status
docker exec -it postgres psql -U postgres -d booking_platform -c "SHOW archive_mode;"

# replication status (0 rows = not connected)
docker exec -it postgres psql -U postgres -d booking_platform -c \
  "SELECT client_addr, state, sync_state, replay_lag FROM pg_stat_replication;"

# pgBackRest, always as postgres
docker exec -it -u postgres postgres pgbackrest --stanza=<name> stanza-create
docker exec -it -u postgres postgres pgbackrest --stanza=<name> backup
docker exec -it -u postgres postgres pgbackrest --stanza=<name> info

# force a WAL segment to archive immediately
docker exec -it postgres psql -U postgres -d booking_platform -c "SELECT pg_switch_wal();"

# real SCRAM verifier for a role
docker exec -it postgres psql -U postgres -d booking_platform -c \
  "SELECT rolpassword FROM pg_authid WHERE rolname='postgres';"

# PITR restore (see pitr-restore.md runbook for full procedure)
docker compose ... run --rm --no-deps -u postgres postgres \
  pgbackrest --stanza=<name> --type=time --target="<ts>" \
  --target-action=promote --delta restore
```