# ADR 012: Analytics via Postgres Materialized Views, Refreshed on a Timer

**Status**: Approved, pending implementation
**Date**: 2026-07-11

## Context

No analytics or KPI reporting exists anywhere in the platform yet. A host-facing dashboard needs cross-module metrics (bookings, revenue, properties, payments, renters, maintenance) aggregated over a selectable time window, without every dashboard load running expensive aggregate queries directly against live transactional tables as booking volume grows.

## Decision

**Time window**: fixed choice of last 7, 30, or 90 days, selectable by the host, no arbitrary custom range for v1.

**Storage approach**: Postgres materialized views, one per KPI group, refreshed on a timer via `REFRESH MATERIALIZED VIEW CONCURRENTLY`, not a fully incremental read-model built off the outbox pattern. Given current data volume (low hundreds of rows per table, confirmed from production data inspected during this session), a timer-refreshed materialized view is correctly scoped, not premature, an incremental outbox-driven read-model would be solving a scale problem that does not yet exist, at meaningfully higher implementation cost.

**Refresh cadence**: every 5 minutes, running inside `availability-worker` alongside its existing reconciliation sweep (ADR 009), reusing the same Redis-lock-guarded `setInterval` pattern so only one replica performs the refresh regardless of worker replica count, rather than introducing a sixth standalone process for this alone.

**KPI groups, each its own materialized view**:
- `mv_booking_kpis`: total bookings, confirmed count, cancellation rate, average nights, occupancy rate, grouped by tenant and by day within the window.
- `mv_revenue_kpis`: gross booking value, platform fee revenue, host payout total, average booking value, grouped by tenant and by day.
- `mv_property_kpis`: active listing count, revenue by property, vacancy rate by property.
- `mv_payment_kpis`: success rate, failed rate, average time-to-payment, gateway split (Paystack vs Flutterwave).
- `mv_renter_kpis`: unique renter count, repeat-booking rate, new vs returning split.
- `mv_maintenance_kpis`: open count, average resolution time, breakdown by priority.

Each view is tenant-scoped (`WHERE tenant_id = ...` baked into the view definition or filtered at query time against a tenant-partitioned view), queried via new `GET /api/v1/analytics/*` endpoints, `requireTenantMember`-gated identically to every other host-facing endpoint in this codebase.

## Consequences

**Positive**: fast dashboard loads regardless of query complexity, since the aggregation cost is paid once per 5-minute refresh, not once per page view. Reuses existing infrastructure (`availability-worker`'s lock pattern) instead of adding a new process.

**Negative**: KPI data is eventually consistent, up to 5 minutes stale, acceptable for a host-facing summary dashboard, not acceptable if this data were ever used for real-time operational decisions, which it is not.

**Revisit trigger**: if booking volume grows to a point where 5-minute-old data becomes materially misleading to hosts, or if the number of tenants grows large enough that a full materialized view refresh across all tenants becomes slow, migrate to the incremental outbox-driven read-model approach deferred here. Not needed now.