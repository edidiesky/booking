import type { Request, Response, NextFunction } from "express";
import type Redis from "ioredis";
import { LimiterFactory, logger, type RateLimitEngine } from "@booking/shared";
import { resolveIdentity, getRealIp } from "../utils/identity";

const BLOCK_PREFIX = "rl:blocked:";

const AUTH_PREFIXES = ["/api/v1/auth/login", "/api/v1/auth/register", "/api/v1/auth/request-reset"];

function normalizeRoute(req: Request): string {
  return (req.path || req.originalUrl.split("?")[0]).replace(/\/+$/, "") || "/";
}

export function createRateLimitMiddleware(redis: Redis, engine: RateLimitEngine) {
  return async function rateLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
    const route = normalizeRoute(req);

    if (route === "/health" || route === "/metrics") {
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
    const rule = engine.match(identity.key, route, identity.userType);

    if (!rule?.enabled) {
      next();
      return;
    }

    const limiter = LimiterFactory.create(redis, rule);
    const result = await limiter.consume(`${idType}:${identity.key}:${rule.id}`);

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