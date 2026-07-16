# ADR 009: Booking Expiry Scheduling Moves from RabbitMQ TTL+DLX to Redis Sorted Set

**Status**: Approved
**Date**: 2026-07-11

## Context

`booking-expiry-worker` currently schedules each booking's 30-minute payment-window expiry via RabbitMQ per-message TTL plus a dead-letter-exchange (ADR 003). `availability-worker`'s lock sweep and reconciliation sweep currently use a self-perpetuating RabbitMQ tick built from the same TTL+DLX primitive (ADR 004).

Both were directly implicated in a real, multi-hour production debugging session this project already went through: `sweep.lock.delay.queue` and `sweep.reconcile.delay.queue` became permanently stuck at 3 messages each, never dead-lettering, root-caused to RabbitMQ's **immutable queue arguments**. Once a queue is declared with a given `x-dead-letter-exchange`/`x-dead-letter-routing-key` pair, re-asserting that queue with different arguments on a later boot either silently no-ops (keeping stale, wrong routing) or fails outright, and the only recovery is manually deleting the queue via `rabbitmqctl delete_queue`. This is not a one-off misconfiguration, it is a structural fragility inherent to the TTL+DLX pattern itself: any future change to queue arguments during iterative development risks silently breaking the entire delayed-message chain with no error surfaced anywhere in application logs.

A reference implementation was reviewed showing an alternative: a Redis sorted set as a schedule index, scored by due-timestamp, claimed by a `setInterval` tick guarded by a Redis `SET NX EX` distributed lock (so exactly one replica's tick fires per interval regardless of replica count), paired with a periodic reconciliation pass that detects and repairs any item that should be scheduled but is missing from the index.

## Decision

Replace RabbitMQ TTL+DLX scheduling with the Redis sorted set pattern for both `booking-expiry-worker` and `availability-worker`'s lock sweep. `ZADD` with `bookingId`/`roomTypeId` as member and expiry epoch as score gives a native priority queue with zero risk of immutable-argument drift, since a sorted set has no schema to declare or mismatch against. Claiming due items uses `ZRANGEBYSCORE` bounded by `now()`, followed by `ZREM` on successfully processed members, atomic per-member via a Lua script or `MULTI`/`EXEC` to avoid a second replica double-claiming between the range query and the removal.

`expirySetup.ts`, `recurringTick.ts`, and their RabbitMQ exchange/queue topology are removed entirely for these two workers, not adapted. RabbitMQ remains the transport for genuine pub/sub domain events (`booking.confirmed`, `payment.confirmed`, etc, unchanged, ADR 001/002 stand), it is simply no longer used as a delayed-scheduling primitive.

## Reconciliation, the self-healing half of this pattern

Both workers gain a periodic reconciliation pass (5-minute interval, matching the existing `reconciliationSweep` cadence) that queries Postgres directly for items that *should* be in the Redis schedule index (bookings still `pending_payment` past their expected expiry, active `booking_locks` past their TTL) but are absent from it, and re-adds them. This closes the gap a lost or evicted Redis key would otherwise leave permanently unhandled, with a Prometheus counter (`booking_expiry_reconciliation_repairs_total`, `availability_lock_reconciliation_repairs_total`) tracking how often repair actually fires, which should read zero in steady state and is the correct signal to alert on if it isn't.

## Consequences

**Positive**: eliminates the entire class of bug already spent significant debugging time on. Simpler mental model, one Redis data structure instead of two RabbitMQ exchanges, two queues, and a self-perpetuating message chain. Self-healing via reconciliation instead of a permanently stuck state requiring manual `rabbitmqctl` intervention.

**Negative**: this is a genuine rewrite of two workers' scheduling core, not a patch. `expirySetup.ts` and `recurringTick.ts` are deleted, not modified. Requires careful attention to the claim-then-remove atomicity to avoid the exact double-processing race this pattern is meant to prevent.

**Unchanged**: `csv-room-import-worker` and `events-worker` are unaffected, they were never using TTL+DLX scheduling, this ADR is scoped to the two workers that were.