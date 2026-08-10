# Booking Platform

Multi-tenant booking marketplace for shortlets, hotels, and guesthouses.
Node.js and TypeScript throughout, PostgreSQL with row-level security,
Redis, RabbitMQ, Elasticsearch, Docker Compose.

## Services

| Service | Port | Owns | Docs |
|---|---|---|---|
| backend | 4000 | Express API: auth (password, 2FA, Google OAuth), properties, bookings, escrow/payments, tenants, admin (sellers/tenants only, see below) | [API Contracts index](./docs/api-contracts/) |
| booking-expiry-worker | none | expires unpaid `pending_payment` bookings past their hold window | not started |
| availability-worker | none | availability calendar recalculation, lock cleanup | not started |
| csv-room-import-worker | none | bulk room-type import from uploaded CSV | not started |
| seller-notification-worker | none | in-app/email/SMS dispatch to hosts | not started |
| campaign-worker | none | scheduled guest re-engagement email campaigns | not started |
| audit-worker | none | consumes `audit.log.requested`, writes `audit_logs` | not started |
| property-search-worker | none | Elasticsearch index sync for property search | not started |
| events-worker | none | **exists as a package, not wired into any docker-compose file, dev or workers-specific. Does not run anywhere right now.** | not started |

Infra containers (not part of this documentation set): rabbitmq, redis,
redis-insight, pgbouncer, postgres, elasticsearch.

## Architecture

Single PostgreSQL database, `FORCE ROW LEVEL SECURITY` on tenant-scoped
tables, driven by `SET LOCAL app.current_tenant_id` inside a per-request
transaction. Two Postgres roles are the intended model: `booking_app`
(RLS-subject, the main backend) and `booking_worker` (`BYPASSRLS`, every
worker plus the popular-properties materialized-view refresh scheduler
that runs inside the backend process). `pgbouncer/userlist.txt`
lists only `postgres`, which bypasses RLS regardless of `FORCE`, meaning
RLS is schema-complete but not yet actually enforced end to end. Verify
with `SET ROLE booking_app; SELECT count(*) FROM bookings;`, expect `0`
without a tenant context set, before trusting this paragraph is out of
date.

PgBouncer runs in transaction pool mode, which is why tenant context is
set with `SET LOCAL`, not `SET`, `SET LOCAL` is scoped to the current
transaction and survives connection multiplexing correctly under
transaction-mode pooling, a bare `SET` would leak across pooled
connections.

Schema migrations are not separate `.sql` files, they're one large
ordered array of inline SQL strings in `backend/src/migrations/runner.ts`,
run inside a single transaction on every backend boot, idempotent via
`IF NOT EXISTS`/`DROP ... IF EXISTS` guards rather than a version-tracking
table. There is no down-migration mechanism.

Workers are isolated packages under `packages/`, each with its own
`package.json`, connecting to RabbitMQ as `booking_worker` (see the role
caveat above). `packages/shared` holds the DB pool, Redis client, RabbitMQ
connection helpers, and shared types/utilities every service and worker
depends on.

## Prerequisites

- Node.js and npm (workspaces-based monorepo, `npm install` at the root
  installs and links every package)
- Docker and Docker Compose for infra (Postgres, Redis, RabbitMQ,
  Elasticsearch, PgBouncer)

## Local setup

```
npm install
npm run docker:up:build
```

Individual services/workers are not independently runnable outside the
monorepo root scripts as configured, `docker:up`/`docker:up:build` bring
up the full dev + monitoring + workers stack via three combined
compose files (`docker-compose.dev.yml`, `docker-compose.monitoring.yml`,
`docker-compose.workers.yml`). See `package.json`'s `docker:*` scripts for
the exact file combination.

## Testing

```
npm run test              # unit tests, mocked DB/Redis/RabbitMQ, backend workspace
npm run test:integration  # real Postgres via testcontainers, real HTTP routing
```

Unit tests target repositories and services directly, with `@booking/shared`'s
`query`/`queryOne`/`withTransaction` mocked. Integration tests spin up a
disposable Postgres container per run, apply the real migration set via
`runMigrations()`, and exercise real Express routing end to end. **Neither
suite currently tests against the `booking_app` role**, both connect as
the container/database superuser, meaning RLS enforcement itself is not
covered by either test tier yet, only the schema-level policies exist,
their actual behavior under the intended role separation is unverified by
automated tests. See `docs/testing.md` for the full unit vs. integration
split and what's covered domain by domain, most domains do not have
either tier of test yet, this is actively in progress, not complete.

## Documentation approach

Each backend domain that has one gets an API Contracts doc under
`docs/api-contracts/`, written from the actual route/controller/service
source, not from what an endpoint's name implies.

ADRs live at `docs/ADR-*.md`. Runbooks live
at `docs/runbooks/`.



