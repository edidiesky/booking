# csv-room-import-worker

Bulk room-type import for hosts uploading a CSV instead of creating
room types one at a time through the dashboard UI.

## Status

Runs **in-process** inside `backend`, not as a separate container,
same real migration as the other 5 in-process workers. A RabbitMQ
consumer, started with backend's own shared connection:

```typescript
{ name: "csv_room_import_worker", fn: async () => {
    await startCsvRoomImportWorker(getRabbitMQConnection());
  },
},
```

No explicit shutdown step needed, its consumer closes naturally when
`disconnectRabbitMQ()` tears down the shared connection on backend
shutdown, matching the pattern the other RabbitMQ-based in-process
workers (seller-notification-worker, audit-worker) also use.

## What it does

Consumes a real event carrying an uploaded CSV's location, parses it,
and creates room types in bulk against the host's property. Real fix
worth knowing about if touching this code: it originally used
`node-fetch`, which is ESM-only and incompatible with this package's
CommonJS module target, causing real build/runtime failures. Fixed by
switching to Node 20's native, global `fetch()` instead of the
external dependency.

## Real, honest notes

- Depends on `csv-parse`, added to backend's own `package.json` as
  part of the in-process migration (backend didn't previously have
  it).
- Same real, unverified-build caveat as the other in-process workers:
  the deep package import was reasoned about as safe, not proven by
  an actual build and boot at migration time.