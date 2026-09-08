# seller-notification-worker

Notifies a host in-app when something happens on one of their
bookings: confirmed, checked in, checked out.

## Status

Runs **in-process** inside `backend`, not as a separate container,
same real migration as the other 5 in-process workers. A RabbitMQ
consumer:

```typescript
{ name: "seller_notification_worker", fn: async () => {
    await startSellerNotificationWorker(getRabbitMQConnection());
  },
},
```

## What it does

Consumes `notify.booking.confirmed`, `notify.booking.checkin`, and
`notify.booking.checkout`. For each, it writes a row to
`seller_notifications` and pushes it to the host in real time over
SSE (the same real-time fanout backend's own `sseFanoutWorker`
provides).

## Real, honest, confirmed gap, not fixed in this worker

This worker only ever creates **in-app** notifications. It has no
email-sending capability at all, no template rendering, no dispatcher
call, confirmed directly by reading its source, not assumed. A host
gets a bell-icon notification and nothing else from this path.

The real email a host receives when a payment succeeds is sent from a
completely different place: `backend/src/infra/handlers/
payment-confirmed.handler.ts`, which already sent a guest receipt
email and was extended to also send the host a separate,
payment-specific email. That handler is not part of this worker
package at all, it lives in backend's own notification-handler
system, which has real email infrastructure (`getDispatcher()`,
Handlebars templates) that this worker's own package was never given
access to as a separate deployable.

If a host-facing email is ever needed for `booking.confirmed`/
`checkin`/`checkout` specifically (rather than payment success), it
would need to be built the same way, in backend's own handler system,
not by adding email capability to this package.