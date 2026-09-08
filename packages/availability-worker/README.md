# availability-worker

Keeps the availability calendar correct: sweeps expired holds/locks so
they don't permanently block a date range, and reconciles the
calendar's stored state against actual bookings to catch drift.

## Status

Runs **in-process** inside `backend`, not as a separate container.
Migrated there for a real, stated reason (Railway compute budget, one
process instead of seven), not the default architecture. Started from
`backend/src/server/bootstrap.ts`:

```typescript
{ name: "availability_worker", fn: async () => {
    await connectRedis();
    lockSweepScheduler.start();
    reconciliationScheduler.start();
  },
},
```

Stopped from `backend/src/server/shutdown.ts` via the same real,
exported scheduler objects.

## What it does

- **`lockSweepScheduler`**: periodically sweeps availability locks that
  have expired (a hold placed during checkout that was never converted
  into a real booking) and releases them, so the date range becomes
  bookable again rather than staying stuck.
- **`reconciliationScheduler`**: a periodic correctness pass, re-checks
  the availability calendar's stored state against the real bookings
  table to catch and correct any drift between the two.

## Real, honest notes

- This worker was never a RabbitMQ consumer, it's built entirely
  around interval-based scheduling, not event consumption.
- It used to run its own Prometheus metrics endpoint
  (`metricsServer.ts`). That endpoint was **dropped** during the
  in-process migration, real risk of a port conflict with backend's
  own metrics server if brought in-process without checking first.
  Its specific metrics (sweep counts, reconciliation drift found,
  etc.) are not currently exposed anywhere. Merging them into
  backend's existing metrics setup is real, undone work.
- Of the 6 migrated workers, this is the only one that was
  specifically checked for port-binding or singleton-state conflicts
  before being brought in-process. The other 5 were not individually
  verified the same way.