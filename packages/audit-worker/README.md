# audit-worker

Consumes `audit.log.requested` events and writes rows to the older
`audit_logs` table.

## Status

Runs **in-process** inside `backend`, not as a separate container,
same real migration as the other 5 in-process workers. A RabbitMQ
consumer:

```typescript
{ name: "audit_worker", fn: async () => {
    await startAuditWorker(getRabbitMQConnection());
  },
},
```

## What it does

Listens for `audit.log.requested` messages published onto RabbitMQ
and writes the corresponding row into `audit_logs`, an
asynchronous, fire-and-forget audit trail.

## Real, honest note: this is not the primary audit system anymore

A separate, richer, **structured** audit system (`audit_events`,
modeled on the auditlog.dev pattern: real actor/action/target/before-
after/outcome fields, a filterable audit-log UI) was built directly
into each domain service. That system writes **synchronously, inside
the same database transaction** as the action it's recording
(role assignment, permission changes, tenant registration, profile
updates, and more), not via a queued event this worker consumes.

That means most of the meaningful, structured audit trail in this
platform bypasses `audit-worker` entirely. This worker and the
`audit_logs` table it writes to are the older, simpler, best-effort
system, largely superseded, not removed, still consuming real events
from call sites that haven't been migrated to the newer system yet.
Whether `audit_logs`/`audit-worker` should eventually be retired
entirely once every domain uses `audit_events` is a real, open
question, not settled here.