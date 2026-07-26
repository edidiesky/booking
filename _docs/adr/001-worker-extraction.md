# ADR: Isolated Worker Processes for Audit, Room Import, Campaign Sending, and Seller Notifications

## Status

Accepted. Implemented as four separate packages (audit-worker, csv-room-import-worker, campaign-worker, seller-notification-worker), each its own process, each consuming durable events off RabbitMQ.

## Context

The main API server (backend) has one job: answer HTTP requests fast and reliably. Creating a booking, confirming a payment, listing properties — these are on the critical path: the sequence of work between a user's request and a correct response, and every millisecond of it is felt directly. If that path is slow or the process crashes, the product is unusable, full stop.

All four features in this ADR are triggered *by* actions on that critical path, but none of them need to finish before the original request returns successfully:

- A booking gets confirmed. The booking itself is done. Logging that action to the audit trail and notifying the seller are both side effects of it, not part of it.
- A host uploads a CSV of room types. The upload itself is fast. Parsing, validating, and inserting potentially thousands of rows is not.
- A host sends a campaign. Triggering it is instant. Actually delivering to potentially thousands of recipients, rate-limited against external email/SMS providers, is a sustained, multi-minute operation.

We keep the critical path fast by stripping this work off of it entirely and moving it into an async flow. The question this ADR answers is narrower than that, though: given all three are side effects that don't belong on the critical path, why do they run in separate processes, rather than just running asynchronously (fire-and-forget, setImmediate, an unawaited promise) inside the same process that already handles HTTP traffic?

That distinction matters because "off the critical path" and "safe" are not the same claim. Fire-and-forget inside the same process gets the work off the latency path but leaves it fully exposed to the failure path — a crash, an event-loop stall, or a memory leak in that "background" code still takes down the process serving booking and payment traffic. This ADR is about closing that gap.

## Decision

Each of these four runs as its own process, decoupled from the API server by a durable queue (the transactional outbox pattern feeding RabbitMQ), not by an in-process async call. The queue boundary is what keeps a failure mode in any one of these four from becoming a failure mode of the API server itself.

## Why in-process async isn't enough, per feature

### 1. Audit logging

Failure mode: resource contention, not a single crash. Volume is the issue, not any one call's latency. auditRepository.log() is called from seven-plus domains (tenant, auth, profile, booking, payment, permission, role), on every significant mutation across the platform. Even as fire-and-forget, that's CPU and memory pressure landing on the same process serving the critical path, at a volume proportional to total platform activity, not any one feature's usage. As the platform grows, audit volume grows with it, independent of whether booking traffic grew at all — meaning the critical path can degrade for reasons that have nothing to do with critical-path traffic itself. Isolating it means audit load never competes with request-serving capacity, and it can be scaled independently of the API.

### 2. Room import (CSV)

Failure mode: event-loop starvation. This is bursty and potentially long-running in a way the other three aren't. A large CSV means real, sustained CPU time for parsing and per-row validation. Node is single-threaded for JS execution — async/await doesn't parallelize CPU-bound work, it only avoids blocking on I/O. Run that synchronously, or even unawaited in-process, and it still occupies the same event loop the API uses to serve every other request. A long enough parsing job is, functionally, the CSV import putting itself on the critical path of every other concurrent user, without ever intending to. There's also a hard correctness failure mode: an import job can run long enough to exceed HTTP request or load-balancer timeouts if forced into a request/response cycle at all. It has to be a background job by construction, not preference.

### 3. Campaign sending

The most extreme case, and the clearest argument for process isolation specifically, not just asynchrony.

- **Duration**: sending to thousands of recipients, rate-limited against external providers, is a sustained operation measured in minutes, not milliseconds. It is not a request-response shape at all.
- **Blast radius**: campaign sending has real failure modes an in-process fire-and-forget task doesn't protect against, a stuck provider call, a retry loop that doesn't back off correctly, a memory leak from holding a large recipient list in memory across a long-running loop. If that code runs in the same process as booking and payment handling, a bug in campaign sending can degrade or crash the very process responsible for revenue-critical traffic. In a separate process, the worst case is the campaign worker crashes and restarts, bookings and payments are entirely unaffected.
- **Independent scaling**: campaign volume and API request volume are unrelated. A large campaign send needs more worker throughput; it needs zero additional API server capacity. Bundling them means over-provisioning one to cover spikes in the other.

### 4. Seller notifications

Lower volume than audit (three trigger types: booking confirmed, checked in, checked out), but the same principle applies for a different reason: a booking's core transaction, the payment confirming, the escrow releasing, must never be able to fail or slow down *because* a notification side effect had a problem. Redis being briefly unavailable, or the notification worker being mid-restart, should be invisible to the booking flow. Putting notification delivery in a separate process makes that structurally true rather than something that has to be carefully guarded with try/catch in the booking code path (and hoped never gets missed at a future call site).

## The mechanism that makes this safe: durable queueing, not fire-and-forget

Process isolation contains failure modes from reaching the critical path, but it doesn't, by itself, prevent a different failure mode: silent data loss. If the main process just published to RabbitMQ directly and moved on, a message published right before a crash could be lost — a failure mode of the async flow itself.

What closes that gap is the transactional outbox pattern: the "this needs to happen" record is written to the outbox_events table in the same database transaction as the business action itself. Either both commit, or neither does. A separate poller relays outbox rows to RabbitMQ, and the relevant worker consumes them from a durable, ack-based queue.

So if the audit-worker, campaign-worker, or seller-notification-worker crashes, restarts, or is simply slow — no audit entry, campaign send, or notification is lost. It's picked up whenever the worker is next healthy, because the record already exists durably before the worker ever sees it. That durability guarantee, not process separation alone, is what makes it safe to take this work off the critical path at all.

## Consequences

**Positive:**
- The critical path's latency and reliability are unaffected by audit volume, import size, campaign scale, or notification delivery issues — none of those failure modes can reach it.
- Each worker scales independently, based on its own load, not tied to critical-path traffic.
- A bug or crash in any one worker has zero blast radius into the API server or the other three workers.
- Durable, at-least-once delivery via the outbox means none of this work is silently lost on a crash, restart, or deploy — the one failure mode process isolation alone doesn't solve.

**Negative, stated plainly, not glossed over:**
- More operational surface: four additional processes to deploy, monitor, and keep their dependencies (`package-lock.json`, workspace registration) in sync with the rest of the monorepo. This has already caused real build failures this session (missing workspace entries, stale lockfiles) and will recur any time a new worker package is added without the corresponding `npm install` + commit step.
- Eventual consistency, not immediate consistency. An audit entry, a sent campaign message, or a seller notification is not guaranteed to exist the instant the triggering action's HTTP response returns. Code (or a human) that queries `audit_logs` immediately after an action and expects to see it there will occasionally be wrong. This is the actual cost of "async," not a defect to chase down.
- Two near-duplicate `outboxPoller.ts` files currently exist in the codebase and must be kept manually in sync when a new event type is added (confirmed still true as of the audit-logging work, not resolved by this decision). This is pre-existing debt this ADR does not fix, only continues to build on top of.

## Alternatives considered

**A. One shared "background worker" process for all four.** Simpler to deploy, one thing instead of four. Rejected because it reintroduces blast radius between features that currently don't share fate: a bug or overload in campaign sending (the heaviest and riskiest of the four, given external provider dependencies and sustained runtime) would then also take down audit logging and seller notifications, the exact coupling this ADR exists to avoid.

**B. In-process async (fire-and-forget) for all four, no separate processes.** Lowest operational overhead. Rejected for the reasons above, per feature, primarily: shared fate with the API server on crash, shared CPU/event-loop contention under load, and no independent scaling. Notably, this is the compromise still in place today for PDF export (bookings/payments/rooms/tenants/escrow), kept in-process as a deliberate, time-boxed tradeoff rather than a considered long-term decision. It's the weakest link in this architecture's consistency and the first candidate to convert to a proper isolated worker if export volume or duration grows.

**C. Serverless functions per event type instead of long-running worker processes.** Not evaluated in depth; the existing RabbitMQ-based infrastructure and connection-pooling patterns already in place for other workers made continuing that pattern the lower-friction choice, not a rejection of serverless on technical merits.