# Booking Platform — Senior Engineering Backlog
**Target:** Move project rating from ~7.4 → 8.4–9.0

This backlog combines the features you highlighted with the additional work required to reach strong senior-engineer signal (reliability, observability, concurrency correctness, operational maturity, and engineering discipline).

Every item must be delivered as a PR using the required template:

"
Status
    Draft | Ready for review | Blocked

Scope
Concrete changes delivered in this PR

Why we need this:
Business / reliability / observability reason

What is intentionally not included:
Explicit out-of-scope items and follow-ups"


---

## Workstream A — Reliability & Data Protection (Highest Leverage)

| # | Task | Why it matters for 8.4–9.0 | Priority |
|---|------|---------------------------|----------|
| A1 | PITR + continuous WAL archiving to S3 (wal-g or pgBackRest) | Enables true point-in-time recovery. Classic senior topic. | P0 |
| A2 | Base backup job + S3 lifecycle + encryption + retention policy | Completes the backup story. | P0 |
| A3 | Restore runbook + automated verification script | Proves recovery actually works. | P0 |
| A4 | Streaming replication (hot standby) + lag monitoring | Finishes the existing replication stubs. | P0 |
| A5 | Archiving strategy for bookings, audit_logs, outbox, payments | Prevents unbounded table growth and shows data lifecycle thinking. | P1 |
| A6 | Checkpointing pattern for long-running workers & jobs | Makes workers crash-resilient and resumable. | P1 |
| A7 | Outbox exactly-once guarantees + dead-letter handling | Critical for reliable event-driven architecture. | P1 |

---

## Workstream B — Observability & Performance Visibility

| # | Task | Why it matters | Priority |
|---|------|----------------|----------|
| B1 | DB query latency histogram wrapper around every repository / shared `query` helper | Currently the most important missing latency signal. | P0 |
| B2 | Connection pool + PgBouncer metrics (active/idle/waiting, checkout latency) | Demonstrates deep data-layer understanding. | P0 |
| B3 | Consistent request latency + stable route labelling middleware | Clean Prometheus labels, no high-cardinality paths. | P0 |
| B4 | Worker metrics (processed, failed, duration, queue lag, checkpoint age) | Full system visibility. | P1 |
| B5 | Error taxonomy + structured error counters | Better than generic error counts. | P1 |
| B6 | Grafana dashboard updates for the new metrics | Closes the observability loop. | P1 |

---

## Workstream C — Correctness, Concurrency & Multi-tenancy

| # | Task | Why it matters | Priority |
|---|------|----------------|----------|
| C1 | Full RLS role provisioning (`booking_app` + `booking_worker`) + enforcement verification | Closes the documented gap in the current README. | P0 |
| C2 | Concurrent booking race-condition protection (proper locking / advisory locks / `SELECT FOR UPDATE`) | Booking platforms live or die on this. | P0 |
| C3 | Idempotency keys on every mutating public endpoint | Not just payments. | P1 |
| C4 | Soft-delete + archival consistency across related tables | Clean and predictable data model. | P1 |
| C5 | Strict typing pass — eliminate remaining `any`, introduce branded types for Money, TenantId, BookingId, etc. | Strong senior code-quality signal. | P1 |

---

## Workstream D — Testing & Quality Gates

| # | Task | Why it matters | Priority |
|---|------|----------------|----------|
| D1 | Concurrency / race tests for booking creation on the same room type | Proves the locking actually works. | P0 |
| D2 | RLS enforcement integration tests under the real `booking_app` role | Moves RLS from theoretical to verified. | P0 |
| D3 | Worker integration tests (happy path + failure + retry + DLQ) | Most portfolios skip this. | P1 |
| D4 | Outbox delivery guarantees tests | Verifies exactly-once behaviour. | P1 |
| D5 | Payment webhook idempotency under duplicate delivery | Real-world failure mode coverage. | P1 |
| D6 | PITR restore verification test / script | Closes the reliability loop. | P1 |
| D7 | CI quality gates: coverage thresholds, no `any`, lint, typecheck, security scan | Demonstrates engineering discipline. | P1 |

---

## Workstream E — Engineering Discipline & Process

| # | Task | Why it matters | Priority |
|---|------|----------------|----------|
| E1 | Mandatory PR template (Status / Scope / Why / Out-of-scope) on every feature | Required process from day one. | P0 |
| E2 | Runbooks for: PITR restore, replica promotion, RLS role rotation, worker dead-letter recovery | Operational maturity. | P1 |
| E3 | Architecture Decision Records (ADRs) for key choices (outbox, RLS, wal-g, etc.) | Senior communication signal. | P2 |
| E4 | README + infra.md cleanup — make current limitations accurate and future work explicit | Honesty + clarity. | P1 |

---

## Workstream F — Production Hardening & Extra Features (Push toward 9.0)

| # | Task | Why it matters | Priority |
|---|------|----------------|----------|
| F1 | Rate limiting + abuse protection (per tenant / per IP / per user) | Required for any real marketplace. | P1 |
| F2 | Circuit breakers consistently applied to all external gateways (Paystack, Flutterwave, email, SMS) | You already have the helper — use it everywhere. | P1 |
| F3 | Feature flags for gradual rollout of critical paths | Shows release maturity. | P2 |
| F4 | Structured audit trail queryable by tenant + time range with proper indexes | Compliance + debugging. | P2 |
| F5 | Background job progress + cancellation API | Nice senior touch for long-running imports/campaigns. | P2 |
| F6 | Index & query review on hottest paths (availability calendar, booking search, escrow release) | Performance evidence. | P1 |
| F7 | Secrets management improvements + rotation notes | Security hygiene. | P2 |

---

## Recommended Execution Order

### Phase 1 – Foundation (Target: 8.0)
- A1 → A2 → A3
- B1 → B2 → B3
- C1
- E1

### Phase 2 – Correctness & Resilience (Target: 8.4)
- C2 → D1 → D2
- A4 → A6 → A7
- D3 → D4

### Phase 3 – Maturity & Polish (Target: 8.7–9.0)
- A5
- B4 → B5 → B6
- C3 → C4 → C5
- D5 → D6 → D7
- F1 → F2 → F6
- E2 → E4
- F3 → F4 → F5 → F7 (as time allows)

---

## Working Rules

- One coherent piece of work per PR.
- Every PR must use the Status / Scope / Why / Out-of-scope template.
- No `any` types.
- Design decisions, acceptance criteria, and interviewer questions will be provided before implementation of each item.
- We finish and review one item before moving to the next.