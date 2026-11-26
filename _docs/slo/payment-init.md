# SLO Card: Payment Initialization

Status: SLI defined. SLO target pending (Step 2). SLA pending (Step 3).

---

## Journey

A guest with a `pending_payment` booking clicks "Pay Now" on the booking
details page. The system creates a payment intent at the provider and
returns a redirect URL. The guest is then sent to the provider's checkout.

This card covers the **server side of that click**: from the moment the
request reaches the API until the redirect URL is returned in the response
body. It does NOT cover the provider checkout page, the guest's card entry,
or the webhook that arrives later. Those are separate journeys with
separate cards.

---

## SLI 1 — Payment init handler latency (MAIN SLI, alerting)

**Question it answers:** "Is the payment-init endpoint slow from the
caller's point of view, including the provider call?"

**Unit:** one `POST /api/v1/payments/initialize` request that reaches the
handler (i.e., passed auth, passed Joi validation, matched the route).

**Good event:** the handler completes and the response is written with a
server-side duration below `<threshold>` seconds.

**Valid event:** every request that reaches the handler, regardless of
outcome. 4xx responses (idempotency conflict, booking not found, gateway
rejection) are counted as valid events and are counted as *good* events
only if their duration is below threshold — a fast 4xx is not a latency
failure, but a slow 4xx is. This is deliberate: the SLI measures latency,
not success rate. Success rate is a separate SLI.

**Measurement point:** `res.on("finish")` in a route-scoped middleware,
registered after `validate(initPaymentSchema)` and before
`InitializePaymentHandler`. This means the timer starts after auth and
validation, and stops when the response is fully written. It includes:
- the controller's call into `paymentService.initializePayment`
- the saga HTTP call (when `WORKFLOW_DELEGATION` is enabled)
- the idempotency claim
- the DB transactions
- **the provider call (`adapter.process`)**
- the audit log and the `logger.info` on the hot path

It excludes: auth middleware, Joi validation, RLS middleware, and any
upstream gateway time. Those are covered by the broader HTTP SLI
(`booking_http_request_duration_seconds`) and are not this card's concern.

**Metric:** `booking_payment_init_handler_duration_seconds`
**Labels:** `gateway` (`paystack` | `flutterwave` | `unknown`), `status`
(`success` | `error`)
**Buckets (seconds):** `0.05, 0.1, 0.25, 0.5, 0.8, 1, 2.5, 5, 10`
(The `0.8` bucket exists specifically so an 800ms SLO threshold is
exactly computable, not interpolated.)

**Exclusions from the SLI (explicitly out of scope):**
- Requests rejected by `authenticate` (401) — they never reached the handler
- Requests rejected by `validate(initPaymentSchema)` (400) — they never
  reached the handler
- Requests rejected by `tenantMiddleware` / `rlsMiddleware`
- Health checks, metrics scrapes

These exclusions are recorded here because an SLI without explicit
exclusions is not a specification. The SRE Workbook's SLI worksheet
requires "what is a valid event" to be stated, not assumed.

## Querying this metric

The metric is scraped from `booking`'s internal `/metrics` endpoint on
`booking:4000`, reachable inside the `app-tier` network only. From the
host, query it with:

    docker exec booking curl -s http://localhost:4000/metrics | \
      grep booking_payment_init_handler_duration_seconds

Not `http://localhost:4000/metrics` from the host — `booking` has no
host port mapping, so that hits the wrong process. If Prometheus scrapes
this metric, its config must target `booking:4000`, not `localhost:4000`.

---

## SLI 2 — Payment intent correctness (CORRECTNESS SLI, alerting, zero budget)

**Question it answers:** "Did a single idempotency key ever produce more
than one payment row, or more than one provider intent?"

**Unit:** one distinct `x-idempotency-key` value presented to
`POST /api/v1/payments/initialize`.

**Good event:** exactly one `payments` row exists for that key, AND the
provider was called at most once for that key (proven by the outbox:
exactly one `payment.initiated` event per key, excluding legitimate
retries that return the cached response without calling the provider).

**Valid event:** every distinct `x-idempotency-key` presented.

**Target:** exactly `1.0`. This SLI has no error budget. A single
violation is a P1.

**Measurement point:** derived from the `payments` table and the
`outbox_events` table, queried periodically (not a live histogram).
The alert is: `count(distinct idempotency_key) != count(payments rows
grouped by idempotency_key)` over the last 24h.

**Metric (to be added):** `booking_payment_idempotency_violations_total`
A counter incremented whenever a violation is detected by the periodic
check. The check itself is a job, not a per-request timer.

**Labels:** `gateway`, `detection_method` (`multi_row` | `multi_intent`)

---

## Diagnostic metrics (NOT alerting targets, but on the same dashboard)

These exist so that when SLI 1 fires, the on-call engineer can answer
"is it us, or is it Paystack?" in under a minute. They do not have SLOs
and they do not page.

### D1 — DB-only latency

**Question:** "How much of the handler latency is our database?"
**Metric:** `booking_payment_init_db_duration_seconds{operation,status}`
**Wraps:** each `withTransaction` call inside `runPaymentInitLogic`,
individually. The provider call is NOT inside any `withTransaction`, so
it is excluded by construction.
**Buckets:** `0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5`
**Alerting:** No. Displayed on the payment-init Grafana row only.

### D2 — Provider-call latency

**Question:** "How much of the handler latency is Paystack/Flutterwave?"
**Metric:** `booking_payment_provider_duration_seconds{gateway,status}`
**Wraps:** `adapter.process(...)` only.
**Buckets:** `0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30`
**Alerting:** No. Displayed on the payment-init Grafana row, and used as
an input to a separate "provider health" review, not to paging.

### D3 — Saga-call latency (only when delegation is on)

**Question:** "How much of the handler latency is the orchestrator?"
**Metric:** `booking_payment_saga_call_duration_seconds{status}`
**Wraps:** `paymentOrchestrationClient.startBookingPaymentSaga(...)` only.
**Buckets:** `0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10`
**Alerting:** No.

---

## Why these three are diagnostic and not SLIs

Each of D1, D2, D3 measures a *cause*, not a *symptom*. A slow DB is a
cause; the symptom the user feels is a slow handler. Google SRE's
alerting guidance is to alert on symptoms and use causes for diagnosis.
Making D1, D2, or D3 into alerting SLOs would page an engineer for
something they cannot directly fix from the on-call chair (especially
D2 — the provider's latency is not under our control), which is exactly
the alert-fatigue failure mode the guidance warns against.

They stay on the same Grafana row as SLI 1 so the attribution happens by
looking, not by paging.

---

## What this card deliberately does NOT include

- SLO targets (Step 2)
- Error budgets (Step 2)
- SLA commitments (Step 3)
- The webhook / confirmation SLI (separate card, after idempotency work)
- The `GET /payments/booking/:id` read-path SLI (separate card)

Each of those is a later step. This card is only the SLI definitions for
the write path of payment init.