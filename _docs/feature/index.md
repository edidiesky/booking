## Tier 1 — Core product & money path

| Feature | Evidence in codebase | Why critical |
| --- | --- | --- |
| Multi-tenant isolation (RLS + tenant context) | `FORCE RLS`, `SET LOCAL app.current_tenant_id`, two-role intent (`booking_app` / `booking_worker`), PgBouncer transaction mode | Data isolation is the product boundary |
| Auth + RBAC + 2FA + Google OAuth + refresh-token revocation | `auth.service.ts` (~38k), security domain, logout ADR | Security baseline for marketplace |
| Booking lifecycle (hold → payment → confirm / expire / cancel) | `booking.service.ts`, booking-expiry worker, Redis sorted set ADR | Primary revenue path |
| Escrow-based payments + host payout | escrow domain, payment service, gateway adapters | Trust & money movement |
| Availability calendar + holds + reconciliation | availability domain + availability-worker (lock sweep + reconcile) | Prevents overbooking |
| Seller storefronts (subdomain + custom domain design) | gateway subdomain resolver, Caddy routes, tenant service | Multi-tenant UX surface |

## Tier 2 — Platform correctness & scale patterns

| Feature | Evidence | Why critical |
| --- | --- | --- |
| In-process background workers (6) | availability, booking-expiry, csv-room-import, seller-notification, campaign, audit | Operational reality on Railway budget; deliberate tradeoff with archive branch |
| Transactional outbox | outbox domain, used from booking/payment paths | Durability of side effects |
| Idempotency | idempotency domain, payment/booking paths | Safe retries under at-least-once delivery |
| Property search in Postgres | `tsvector` + `pg_trgm` + `earthdistance` (ES removed) | Search without extra infra |
| Gateway: rate limiting + subdomain resolution | gateway package, rate-limit ADRs | Edge control plane |
| Structured audit events | audit domain, ADR-019, audit-worker | Compliance & forensics |
| Real-time host notifications (SSE) | sse domain, seller-notification worker | Host experience |