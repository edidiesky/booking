# Infrastructure Setup

Covers `infra/` as it actually exists, verified file by file against real
content, not against filenames or folder structure alone. Two pieces are
deliberately excluded, see **Excluded, not documented** at the bottom,
documenting them here would describe infrastructure that either doesn't
belong to this project or isn't real yet.

## Stack overview

| Component | Compose file | Port(s) | Purpose |
|---|---|---|---|
| postgres | `docker-compose.dev.yml` | 5432 (internal) | primary database |
| pgbouncer | `docker-compose.dev.yml` | 6432 | connection pooler, transaction mode |
| redis | `docker-compose.dev.yml` | 127.0.0.1:6379 | cache, locks, session/2FA/reset-token storage |
| redis-insight | `docker-compose.dev.yml` | 127.0.0.1:8001 | Redis GUI, dev convenience only |
| rabbitmq | `docker-compose.dev.yml` | 127.0.0.1:5672, 127.0.0.1:15672 (management UI) | event bus |
| elasticsearch | `docker-compose.dev.yml` | 127.0.0.1:9200 | property search index |
| booking (backend) | `docker-compose.dev.yml` | 4000 | the API, see root README |
| prometheus | `docker-compose.monitoring.yml` | internal, scraped by Grafana | metrics collection |
| grafana | `docker-compose.monitoring.yml` | internal | dashboards, provisioned via `grafana/chart.json` |
| postgres-exporter | `docker-compose.monitoring.yml` | 9187 (scraped) | Postgres metrics, custom queries in `postgres-exporter/queries.yaml` |
| pgbouncer-exporter | `docker-compose.monitoring.yml` | 9127 (scraped) | pooler metrics |
| pganalyze-collector | `docker-compose.monitoring.yml` | none | ships `pg_stat_statements`/lock/vacuum data to PGAnalyze cloud, **credential rotation in progress as of this writing, see the incident note below before assuming this is safe to trust in its current form** |
| loki | `etc/loki/loki-config.yml` | internal | log aggregation |
| promtail | `etc/promtail/promtail-config.yml` | internal | ships container logs to Loki |
| 7 workers | `docker-compose.workers.yml` | none, background consumers | see Workers below |

All ports outside 4000 and the management/GUI ports are bound to
`127.0.0.1` only in `docker-compose.dev.yml`, not exposed beyond the host,
confirmed directly in the compose file, not assumed from convention.

## PgBouncer

`pool_mode = transaction` (`pgbouncer/pgbouncer.ini`). This is the reason
the backend's RLS tenant-context is set with `SET LOCAL`, not a bare
`SET`, inside a per-request transaction, not on the connection generally.
Under transaction pooling, a physical Postgres connection is handed to a
different client the instant a transaction ends, a session-level `SET`
would leak `app.current_tenant_id` across unrelated requests that happen
to share the same pooled connection. `SET LOCAL` scopes to the
transaction only, and is the only setting mechanism that's actually safe
under this pool mode. If pool mode is ever changed to `session`, this
constraint goes away, but transaction mode is also what makes 500
`max_client_conn` against a `default_pool_size` of 25 workable at all,
don't change pool mode without re-deriving both consequences, not just
the one that's convenient to remember.

`[databases]` has one entry, `booking_platform`, with no `user=` param,
meaning PgBouncer passes through whatever username the connecting client
authenticates as. This is exactly why `pgbouncer/userlist.txt` having
only a `postgres` entry (see the root README's Architecture section, and
`runbooks/rls-role-provisioning.md`) is sufficient to explain why RLS
isn't actually enforced yet, no routing change is needed once
`booking_app`/`booking_worker` are added there, connections using those
usernames will route correctly the moment they exist in this file.

## Monitoring stack

Prometheus scrapes five real, confirmed-correct targets (`prometheus.yml`):
`prometheus:9090` (self), `grafana:3000`, `booking:4000` (the backend's own
`/metrics`), `rabbitmq:15692`, `postgres-exporter:9187`,
`pgbouncer-exporter:9127`. `postgres-exporter/queries.yaml` adds custom
queries beyond the exporter's defaults, dead-tuple/autovacuum health is
the one confirmed by direct read, others in that file weren't
individually re-verified for this document.

Grafana's dashboard is provisioned from `grafana/chart.json`, a standard
Grafana dashboard JSON export, not independently parsed panel by panel
for this doc. **`grafana.ini`'s admin credentials are mid-rotation as of
this writing**, see the root incident notes, don't treat the default
`admin`/`admin` as still valid without confirming rotation actually
completed.

Loki and Promtail configs (`etc/loki/loki-config.yml`,
`etc/promtail/promtail-config.yml`) were checked for cross-project
contamination specifically (none found) but not read in full operational
detail for this document, standard Loki/Promtail setup as far as verified.

## Redis

`redis/redis.conf` checked for cross-project contamination, none found.
Not independently documented setting-by-setting here, the backend's own
`REDIS_HOST`/`REDIS_PORT` env vars (see root README) are what actually
matters for connecting to it, the `.conf` file governs server-side
behavior (persistence, memory policy) that wasn't itemized for this pass.

## Provisioning the RLS roles

Full detail also lives in `runbooks/rls-role-provisioning.md`, restated
here since this is the single most consequential unfinished setup step in
the whole stack, everything RLS-related depends on it.

Connect as `postgres` and create both roles:

```sql
CREATE ROLE booking_app
  WITH LOGIN
  PASSWORD 'REPLACE_WITH_A_REAL_SECRET'
  CONNECTION LIMIT 100;

CREATE ROLE booking_worker
  WITH LOGIN
  PASSWORD 'REPLACE_WITH_A_DIFFERENT_REAL_SECRET'
  BYPASSRLS
  CONNECTION LIMIT 30;

GRANT CONNECT ON DATABASE booking_platform TO booking_app, booking_worker;
GRANT USAGE ON SCHEMA public TO booking_app, booking_worker;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO booking_app, booking_worker;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO booking_app, booking_worker;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO booking_app, booking_worker;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO booking_app, booking_worker;
```

The two `ALTER DEFAULT PRIVILEGES` lines are not optional cleanup, without
them the next migration's new table silently grants nothing to either
role.

Verify: `booking_app` must show `rolbypassrls = f`, `booking_worker` must
show `t`.
```sql
SELECT rolname, rolbypassrls, rolcanlogin, rolconnlimit
FROM pg_roles WHERE rolname IN ('booking_app', 'booking_worker');
```

**Getting the password hash for PgBouncer, you don't hash it yourself.**
`CREATE ROLE ... PASSWORD` already stored a correctly-formatted hash in
`pg_authid`, provided `SHOW password_encryption;` returns
`scram-sha-256` (matching `pgbouncer.ini`'s `auth_type = scram-sha-256`,
confirmed set correctly in this repo). Pull it:
```sql
SELECT rolname, rolpassword FROM pg_authid WHERE rolname IN ('booking_app', 'booking_worker');
```
`pg_authid`, not `pg_roles`, the latter doesn't expose `rolpassword` at
all, restricted to superuser, which is why this step requires connecting
as `postgres`. The returned value, `SCRAM-SHA-256$<iterations>:<salt>$<StoredKey>:<ServerKey>`,
goes into `pgbouncer/userlist.txt` verbatim, no reformatting:
```
"booking_app" "SCRAM-SHA-256$<paste exact value>"
"booking_worker" "SCRAM-SHA-256$<paste exact value>"
```
Reload without a restart: `docker exec pgbouncer psql -h 127.0.0.1 -p 6432 -U pgbouncer pgbouncer -c "RELOAD;"`.
No `pgbouncer.ini` change needed, the `[databases]` entry has no `user=`
param, so it passes through whichever role name the client connects as.

Final check: `SET ROLE booking_app; SELECT count(*) FROM bookings;` must
return `0` with no tenant context set. A non-zero count means
`BYPASSRLS` or `FORCE ROW LEVEL SECURITY` isn't actually in effect
somewhere, stop and investigate before trusting anything downstream.

## Workers

`docker-compose.workers.yml` wires exactly 7 of the 8 packages under
`packages/`: `booking-expiry-worker`, `campaign-worker`, `audit-worker`,
`seller-notification-worker`, `csv-room-import-worker`,
`availability-worker`, `property-search-worker`. All seven share the same
shape: build from the monorepo root context, one Dockerfile per package,
`env_file: ./.env.production`, depend on `rabbitmq`+`redis`+`postgres`
being healthy first (`property-search-worker` additionally depends on
`elasticsearch`, the only worker that does).

**`events-worker` is not in this file**, confirmed by direct read, not
inference. It exists as a package under `packages/` with its own
`package.json` but has no compose service, no build context wired
anywhere, no way to actually run in this stack as currently configured.
Same finding reported when this was first checked, still true against
this fresh upload, this hasn't been fixed yet.

## Local setup

```
npm run docker:up:build
```

Runs the combined `docker-compose.dev.yml` + `docker-compose.monitoring.yml`
+ `docker-compose.workers.yml`, per the root `package.json` script, see
the root README for the exact script definitions.

## Known issues, as of this writing

- **`pganalyze` DB credential and Grafana admin credential**: found
  committed in plaintext, rotation in progress, see the session notes
  covering `docker-compose.monitoring.yml`'s `DB_PASSWORD` and
  `grafana.ini`'s `admin_password`. If you're reading this later and
  those notes are gone, verify directly rather than assuming it was
  finished: check whether `DB_PASSWORD`/`GF_SECURITY_ADMIN_PASSWORD` are
  env-var-driven in the compose file (they should be) rather than
  hardcoded (they were).
- **`.env.infra` was missing from `.gitignore`**, `generate-secrets.sh`
  explicitly instructs pasting secrets into a file git wasn't ignoring.
  Should be fixed alongside the rotation above, confirm the `.gitignore`
  entry actually landed.
- **`generate-secrets.sh` hardcodes `RABBITMQ_USER=akirs`**, leftover
  from a different project this infra setup was scaffolded from. Needs
  correcting to this project's actual RabbitMQ username before the
  script's output should be trusted as a template.
- **`events-worker` has no compose wiring**, see Workers above.

## Excluded, not documented

- **`nginx/nginx.cfg`**: entirely a different project's reverse-proxy
  config (wrong domains, wrong upstream service/port, references ACL and
  `.htpasswd` files that don't exist in this repo, would fail to start as
  written). Decision made to move to Caddy instead of repairing this
  file, not documented here since it isn't this project's real
  configuration and won't become it.
- **`infra/k8s/`**: contains a different project's manifests (secret
  files named for unrelated services, a deployment pulling an unrelated
  Docker Hub image). This directory is listed in `.gitignore`, meaning it
  likely was never committed and may just need local deletion rather than
  a history operation, unconfirmed as of this writing, run
  `git log --all --full-history -- infra/k8s` to check before assuming
  either way. Not documented until this is resolved.


## CREATING AN ADMIN
DO $$
DECLARE
  v_user_id UUID;
  v_role_id UUID;
BEGIN
  INSERT INTO users (email, password_hash, first_name, last_name, user_type, tenant_id, status, is_email_verified)
  VALUES ('mock.admin@gmail.com', '$2b$10$vrB5ZawCnyucTdf3Dtsg1.2qTKCGoQBopDL4nYLuSlRBB.W3Edw1G',
          'Mock', 'Admin', 'platform:admin', NULL, 'active', true)
  RETURNING id INTO v_user_id;

  SELECT id INTO v_role_id FROM roles WHERE slug = 'platform:admin' AND tenant_id IS NULL;

  INSERT INTO user_roles (user_id, tenant_id, role_id, assigned_by)
  VALUES (v_user_id, NULL, v_role_id, 'manual-testing');
END $$;