# ADR-019: WAL Archiving and PITR Backup Tool — pgBackRest over wal-g

## Status

Accepted

## Context

Workstream A (A1-A3) requires continuous WAL archiving to S3 and true
point-in-time recovery. As of this ADR, verified directly against
`_infra/postgres/postgresql.primary.conf` and `_infra/scripts/`, neither
exists in the repo: no `archive_mode`, no `archive_command`, no backup
script, no restore script, no S3 bucket confirmed. This is greenfield
work, not a resume of prior work, despite earlier session notes implying
otherwise.

The project is not single-node. `docker-compose.dev.yml` defines a
`postgres-replica` service that bootstraps via
`pg_basebackup -h postgres -U replicator -D ... -Fp -Xs -P -R`, and
`_infra/postgres/init-replication.sh` provisions a `replicator` role with
`REPLICATION LOGIN`. Primary + replica topology already exists as code,
unverified as running, but real as intent. Any backup/PITR tool choice
has to account for both nodes needing to restore from one consistent
backup catalog, not two independently-scripted paths.

Two realistic tools: wal-g and pgBackRest. Both archive WAL continuously
to S3, take base backups, and support PITR.

## Decision

Use pgBackRest.

## Rationale

**wal-g**: single binary, minimal config, fastest to wire into
`archive_command` plus a cron base-backup job. No built-in backup
catalog, no native retention policy engine, retention has to be
hand-scripted against S3 lifecycle rules separately from the tool. Fine
for a single-node setup where "did the backup work" is answered by one
script's exit code.

**pgBackRest**: stanza/repo model gives one backup catalog that both
primary and replica reference. Built-in `pgbackrest info` for catalog
inspection, native `--repo1-retention-full` retention (the tool enforces
it, not S3 lifecycle rules doing double duty), page-checksum validation
on restore, parallel compression. Heavier to configure correctly the
first time.

The deciding factor is the existing replica topology. With two nodes
that need to agree on what a valid backup/restore point is, a single
backup catalog (pgBackRest's stanza) is materially safer than two
hand-rolled wal-g scripts that could drift from each other silently. The
extra config cost is paid once, in A1, and is reused directly by A3
(restore verification) and A4 (replica lag/promotion), instead of each
of those needing its own reconciliation logic against a toolless backup
history.

## Consequences

- Config surface is larger: `pgbackrest.conf` with a stanza block per
  node, not a single `archive_command` string. This needs its own
  `docs/runbooks/pitr-restore.md` (E2) written against the real command
  syntax, not generic docs.
- Retention numbers (`--repo1-retention-full`, `--repo1-retention-diff`)
  are not set yet. They depend on real WAL generation rate, which is
  unmeasured, not on a default guess. Deferred to the A1 implementation
  step, after `pg_stat_bgwriter` / `pg_stat_archiver` data exists.
- S3 bucket existence, region, and versioning/encryption state are
  unverified as of this ADR. `pgbackrest.conf` values for
  `repo1-s3-bucket` / `repo1-s3-region` are placeholders until the
  pending `aws s3api head-bucket` / `aws sts get-caller-identity` output
  is confirmed.
- This ADR does not cover checkpoint tuning (A6) or the replica's own
  verification (A4). Those are separate PRs.

## Alternatives considered

- **wal-g** — rejected per Rationale above, not because it's a worse
  tool in isolation, but because it doesn't fit a two-node topology as
  cleanly without extra hand-built reconciliation.
- **Managed backups (e.g. RDS-style automated snapshots)** — not
  applicable, this is self-hosted Postgres in Docker, not a managed
  service.