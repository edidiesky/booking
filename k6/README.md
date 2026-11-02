# Modular k6 suite — Bukking

## Layout

```
lib/           shared config, checks, thresholds
critical/      money, inventory, session, idempotency
hot/           high-QPS reads and chatty dashboard
overlap/       paths that are both critical and hot
scenarios/     multi-step journeys (compose critical steps)
```

## Env

| Variable | Purpose |
|----------|---------|
| `BASE_URL` | Gateway, default `http://localhost:8080` |
| `GUEST_TOKEN` | Guest JWT for booking/pay |
| `HOST_TOKEN` | Host JWT for dashboard/stats/escrow |
| `PROPERTY_ID` / `ROOM_TYPE_ID` | Seeded inventory |
| `CHECK_IN` / `CHECK_OUT` | ISO dates |
| `VUS` / `DURATION` | Load shape |
| `WEBHOOK_PATH` / `WEBHOOK_BODY` / `WEBHOOK_SIG` | PSP replay fixtures |
| `IDEMPOTENCY_KEY` | Optional fixed key for replay tests |

## Run one module

```bash
k6 run critical/01-booking-reserve.js
k6 run hot/01-property-search.js
k6 run overlap/01-reserve-pay-confirm.js
```

## Run phases

```bash
# Phase A — reads
k6 run hot/01-property-search.js && k6 run hot/02-property-detail.js && k6 run hot/03-availability-calendar.js

# Phase B — auth storm
k6 run overlap/03-login-storm.js

# Phase C — inventory contention
k6 run overlap/02-concurrent-reserves.js

# Phase D — money path
k6 run overlap/01-reserve-pay-confirm.js

# Phase E — webhook replay
k6 run overlap/04-webhook-replay.js
```
