import type { Request, Response, NextFunction } from "express";
import type Redis from "ioredis";
import { LimiterFactory, logger, type RateLimitEngine } from "@booking/shared";
import { resolveIdentity, getRealIp } from "../utils/identity";

const BLOCK_PREFIX = "rl:blocked:";

export function createRateLimitMiddleware(redis: Redis, engine: RateLimitEngine) {
  return async function rateLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
    const route = req.originalUrl.split("?")[0];

    if (route === "/health" || route === "/metrics") {
      next();
      return;
    }

    try {
      await redis.ping();
    } catch {
      logger.warn("rate_limit_redis_unavailable_failing_open", {
        event: "rate_limit_redis_unavailable_failing_open", route,
      });
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

    const rule = engine.match(identity.key, route, identity.userType);

    if (!rule.enabled) {
      next();
      return;
    }

    const limiter = LimiterFactory.create(redis, rule);
    const result = await limiter.consume(`${identity.key}:${rule.id}`);

    res.setHeader("X-RateLimit-Limit", rule.limit);
    res.setHeader("X-RateLimit-Remaining", result.remaining);

    if (!result.allowed) {
      const retryAfterSeconds = Math.ceil(result.retryAfterMs / 1000);
      res.setHeader("Retry-After", retryAfterSeconds);

      logger.warn("rate_limit_exceeded", {
        event: "rate_limit_exceeded", route, ruleId: rule.id, tier: rule.tier,
        identityKey: identity.key, isAuthenticated: identity.isAuthenticated,
        algorithm: rule.algorithm, retryAfterSeconds,
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