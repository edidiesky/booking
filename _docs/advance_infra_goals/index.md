# Advanced Infra Practice Roadmap

Purpose: deliberate practice ground using this repo as the substrate, not a
production rollout plan. Each section has a concrete task you can actually
build against this codebase, the tradeoff you're meant to learn by doing it,
and a signal for when you've actually understood it versus just copy-pasted a
tutorial. Ordered roughly crawl → walk → run, but pick based on what you want
to be interview-ready on soonest.

---

## 1. PostgreSQL sharding / partitioning

**Stage 1 — native partitioning (do this first, it's not optional prep):**
Partition `bookings` by `RANGE (created_at)`, monthly partitions. Practice:
- Write the migration that converts the existing table to a partitioned one
  without downtime (this is the actual hard part, `ALTER TABLE ... PARTITION
  BY` doesn't work on an existing table, you need the create-new,
  backfill, swap dance).
- Add a cron/worker job that creates next month's partition ahead of time
  (`pg_partman` does this for you, but build it manually once so you
  understand what it's automating).
- Verify partition pruning actually happens: `EXPLAIN ANALYZE` your
  reconciliation worker's 90-day query before and after, confirm it only
  scans the relevant partitions.
- Tradeoff to internalize: partitioning helps vacuum/index maintenance and
  query pruning, it does **not** help write throughput on a single primary,
  don't confuse the two when someone asks about it in an interview.

**Stage 2 — Citus (distributed Postgres, real sharding):**
- Stand up a local Citus cluster (docker-compose, coordinator + 2 workers).
- Distribute `bookings`, `properties`, `room_types` by `tenant_id` (this is
  the natural shard key for a multi-tenant marketplace, co-locate
  everything by tenant so joins stay on one shard).
- Deliberately write a cross-tenant query (e.g. a platform-admin dashboard
  aggregating across all tenants) and watch it become a scatter-gather
  query. This is the concrete lesson: sharding makes your single-tenant
  path free and your cross-tenant path expensive, know which one your
  product actually needs more of before you do this for real.
- Practice a shard rebalance when you add a worker node.

**Signal you've got it:** you can explain why `tenant_id` co-location
matters for THIS schema specifically (booking → property → room_type all
share a tenant), and you can name one query in the current codebase that
would become a scatter-gather query if you sharded (the tenant-wide
analytics/materialized views from ADR-012 are your candidate).

---

## 2. Patroni + PostgreSQL HA

- Local 3-node etcd cluster + 3-node Patroni-managed Postgres (docker-compose
  is fine for practice, don't need real VMs yet).
- Kill the primary (`docker stop`) mid-write and watch Patroni promote a
  replica. Time it. Understand what happens to in-flight transactions on
  the old primary (they fail, the app needs to retry, this is where
  connection-level retry logic in your Node.js pool matters).
- Point PgBouncer at Patroni's REST health check (or use HAProxy in front)
  so the pooler always finds the current writer without manual
  intervention.
- Practice a **planned** switchover (`patronictl switchover`) versus an
  **unplanned** failover, they're different code paths and different
  interview questions.
- Break synchronous replication on purpose (kill the sync replica) and
  observe writes blocking, this is the tradeoff you're paying for zero
  data loss, make sure you can articulate it, not just recite it.

**Signal you've got it:** you can explain, using this project's actual
tables, which ones you'd want synchronous replication for (`bookings`,
`escrow`, `payments`, money-adjacent) versus which are fine async
(`audit`, analytics/materialized views).

---

## 3. Redis: Sentinel, Cluster, Streams

- **Sentinel**: stand up primary + 2 replicas + 3 Sentinels. Kill the
  primary, watch Sentinel failover, then point your Node app's ioredis
  client at the Sentinel set (not a fixed host) so it follows the new
  primary automatically. This directly fixes the "single Redis instance"
  assumption baked into your current `config/redis.ts`.
- **Cluster**: shard your booking-lock keys and permission-cache keys
  across a Redis Cluster, understand hash slots and why your
  `invalidateAllInTenant`'s `KEYS`/`SCAN` pattern behaves differently
  across a cluster (you have to scan every node, not just one).
- **Streams**: rebuild your SSE availability broadcaster on `XADD` +
  consumer groups instead of pub/sub. Kill a subscriber, reconnect it,
  prove it picks up from where it left off (`XREADGROUP` with the last
  delivered ID) instead of losing events like pub/sub does. This is the
  single most concrete "before/after" demo you can build from this repo,
  you already have the exact bug (silent event loss on reconnect) to fix.

**Signal you've got it:** you can explain why pub/sub was fine for a
single-instance dev setup but becomes a liability the moment you care about
delivery guarantees, using your own SSE bridge as the example, not a
textbook one.

---

## 4. Kubernetes (beyond what's already in `infra/k8s`)

Your current manifests need a rewrite first (see NEXT-TASKS.md P0), do that
as the real starting point, then layer on:
- **Helm chart** for each service (backend, 4 workers, frontend) with
  values files per environment, instead of raw kustomize overlays.
- **HPA** on `csv-room-import-worker` driven by RabbitMQ queue depth via
  KEDA (not CPU, CPU is the wrong signal for a queue-consumer worker).
  This is a genuinely good take-home/interview story: "I scaled a worker
  based on backlog depth, not CPU, because CPU doesn't correlate with
  whether there's work to do."
- **StatefulSet** for a self-managed Postgres/Patroni if you're not using a
  managed DB, understand why StatefulSets exist (stable network identity,
  ordered rollout) versus Deployments.
- **PodDisruptionBudget** on the Patroni pods so a cluster upgrade or node
  drain never takes out quorum.
- **Operators**: install the Zalando or CrunchyData Postgres operator,
  compare how much of your hand-rolled Patroni setup it automates. Knowing
  the tradeoff (operator = less control, more automation, faster to stand
  up) is the actual interview-relevant knowledge, not memorizing CRDs.

**Signal you've got it:** you can explain why you'd pick a hand-rolled
Patroni+etcd setup versus an operator versus a managed service (RDS/Cloud
SQL) for a team your current size, cost and ops-burden tradeoffs, not just
"operators are better."

---

## 5. Terraform

- Module structure: `modules/vpc`, `modules/postgres-ha` (or
  `modules/rds`), `modules/eks` (or your k8s provider of choice),
  `modules/redis`. Root modules per environment (`envs/dev`,
  `envs/staging`, `envs/prod`) that compose them with different variable
  values, this is the pattern that stops the manifest-drift problem you
  already have in `infra/k8s`.
- State management: remote state in S3 + DynamoDB lock table (or
  Terraform Cloud), practice a state lock conflict on purpose (two applies
  at once) so you understand what it's protecting against.
- `terraform plan` in CI on every PR touching `infra/`, `apply` gated
  behind manual approval for prod. This is a concrete, demonstrable
  GitOps-adjacent practice that's cheap to set up and reads very well in
  an interview.
- Import your *existing* docker-compose-based dev infra into Terraform as
  a first exercise (even targeting local Docker via the `docker` provider)
  before touching real cloud resources, cheaper mistakes while learning
  the HCL and module patterns.

**Signal you've got it:** you can explain why remote state + locking
matters using a real scenario (two people apply at once, state file
corruption), not just "best practice says so."

---

## 6. Service mesh (Istio or Linkerd)

Only worth doing once you have more than 2-3 services actually talking to
each other over the network, you have that now (backend + 4 workers +
RabbitMQ + Redis + Postgres), so it's a reasonable next step.

- Start with **Linkerd**, not Istio, for practice, dramatically lower
  operational complexity and you'll actually finish. Istio is the more
  common interview-name-drop but Linkerd teaches the same concepts with
  less yak-shaving.
- **mTLS between services**: turn it on, verify with `linkerd viz edges`
  that traffic between backend and workers is actually encrypted, then
  intentionally misconfigure a service's proxy and watch the connection
  fail closed, understand fail-open vs fail-closed as a design choice.
- **Traffic splitting / canary**: deploy a v2 of one worker, split 10%
  traffic to it, watch the mesh's built-in success-rate metrics. This is
  the actual reason meshes exist for most teams, not the security angle.
- **Retries and timeouts at the mesh layer** versus in your Node.js code:
  deliberately create a conflict (mesh retries a non-idempotent request)
  and observe the bug, this is a real, subtle failure mode and a great
  interview story once you've caused it yourself.
- Tradeoff to be able to state cleanly: a mesh adds a sidecar proxy per
  pod (latency, memory, another thing to debug) in exchange for
  uniform observability/retries/mTLS without touching app code. For a
  4-worker + 1-API system, this is genuinely borderline, be honest in
  interviews that you'd evaluate whether the ops cost is worth it rather
  than reflexively reaching for it.

**Signal you've got it:** you can describe a retry-storm or double-execution
bug caused by mesh-level retries interacting with your idempotency layer,
that's a distinctly senior-sounding story and you already have the
idempotency code in this repo to make it real.

---

## 7. Other advanced additions worth layering in, roughly in priority order

- **GitOps (ArgoCD or Flux)**: once Terraform + Helm charts exist, deploy
  via Argo instead of `kubectl apply`/CI scripts. Practice a rollback via
  `argocd app rollback` and understand drift detection (someone
  `kubectl edit`s something by hand, Argo flags it).
- **Chaos engineering**: use this repo's own failure modes as chaos
  experiments instead of inventing generic ones, kill the Redis primary
  during a booking-lock acquisition and verify `withTransaction` behaves
  correctly, kill a worker mid-CSV-import chunk and verify the job state
  machine recovers cleanly. Purpose-built chaos experiments against known
  weak points are more valuable than generic "kill random pods" tooling.
- **Distributed tracing (OTel), finished this time**: you already have
  `otel.ts` in shared and it's listed as "in progress" in your own notes.
  Finish propagating trace context through the outbox → RabbitMQ →
  worker path specifically, this is the actual hard part of tracing async
  systems and most tutorials skip it because HTTP-only tracing is easy.
- **Secrets management (Vault, or cloud-native equivalents)**: replace the
  plaintext secret you found in `infra/k8s` with real dynamic secrets,
  practice a secret rotation without a restart.
- **Multi-region**: only after everything above is solid. Practice with
  Postgres logical replication to a second region for read-only
  fallback, and understand why active-active multi-region for a
  transactional booking system (double-booking risk across regions) is
  a much harder problem than most infra tutorials let on, this alone is a
  strong, honest talking point ("here's why we didn't do active-active").

---

## How to sequence this if you're doing it for interview prep specifically

If the goal is "sound credible in infra-heavy interviews soon" rather than
"build all of this for real," prioritize in this order: **Patroni failover
demo → Redis Streams rebuild of your SSE bridge → Terraform module for
your existing dev infra → KEDA-scaled CSV worker → one deliberately-caused
mesh-retry bug**. Those five give you five distinct, specific, defensible
stories using your own codebase instead of generic tutorial knowledge, which
reads very differently in a loop.