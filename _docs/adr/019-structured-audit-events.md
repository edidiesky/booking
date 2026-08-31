# ADR-019: Structured audit events, derived from auditlog.dev's product audit log pattern

## Status
Accepted

## Context
The existing `audit_logs` table (migration 015) is written via
`outboxRepository.createStandalone("audit.log.requested", ...)`, an
explicitly non-transactional insert, documented at the time as an
acceptable tradeoff ("losing an entry on a rare crash... is a much
smaller risk than losing a payment or booking event"). Reviewing
[auditlog.dev](https://www.auditlog.dev/)'s five theses on product
audit logs (Maximilian Kaske, building openstatus.dev) surfaced that
this tradeoff, along with several structural gaps in the schema itself,
work against what an audit log is actually for: evidence an auditor
who knows nothing about this codebase can interrogate a year later, not
a debugging trail for the person who wrote the code.

Confirmed real gaps in `audit_logs` against the source's argument,
checked directly against the actual repository and schema, not assumed:

1. Async, outbox-based write, not the same transaction as the mutation
   it describes, the row and the change can diverge.
2. No `outcome`/`denial_reason` columns, a denied authorization attempt
   has no place to go, only successful actions are representable.
3. `user_id` is a live foreign key, not a point-in-time identity
   snapshot, a deleted or renamed user degrades every past row that
   references them, and there is no erasure mechanism short of deleting
   the row (destroying history) or leaving a dangling reference.
4. `old_value`/`new_value` are full JSONB blobs with no indexable
   record of which fields actually changed.
5. No actor-type discrimination, a system-initiated action and a real
   human action are indistinguishable.
6. No enforced append-only database role, anything with normal DB
   access can `UPDATE` or `DELETE` a row.

## Decision
New `audit_events` table (migration 048), not an alteration of
`audit_logs`. Old table stays queryable for history, not dropped;
`backfillAuditEvents.ts` migrates what's salvageable into the new
schema. New writes go through `audit_events` going forward, `audit_logs`
is deprecated in application code.

Core schema decisions, each traced to a specific thesis from the
source:

- **Written as one `INSERT` inside the same transaction as the
  mutation**, via `auditEventRepository.record()`, which requires a
  `PoolClient` parameter, not optional, same enforcement pattern
  `availabilityRepository.isAvailable()` (C2) already established in
  this codebase: a function whose correctness depends on running inside
  an existing transaction should not compile when called without one.
  The source's argument: the outbox pattern is for events reaching a
  system the transaction can't reach; this table lives in the same
  Postgres database as every mutation it describes, so the outbox adds
  an async gap with no corresponding benefit here.
- **`outcome` + `denial_reason`**: a denied attempt is now representable
  as a real row, source's thesis 03, "a log without denied attempts is
  half a log."
- **`actor_email`/`actor_name`/`affected_user_email` as snapshots**, not
  joins. Erasure is a narrow, separate `SECURITY DEFINER` function
  (`erase_audit_identity`) that can only null those specific columns,
  callable only by a distinct `audit_eraser` role, never a full-row
  update or delete.
- **`changed_fields TEXT[]` with a GIN index**, alongside the
  before/after values, an indexable record of what moved, not just a
  blob to scan.
- **`actor_type` discriminates user/api_key/system/impersonation**,
  matching the source's actor union.
- **Append-only enforced at the database role level**: `audit_writer`
  has `INSERT`/`SELECT` only, `UPDATE`/`DELETE` explicitly revoked.
  Source's framing, "not a convention, a revoked grant," taken
  literally, not as a code-review habit.
- **`action` is a free-form namespaced string** (`"member.role_updated"`
  style), not a closed Postgres enum. Deliberate: the existing
  `audit_action` enum on the old table meant every new action type
  needed a migration; a text column with an index absorbs new action
  types without schema churn, the real cost is losing enum-level
  validation, accepted as the better tradeoff for an append-only,
  ever-growing taxonomy.

## Consequences
- Every domain service that wants an audit trail now needs to call
  `auditEventRepository.record()` inside its own existing transaction,
  a real, ongoing discipline requirement across every future mutating
  endpoint, not a one-time migration. No enforcement mechanism for this
  yet (e.g. a lint rule catching a mutation with no adjacent audit
  call), a real gap, not solved here.
- `audit_writer`/`audit_eraser` are real, new Postgres roles. The
  application's actual DB connection needs to run as (or be granted)
  `audit_writer` for this to mean anything, not yet wired into how
  `backend`'s connection pool authenticates, that's real follow-up
  work, this migration creates the roles and grants, it doesn't change
  which role the app connects as.
- This migration incidentally provisions real Postgres roles with
  scoped grants, something C1 flagged as missing (`booking_app`/
  `booking_worker`), but only for this one table. It doesn't close
  C1's actual gap, that's still open for the broader app/worker role
  separation.
- Retention by tier (the source's real point: "an unbounded log is an
  unbounded bill, a horizon nobody chose is a horizon you cannot
  defend") is not implemented here. Ties directly to A5 (archiving
  strategy), not duplicated in this migration.
- `backfillAuditEvents.ts` has real, stated accuracy limits: no denied-
  attempt history to recover (never existed), and identity snapshots
  are resolved by joining the *live* `users` table at backfill time,
  not the actual state at the time each original action happened.

## Alternatives considered
- **Alter `audit_logs` in place** — rejected, explicit tradeoff
  discussed and decided against: the async-write pattern and the
  missing `outcome` column are structural, not additive, an `ALTER
  TABLE` can add columns but can't retroactively fix how existing rows
  were written.
- **Keep the outbox pattern, just add the missing columns** — rejected,
  the source's core argument is specifically that outbox-for-audit is
  the wrong tool when the log lives in the same database as what it
  describes, adding columns without fixing the write path keeps the
  actual correctness gap (row and mutation can diverge) intact.