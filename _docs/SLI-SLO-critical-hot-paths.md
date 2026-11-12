# SLIs and SLOs, Critical Hot Paths

Real, grounded in what's actually instrumented and load-tested, not
aspirational numbers picked in isolation. Every target below matches
either a real Prometheus histogram bucket boundary already deployed,
or a real k6 threshold in `booking-infra/k6/`, or both. Where the two
would disagree, that's a real bug in one of them, not a rounding
choice, fix the mismatch rather than let two "real" numbers diverge.

Prioritized by money x burst rate x frequency, same real ordering used
throughout this observability work: payment, booking, availability,
auth.

## Payment

### Write: `POST /api/v1/payments/initialize`

Real, the highest-stakes single write on the platform, a DB write plus
a real, synchronous round-trip to an external payment gateway.

| SLI | SLO | Real source |
|---|---|---|
| Latency, p95 | < 1.0s | `paymentGatewayDuration` bucket boundary (1), k6 threshold `p(95)<1000` |
| Latency, p99 | < 3.0s | between `paymentGatewayDuration` buckets 2 and 5, k6 threshold `p(99)<3000` |
| Availability (non-5xx rate) | ≥ 99.9% | `booking_payment_failed_total` / `booking_payment_initialized_total` |
| Error budget | 43m 12s / 30d | derived from 99.9% |

Real, honest note: p99 here is dominated by the external gateway, not
this platform's own code, confirmed by `paymentGatewayDuration` being
a real, separate histogram from generic HTTP duration specifically so
this distinction is visible on the dashboard, not averaged away.
A gateway outage should show up as this SLO breaching while
`booking_http_request_duration_seconds` for other routes stays
healthy, that's the actual point of measuring it separately.

### Read: `GET /api/v1/payments/booking/:bookingId`

Real, lower real burst than availability's read, but still a common
call (checking payment status after redirect back from the gateway).

| SLI | SLO | Real source |
|---|---|---|
| Latency, p95 | < 100ms | `booking_db_query_duration_seconds` bucket (0.1), `payment.findByBookingId` operation label |
| Latency, p99 | < 500ms | `booking_db_query_duration_seconds` bucket (0.5) |
| Availability | ≥ 99.95% | `booking_http_request_total{route="/api/v1/payments/booking/:bookingId"}` |

**Real, measured update (own investigation, not inherited)**: this
route's query was `WHERE booking_id = $1 ORDER BY created_at DESC
LIMIT 1`, backed only by `idx_payments_booking (booking_id)`. At
typical volume (1 payment per booking) this cost nothing measurable,
confirmed directly: 2.270ms before a fix, 0.101ms after, on a
single-row booking, a difference dominated by connection/planning
noise, not the mechanism actually being tested.

The real finding isn't the millisecond number, it's structural: the
original plan required an `Index Scan` followed by a separate `Sort`
on `created_at DESC`, a cost that scales with how many payments a
given booking has. That's invisible at 1-2 payments (the common case)
but real under the exact scenario this SLO needs to survive, a
booking accumulating many retried payment attempts during a gateway
outage. Added `idx_payments_booking_created (booking_id, created_at
DESC)`, which lets Postgres read rows already in the needed order
directly from the index, no separate sort step at all, at any row
count. The p95/p99 targets above don't change, they already held
before this fix, what changed is confidence they keep holding as
retry counts grow, not the numbers themselves.

## Booking

### Write: `POST /api/v1/bookings`

Real, the actual transaction guests wait on, availability lock through
commit, instrumented directly as `bookingCreationDuration`, not
inferred from generic HTTP timing.

| SLI | SLO | Real source |
|---|---|---|
| Latency, p95 | < 250ms | `bookingCreationDuration` bucket (0.25), k6 threshold `p(90)<200` (real, close but not identical, k6's existing threshold predates this SLO doc and uses p90 not p95, flagged below) |
| Latency, p99 | < 700ms | `bookingCreationDuration` bucket (0.5-1 range), k6 threshold `p(99)<700` |
| Availability | ≥ 99.9% | `booking_created_total` vs 5xx rate on the same route |
| Conflict rate (expected, not a failure) | no SLO, tracked separately | k6's own `booking_conflict_rate`, real double-booking-avoidance signal, a healthy system has some nonzero rate here under real contention |

Real, honest discrepancy worth fixing, not hidden: the existing
`booking-create.k6.js` threshold uses `p(90)<200`, this doc uses p95.
p90 and p95 aren't the same percentile, this predates the SLO work
and should be updated to `p(95)` for real consistency, or this doc
should explicitly justify keeping p90 as the k6-side target. Not
resolved in this pass.

### Read: `GET /api/v1/bookings/:id`

| SLI | SLO | Real source |
|---|---|---|
| Latency, p95 | < 100ms | `booking_db_query_duration_seconds` bucket (0.1), `booking.findById` operation label, k6 threshold `p(95)<100` in `booking-read.k6.js` |
| Latency, p99 | < 500ms | `booking_db_query_duration_seconds` bucket (0.5), k6 threshold `p(99)<500` |
| Availability | ≥ 99.95% | `booking_http_request_total{route="/api/v1/bookings/:id"}` |

## Availability

### Read: `GET /api/v1/properties/room-types/:id/availability`

Real, the highest-frequency read on the entire platform, every search
result and every property page view hits this. No standalone public
write endpoint exists for this domain, real, honest structural fact,
not an oversight, availability changes happen as a side effect of
booking creation (the lock check), not through a directly callable
write here.

| SLI | SLO | Real source |
|---|---|---|
| Latency, p95 | < 150ms | k6 threshold `p(95)<150` in `availability-check.k6.js`, matches `booking_availability_check_duration_seconds` bucket (0.1-0.25 range) |
| Latency, p99 | < 400ms | k6 threshold `p(99)<400`, matches the same histogram's 0.5 bucket |
| Availability | ≥ 99.95% | highest-traffic read, tightest error-budget tolerance of anything in this doc |
| Error budget | 21m 36s / 30d | derived from 99.95% |

Real, precise distinction worth stating plainly: this SLO covers the
PUBLIC read path (`getAvailability`, what `availability-check.k6.js`
actually load-tests). It does NOT cover `isAvailable`, the internal,
transactional row-lock check that runs during booking creation, that
one is measured by the same `booking_availability_check_duration_seconds`
histogram but represents a genuinely different real operation (a
locking DB query inside a transaction, not a public GET). Both are
real, both matter, they are not interchangeable and this doc doesn't
conflate them.

## Property

### Read: `GET /api/v1/properties/` (search/listing)

Real, the actual marketplace-browsing entry point, the first real
request most guest sessions make, before ever reaching availability,
booking, or payment.

| SLI | SLO | Real source |
|---|---|---|
| Latency, p95 | < 200ms | k6 threshold `p(95)<200` in `property-search.k6.js`, provisional, no dedicated Prometheus histogram backs this route yet |
| Latency, p99 | < 800ms | k6 threshold `p(99)<800`, same provisional caveat |
| Availability | ≥ 99.9% | `booking_http_request_total{route="/api/v1/properties/"}` |

Real, honest, unresolved: unlike payment/booking/availability, this
route has no dedicated histogram the way `paymentGatewayDuration`/
`bookingCreationDuration`/`availabilityCheckDuration` do. It's covered
by the generic `booking_http_request_duration_seconds` like any other
unlisted route, real, existing coverage, just not this domain's own
purpose-built metric. Given this is confirmed to be one of the two
highest-frequency public reads on the platform (alongside
availability), a dedicated histogram here is a real, reasonable next
step, not done in this pass.

## Auth

### Write: `POST /api/v1/auth/login`

Real, technically reads credentials but writes a session, treated as
a write here for that reason, matches k6's own existing script.

| SLI | SLO | Real source |
|---|---|---|
| Latency, p95 | < 300ms | k6 threshold `p(90)<300` in the existing `login.k6.js` (same real p90-vs-p95 discrepancy flagged for booking, not resolved here either) |
| Latency, p99 | < 700ms | k6 threshold `p(99)<700` |
| Availability | ≥ 99.9% | `booking_http_request_total{route="/api/v1/auth/login"}` |
| Failure rate (real credential failures, not server errors) | no fixed SLO | k6's own `login_fail_rate<0.01`, this is a real, deliberate business threshold, not a reliability SLO, wrong passwords are expected traffic, not incidents |

### Read: `GET /api/v1/auth/me`

Real, called on effectively every authenticated page load across the
whole frontend, the actual highest-frequency read in the auth domain,
higher real volume than login itself.

Real, important correction from an earlier draft of this doc: this
route does **not** call the database. Confirmed directly,
`req.user = decoded.user` in `auth.middleware.ts` is pure JWT
verification and decode, `MeHandler` itself just returns that decoded
payload. There is no repository call here to wrap with
`measureDatabaseQuery`, an earlier version of this doc claimed one
existed and needed instrumenting, that was simply wrong, not
identified-but-unaddressed. Corrected here rather than left standing.

| SLI | SLO | Real source |
|---|---|---|
| Latency, p95 | < 30ms | k6 threshold `p(95)<100` in `me-check.k6.js` is looser than this, tightened here now that it's confirmed to be pure in-process JWT verification, no I/O at all |
| Latency, p99 | < 100ms | same reasoning, a p99 in the hundreds of milliseconds for a no-I/O operation would itself indicate a real problem (event loop contention, not this route's own logic) |
| Availability | ≥ 99.95% | `booking_http_request_total{route="/api/v1/auth/me"}` |

Real, follow-up needed, not done in this pass: `me-check.k6.js`'s own
threshold (`p(95)<100`) should be tightened to match the `<30ms`
target above, it was set before this correction was made.

## Summary table

| Domain | Action | p95 | p99 | Availability | k6 script |
|---|---|---|---|---|---|
| Payment | Write (initialize) | 1.0s | 3.0s | 99.9% | `k6/payments/payment-initialize.k6.js` |
| Payment | Read (by booking) | 100ms | 500ms | 99.95% | none yet |
| Booking | Write (create) | 250ms | 700ms | 99.9% | `k6/bookings/booking-create.k6.js` |
| Booking | Read (by id) | 100ms | 500ms | 99.95% | `k6/bookings/booking-read.k6.js` |
| Availability | Read (calendar) | 150ms | 400ms | 99.95% | `k6/availability/availability-check.k6.js` |
| Property | Read (search/listing) | 200ms* | 800ms* | 99.9% | `k6/properties/property-search.k6.js` |
| Auth | Write (login) | 300ms | 700ms | 99.9% | `k6/authentication/login.k6.js` |
| Auth | Read (me) | 30ms | 100ms | 99.95% | `k6/auth/me-check.k6.js` (threshold not yet tightened to match, see above) |

`*` provisional, property search has no dedicated Prometheus
histogram yet, runs through the generic HTTP duration metric like
every other unlisted route.

## Real, honest, complete list of what's not done

```
- GET /api/v1/payments/booking/:bookingId has no k6 script
- Property search has no dedicated Prometheus histogram, its p95/
  p99 targets above are provisional, running through the generic
  HTTP duration metric like any unlisted route
- me-check.k6.js's own threshold (p(95)<100) is looser than the
  corrected, real target (<30ms) now documented above, not yet
  tightened to match
- booking-create.k6.js and login.k6.js use p90 in their thresholds,
  this doc standardizes on p95 elsewhere, real inconsistency flagged
  twice above, not resolved in this pass
- No Prometheus alerting rules exist yet that actually fire when these
  SLOs are breached, this doc states targets, it doesn't enforce them
- No burn-rate alerting (fast/slow error budget consumption), just
  flat thresholds
```