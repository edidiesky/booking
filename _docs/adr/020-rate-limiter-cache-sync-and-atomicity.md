# ADR-020: In-memory rule cache, Redis pub/sub sync, and Lua-script atomicity

## Status
Accepted

## Context
These three mechanisms work together, not independently: an in-memory rule
cache per gateway process, Redis pub/sub to keep those caches in sync,
and Lua scripts for the actual rate-limit check-and-consume operation.
The first two are a matched pair, one creates the problem the other
solves. The third solves a completely different correctness problem.

## Decision
1. In-memory `Map` per process, rule lookup is a synchronous in-process
   read, not a database/Redis round trip, on every request.
2. Rule changes publish a reload signal over Redis pub/sub to every
   instance; a periodic 60s poll runs alongside as a safety net.
3. Check-and-consume runs as one atomic Lua script inside Redis, not
   separate GET/compute/SET commands from the application.

## Rationale
in-memory: avoids per-request DB/Redis latency and Postgres load
proportional to traffic, not rule-change frequency

pub/sub: direct consequence of choosing in-memory + multiple instances,
without it a rule change (e.g. an emergency block mid-incident) only
takes effect on whichever instance polls next, up to 60s stale on
others. Poll kept because pub/sub is fire-and-forget, no delivery
guarantee, an instance disconnected at publish time misses it

Lua: check-and-consume must be one atomic unit or concurrent requests
race (both read "capacity available" before either writes back), same
correctness class as C2/A6's atomic UPDATE...RETURNING pattern already
used elsewhere in this project. Redis executes a Lua script as a single
indivisible unit, no interleaving possible

## Consequences
near-instant not instant rule propagation, one extra long-lived pub/sub
connection per instance, future algorithms must follow the same atomic-
script pattern or reintroduce the race

## Alternatives considered
no cache: rejected, per-request latency/DB load. No pub/sub: rejected,
worst-case staleness hits exactly when fast propagation matters most.
MULTI/EXEC instead of Lua: rejected, can't branch on a value read within
the same transaction, would need WATCH+optimistic-retry, slower under
contention and more complex than one Lua script