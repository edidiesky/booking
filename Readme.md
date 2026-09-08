# Bukking Platform

I built a multi-tenant booking marketplace for shortlets, hotels, and
guesthouses, end to end: authentication and RBAC, property and
availability management, escrow-based payments, seller storefronts on
custom domains, structured audit logging, and real-time messaging.
Node.js and TypeScript throughout, PostgreSQL with row-level security,
Redis, RabbitMQ, Docker Compose.

**[Live demo ](https://bukkings.space)**

## What I actually have running

| Service | Port | Owns |
|---|---|---|
| backend | 4000 | Express API (auth, 2FA, Google OAuth, properties, bookings, escrow/payments, tenants, seller domains, admin) **and** 6 in-process background workers (see below) |
| gateway | — | Rate limiting, subdomain resolution for seller storefronts |
| frontend | — | React SPA, guest marketplace + host dashboard, subdomain-aware storefront routing |

Infra containers: rabbitmq, redis, pgbouncer, postgres.

## Background work: I run these in-process, not as separate containers

I used to run six workers as their own Docker containers. I now run
them **inside the backend process**, started from its own bootstrap
sequence. This was a deliberate tradeoff I made, not the architecture
I'd default to: on Railway's compute budget, one process was realistic
for me where seven wasn't. I kept the old, separate-container
implementation on a real git branch (`archive/separate-worker-
containers`), this wasn't a rewrite for me, it was a migration with a
rollback path I documented.

| Worker | Job | README |
|---|---|---|
| availability-worker | Sweeps expired availability holds/locks, reconciles the availability calendar against actual bookings | [README](./packages/availability-worker/README.md) |
| booking-expiry-worker | Expires unpaid `pending_payment` bookings past their hold window, reconciliation pass for anything the scheduler missed | [README](./packages/booking-expiry-worker/README.md) |
| csv-room-import-worker | Bulk room-type import from an uploaded CSV | [README](./packages/csv-room-import-worker/README.md) |
| seller-notification-worker | In-app notification + SSE push to hosts on booking lifecycle events | [README](./packages/seller-notification-worker/README.md) |
| campaign-worker | Scheduled guest re-engagement email campaigns, ticks every 3s for due campaigns | [README](./packages/campaign-worker/README.md) |
| audit-worker | Consumes `audit.log.requested`, writes the older `audit_logs` table | [README](./packages/audit-worker/README.md) |

## Two packages I still have on disk but don't run

| Package | Status | README |
|---|---|---|
| property-search-worker | **Dead code, on my end.** Its entire job was syncing property writes to Elasticsearch. I run property search directly in Postgres now (`tsvector` full-text + `pg_trgm` fuzzy fallback + `earthdistance` geo), I removed Elasticsearch. I left the package on disk, I don't invoke it anywhere, in-process or standalone. | [README](./packages/property-search-worker/README.md) |
| events-worker | I never wired this into any docker-compose file, dev or workers-specific, at any point in this project's history. I don't run it anywhere. | [README](./packages/events-worker/README.md) |

## Architecture

I am basically running a single PostgreSQL database, with `FORCE ROW LEVEL SECURITY` on
tenant-scoped tables, driven by `SET LOCAL app.current_tenant_id`
inside a per-request transaction. I intended two Postgres roles:
`booking_app` (RLS-subject, the main backend) and `booking_worker`
(`BYPASSRLS`, every in-process worker). My `pgbouncer/userlist.txt`
currently lists only `postgres`, which bypasses RLS regardless of
`FORCE`, so **I have RLS schema-complete but not yet actually enforced
end to end**. I mostly verify this with `SET ROLE booking_app; SELECT
count(*) FROM bookings;`, I expect `0` without a tenant context set,
and I'd check that again before trusting this paragraph is current.

I run PgBouncer in transaction pool mode, which is why I set tenant
context with `SET LOCAL`, not `SET`, `SET LOCAL` stays scoped to the
current transaction and survives connection multiplexing correctly
under transaction-mode pooling, a bare `SET` would leak across my
pooled connections.

I also run property search entirely in Postgres: a generated, weighted
`tsvector` column for relevance-ranked full-text search, `pg_trgm` as
a fuzzy fallback when my primary query returns nothing (typo
tolerance), and `earthdistance`/`cube` for radius search and distance
sort. I didn't reach for PostGIS, deliberately, a simple radius filter
doesn't need spatial joins or polygons for what I'm doing here.

I do resolve seller storefronts by subdomain
(`sellername.bukkings.space`): my gateway extracts the subdomain from
the `Host` header, resolves it to a tenant via a cached backend
lookup, and injects tenant context before proxying. I also resolve the
subdomain independently on the frontend (I didn't rely on the
gateway's header reaching the frontend's own API calls, since I hadn't
settled same-origin-vs-separate-API-host at the time I built this). I
designed and coded full custom domains (`sellername.com`, not just
subdomains) against a Caddy-based reverse proxy with automatic TLS,
but I've only made that meaningful once I run this on infrastructure I
fully control, I'm not live on that yet, still on Railway's own
managed edge.

I don't keep schema migrations as separate `.sql` files, I run one
large ordered array of inline SQL strings in
`backend/src/migrations/runner.ts`, inside a single transaction on
every backend boot, idempotent via `IF NOT EXISTS`/`DROP ... IF
EXISTS` guards rather than a version-tracking table. I don't have a
down-migration mechanism.

## Prerequisites

- Node.js and npm (I built this as a workspaces-based monorepo,
  `npm install` at the root installs and links every package)
- Docker and Docker Compose for infra (Postgres, Redis, RabbitMQ,
  PgBouncer)

## How I set this up locally

```
npm install
npm run docker:up:build
```

**Windows**: I found `npm install` inside `backend/` fails on
`puppeteer`'s postinstall step, it tries to download its own bundled
Chrome build, which is unreliable on Windows and fails with `Failed to
set up chrome-headless-shell`. Neither a `puppeteer_skip_download` nor
`puppeteer_skip_chromium_download` key in `.npmrc` worked around this
for me, both get silently rejected as `Unknown project config` by the
npm version I'm on. What worked for me, confirmed:

```
PUPPETEER_SKIP_DOWNLOAD=true npm install
```

## Testing

```
npm run test              # unit tests, mocked DB/Redis/RabbitMQ, backend workspace
npm run test:integration  # real Postgres via testcontainers, real HTTP routing
```

I target repositories and services directly in my unit tests, with
`@booking/shared`'s `query`/`queryOne`/`withTransaction` mocked. My
integration tests spin up a disposable Postgres container per run,
apply my real migration set via `runMigrations()`, and exercise real
Express routing end to end. **I don't currently test against the
`booking_app` role in either suite**, both connect as the
container/database superuser, so I don't have RLS enforcement itself
covered by either test tier yet, I only have the schema-level policies
in place, I haven't verified their actual behavior under my intended
role separation with automated tests. I don't have either tier of test
for most domains yet, I'm actively working through that, it's not
complete.

## How I document this

I write an API Contracts doc under `docs/api-contracts/` for each
backend domain that has one, from the actual route/controller/service
source, not from what an endpoint's name implies. I give each
in-process worker its own README under its package directory, same
standard.

I keep ADRs at `docs/ADR-*.md`. I keep runbooks at `docs/runbooks/`.