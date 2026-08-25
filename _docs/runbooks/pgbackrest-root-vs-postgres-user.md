# Runbook: pgBackRest fails with permission denied on log/lock files

## Symptom

```
WARN: unable to open log file '/var/log/pgbackrest/<stanza>-stanza-create.log': Permission denied
ERROR: [050]: unable to acquire lock on file '/tmp/pgbackrest/<stanza>-archive-1.lock': Permission denied
ERROR: [056]: unable to find primary cluster - cannot proceed
WARN: unable to check pg1: [DbConnectError] ... FATAL: role "root" does not exist
```

## Root cause

`docker exec <container> pgbackrest ...` without an explicit user runs as
**root** by default. Postgres, and the pgBackRest process spawned by
`archive_command`, run as the `postgres` OS user (uid 70 on the Alpine
Postgres image). Two distinct failures follow from this:

1. pgBackRest run as root tries to authenticate to Postgres as the OS
   user it's running as (`root`), and there is no `root` Postgres role,
   hence `role "root" does not exist`.
2. If a root-run attempt gets far enough to create files under
   `/tmp/pgbackrest` or `/var/log/pgbackrest` before failing, those
   files/directories end up owned by `root`. The `postgres` user is not
   a member of the `root` group, so all subsequent correctly-run
   attempts (as `postgres`) are then locked out of their own working
   directories.

## Fix

Always invoke pgBackRest as `postgres`:

```bash
docker exec -it -u postgres postgres pgbackrest --stanza=<name> stanza-create
```

If a prior root-run attempt already left root-owned artifacts behind,
clean them up as root first, then re-run as `postgres`:

```bash
docker exec -it postgres rm -f /var/log/pgbackrest/<stanza>-stanza-create.log
docker exec -it postgres rm -rf /tmp/pgbackrest

docker exec -it -u postgres postgres pgbackrest --stanza=<name> stanza-create
```

## Verification

```bash
docker exec -it postgres ls -la /var/log/pgbackrest
docker exec -it postgres ls -la /tmp/pgbackrest
```

Both should show `postgres:postgres` ownership (or not exist yet, in
which case the next `postgres`-run command will create them correctly).

## Prevention

Every `docker exec ... pgbackrest ...` command against this container
must include `-u postgres`. Worth wrapping in a small shell alias or
documented convention so it isn't forgotten on a future one-off command.