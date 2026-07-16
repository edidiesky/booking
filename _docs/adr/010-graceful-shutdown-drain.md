# ADR 010: Graceful Shutdown Must Drain In-Flight Work Before Disconnecting

**Status**: Approved
**Date**: 2026-07-11

## Context

Every `shutdown.ts` built across this project's five worker processes (`booking-expiry-worker`, `csv-room-import-worker`, `availability-worker`, `events-worker`, and the API's own bootstrap-adjacent shutdown path) follows the same shape: on `SIGTERM`, immediately call `disconnectRabbitMQ()`, `disconnectDB()`, `redisClient.quit()`, then `process.exit(0)`, guarded by a hard timeout. None of them stop consuming new messages first, and none of them wait for whatever handler is currently mid-execution to actually finish.

This means a container orchestrator's rolling deploy or scale-down can sever a RabbitMQ channel out from under a handler that is, for example, mid-way through generating a PDF receipt or writing a booking-confirmed notification record, the handler is not given the chance to `ack` or `nack` cleanly, its work is simply abandoned. Depending on timing, this can produce a message that is neither acknowledged nor properly retried, an inconsistent intermediate state, or a duplicate on redelivery if the broker considers the message still outstanding.

## Decision

Every worker's shutdown sequence follows this order, without exception:

1. **Stop consuming.** Cancel every active consumer tag so RabbitMQ stops delivering new messages immediately. Whatever is already in-flight keeps running.
2. **Drain.** Poll an in-flight counter (incremented on message receipt, decremented in a `finally` block after `ack`/`nack`) until it reaches zero or a drain deadline elapses, whichever comes first. In-flight handlers complete and acknowledge normally during this window.
3. **Stop schedulers.** Any `setInterval`-based background loop (the Redis sorted-set scheduler and reconciliation pass from ADR 009, the outbox poller) is stopped only after the drain completes, not before, since a handler mid-execution may itself depend on one of these still running correctly.
4. **Disconnect**, in order: database, RabbitMQ, Redis. Each step's failure is logged but does not block the next step from attempting.
5. **Exit 0.**

A hard ceiling timeout (default 15 seconds) wraps the entire sequence, forcing `process.exit(1)` if any step hangs, so a stuck drain can never prevent the container from eventually terminating within the orchestrator's own grace period.

## Consequences

**Positive**: no more silently abandoned in-flight work on deploy or scale-down. This is the single highest-value correctness fix in this rebrand pass, it affects every worker uniformly and closes a real gap that existed in every shutdown implementation built so far, not a hypothetical one.

**Negative**: shutdown now takes measurably longer under load (bounded by the drain deadline, not instant), acceptable and correct, an instant shutdown that abandons work was never actually fast, it just moved the cost to an inconsistent downstream state instead of a slightly slower, complete one.

**Applies to**: `booking-expiry-worker`, `csv-room-import-worker`, `availability-worker`, `events-worker`. The API process (`backend/`) gets the equivalent treatment for its own HTTP-server shutdown (stop accepting new connections, wait for in-flight requests, then disconnect), same principle, different transport.