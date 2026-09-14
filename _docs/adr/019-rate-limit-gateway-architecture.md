# ADR-019: Standalone rate-limit gateway architecture

## Status
Accepted

## Context
Rate limiting needs to protect all public-facing HTTP traffic.
Reusable Lua-script algorithm implementations, an in-memory rule engine
with Redis pub/sub reload are key ideas that will be implemented here. What needed a real decision was how this platform
specifically should be structured around that reusable core: as a
middleware each service mounts, or as its own process.

## Decision
Build a standalone gateway process. It fronts `backend` (the only
current public HTTP entry point), performs the rate-limit check, and
reverse-proxies (`http-proxy-middleware`, transparent passthrough) any
allowed request through. The reusable core, algorithms, engine,
repository, stays in `packages/shared`, consumed by the gateway process,
not duplicated into it.

Scope for this pass: REST/HTTP only. Socket.io connections are not
proxied through the gateway.

## Rationale
full reasoning on standalone-vs-middleware, reverse-proxy-vs-decide-only,
and REST-only-vs-WebSocket-proxying, as discussed

## Consequences
backend port exposure, new single point of failure, deferred per-event
socket limiting, Postgres/tier-mapping rewrite from the reference code

## Alternatives considered
middleware-in-service, decide-only gateway, WebSocket proxying