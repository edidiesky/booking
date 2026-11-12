import type { Request, Response, NextFunction } from "express";
import type Redis from "ioredis";
import { LimiterFactory, logger, type RateLimitEngine } from "@booking/shared";
import { resolveIdentity, getRealIp } from "../utils/identity";

const BLOCK_PREFIX = "rl:blocked:";

const AUTH_PREFIXES = [
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/request-reset",
];

/**
 * Routes that skip rate limiting entirely.
 * Add more via RATE_LIMIT_EXEMPT_PREFIXES="/api/v1/foo,/api/v1/bar"
 */
const EXEMPT_PREFIXES = [
  "/health",
  "/metrics",
  ...(process.env.RATE_LIMIT_EXEMPT_PREFIXES?.split(",")
    .map((p) => p.trim())
    .filter(Boolean) ?? []),
];

function normalizeRoute(req: Request): string {
  return (req.path || req.originalUrl.split("?")[0]).replace(/\/+$/, "") || "/";
}

function isExempt(route: string): boolean {
  return EXEMPT_PREFIXES.some((p) => route === p || route.startsWith(`${p}/`));
}

export function createRateLimitMiddleware(redis: Redis, engine: RateLimitEngine) {
  return async function rateLimit(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const route = normalizeRoute(req);

    if (isExempt(route)) {
      next();
      return;
    }

    let redisOk = true;
    try {
      await redis.ping();
    } catch {
      redisOk = false;
      logger.warn("rate_limit_redis_unavailable", {
        event: "rate_limit_redis_unavailable",
        route,
      });
    }

    const isSensitiveAuth = AUTH_PREFIXES.some((p) => route.startsWith(p));
    if (!redisOk) {
      // Fail closed on auth abuse paths; fail open elsewhere
      if (isSensitiveAuth) {
        res.status(503).json({ status: "error", error: "Service temporarily unavailable." });
        return;
      }
      next();
      return;
    }

    const identity = resolveIdentity(req);
    const ip = getRealIp(req);

    if (!identity.isAuthenticated) {
      const banned = await redis.get(`${BLOCK_PREFIX}${ip}`).catch(() => null);
      if (banned) {
        res.status(429).json({
          status: "error",
          error: "This IP has been temporarily blocked due to repeated abuse.",
        });
        return;
      }
    }

    const idType = identity.isAuthenticated ? "user_id" : "ip";

    // Set by subdomainResolver (which runs before this middleware)
    const tenantId = req.headers["x-tenant-id"] as string | undefined;

    // 1) Tenant-specific rule (idType "tenant", idValue = tenant id)
    let tenantRule: ReturnType<RateLimitEngine["match"]> | undefined;
    if (tenantId) {
      const candidate = engine.match(`tenant:${tenantId}`, route, identity.userType);
      // Only treat it as a tenant override if it really is a tenant rule,
      // so a global wildcard rule doesn't shadow user/IP-specific rules.
      if (candidate && (candidate as { idType?: string }).idType === "tenant") {
        tenantRule = candidate;
      }
    }

    // 2) Fall back to the normal user/IP rule
    const rule = tenantRule ?? engine.match(identity.key, route, identity.userType);

    if (!rule?.enabled) {
      next();
      return;
    }

    const limiter = LimiterFactory.create(redis, rule);

    // Tenant rules are counted per tenant + client, so one tenant's traffic
    // never eats another tenant's budget.
    const counterKey = tenantRule
      ? `tenant:${tenantId}:${idType}:${identity.key}:${rule.id}`
      : `${idType}:${identity.key}:${rule.id}`;

    const result = await limiter.consume(counterKey);

    res.setHeader("X-RateLimit-Limit", String(rule.limit));
    res.setHeader("X-RateLimit-Remaining", String(result.remaining));

    if (!result.allowed) {
      const retryAfterSeconds = Math.ceil(result.retryAfterMs / 1000);
      res.setHeader("Retry-After", String(retryAfterSeconds));
      logger.warn("rate_limit_exceeded", {
        event: "rate_limit_exceeded",
        route,
        ruleId: rule.id,
        idType,
        identityKey: identity.key,
        tenantId,
        scope: tenantRule ? "tenant" : "default",
        algorithm: rule.algorithm,
        retryAfterSeconds,
      });
      res.status(429).json({
        status: "error",
        error: "Too many requests.",
        retryAfter: retryAfterSeconds,
      });
      return;
    }

    next();
  };
}