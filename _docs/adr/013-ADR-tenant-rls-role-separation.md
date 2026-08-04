# ADR: Tenant Isolation via Postgres RLS with a Two-Role Split

## Status
Accepted. Policies and application-side plumbing built; role creation and PgBouncer wiring confirmed against the real running stack in this session.

## Context
Tenant isolation previously lived entirely in application code: every repository method had to remember `WHERE tenant_id = $1`. That's worked so far, but it's a discipline problem, not a guarantee, one missed clause in one new method and tenant A sees tenant B's data. The failure mode is silent, not loud.

Two decisions had to be made together, not separately, because they constrain each other:

1. How to enforce tenant isolation at the database level, not just in application code.
2. How to let background workers (which write to the same tables from separate processes, outside any HTTP request) keep functioning once that enforcement is live.

## Decision

**Postgres Row-Level Security**, with `FORCE ROW LEVEL SECURITY` on every protected table, driven by a session variable (`app.current_tenant_id`) set via `SET LOCAL` inside a per-request transaction.

**Two database roles, not one**:
- `booking_app`: the main backend API. No `BYPASSRLS`. This is the role RLS is protecting against, a missed `WHERE` clause in application code can no longer leak data, the database itself refuses to return rows outside the session's tenant.
- `booking_worker`: all six isolated background workers, plus the popular-properties refresh scheduler inside the main backend process. Granted `BYPASSRLS`. These run outside any request context, there's no tenant to scope a session variable to, and several of them (audit logging, campaign sending, availability reconciliation, materialized view refresh) are inherently cross-tenant operations by design, not exceptions to work around.

**`SET LOCAL` specifically, not plain `SET`**: this was deliberate from the start, not a fix applied later, because it's the only form compatible with PgBouncer's transaction-mode pooling (confirmed as the actual configured mode in this deployment). A transaction-scoped setting clears automatically at commit and never leaks across the connection reuse that transaction pooling depends on for its multiplexing benefit. Plain `SET` would have made this design fundamentally incompatible with the PgBouncer sidecar already in front of Postgres.

## Consequences

- **Real, database-enforced isolation**, not just application-layer discipline. A query with no session variable set fails closed (`current_setting(..., true)` returns NULL, matching zero rows), not open.
- **A prerequisite most of this ADR's real debugging time went into**: `FORCE ROW LEVEL SECURITY` matters specifically because the table owner otherwise bypasses RLS unconditionally, and the connecting role (`postgres`, a superuser) *always* bypasses RLS regardless of FORCE. This meant RLS was fully built and migrated, but genuinely inert, until the two application roles were actually created and wired into the real connection strings, a gap only caught by directly inspecting the live database's `pg_roles`, not by reading the code.
- **PgBouncer's `[databases]` pass-through auth and `userlist.txt` are now part of the tenant-isolation surface**, not just an operational concern. A role that exists in Postgres but not in `userlist.txt` is rejected at the PgBouncer layer before ever reaching a policy check.
- **Not yet extended to every table.** `booking_locks`, `campaign_templates`, `campaign_recipients`, `renters`, `user_notifications`, `favorites` have no direct `tenant_id` column and remain unprotected by RLS, tenant-scoped only transitively through a parent record. Real follow-up work, not an oversight to be silently carried forward.
- **`withTransaction()` call sites that don't reuse the request-scoped RLS client are a known, systemic risk**, not fully audited. Any such call site touching an RLS-protected table opens a fresh, unscoped connection and will be rejected the moment it runs against a live-enforced policy. One instance (`createProperty`) was found and fixed during this work; the rest of the codebase has not been swept.

## Alternatives considered

- **Application-layer-only isolation** (status quo before this work): rejected, a single missed `WHERE` clause is a silent data leak with no defense in depth.
- **Separate databases per tenant**: rejected as disproportionate for the current scale, and would have complicated the workers' cross-tenant operations (audit aggregation, campaign sending) far more than RLS does.
- **Plain `SET` instead of `SET LOCAL`**: rejected outright once PgBouncer's transaction-mode pooling was confirmed, a session-level setting would leak across the connection reuse pooling depends on.