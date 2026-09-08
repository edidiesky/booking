# booking-expiry-worker

Expires bookings that were never paid for within their hold window, so
the room becomes available again instead of staying reserved
indefinitely against a payment that isn't coming.

## Status

Runs **in-process** inside `backend`, not as a separate container,
same real, stated reason as the other 5 migrated workers (Railway
compute budget). Started from `backend/src/server/bootstrap.ts`:

```typescript
{ name: "booking_expiry_worker", fn: async () => {
    startBookingExpiryScheduler();
    startBookingExpiryReconciliation();
  },
},
```

Both schedulers have real, exported stop functions
(`stopBookingExpiryScheduler`, `stopBookingExpiryReconciliation`)
called from `backend/src/server/shutdown.ts`.

## What it does

- **Expiry scheduler**: finds bookings sitting in `pending_payment`
  past their hold window and transitions them to an expired state,
  releasing the room back to availability.
- **Reconciliation pass**: a secondary, periodic correctness check for
  anything the primary scheduler's timing might have missed.

## Real, honest notes

- This is a scheduler-based worker, not a RabbitMQ consumer, no
  message queue involved.
- Part of the same real in-process migration as the other 5 workers:
  the deep package import path
  (`@booking/booking-expiry-worker/dist/scheduler`) was reasoned about
  as low-risk but never independently proven by an actual build and
  boot at the time of migration.