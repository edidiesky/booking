import type Redis from "ioredis";
import { TokenBucketLimiter } from "./token-bucket.algorithm";
import { SlidingWindowLimiter } from "./sliding-window.algorithm";
import type { RateLimitRule, RateLimitResult } from "../types";

export interface Limiter {
  consume(key: string): Promise<RateLimitResult>;
}

const KEY_PREFIX = "rl:gateway";

export class LimiterFactory {
  static create(redis: Redis, rule: RateLimitRule): Limiter {
    switch (rule.algorithm) {
      case "token-bucket":
        return new TokenBucketLimiter(redis, {
          capacity: rule.limit,
          refillRate: rule.limit / (rule.windowMs / 1000),
          windowMs: rule.windowMs,
          keyPrefix: KEY_PREFIX,
        });
      case "sliding-window-log":
        return new SlidingWindowLimiter(redis, {
          limit: rule.limit,
          windowMs: rule.windowMs,
          keyPrefix: KEY_PREFIX,
        });
      default:
        throw new Error(`Unconfigured rate-limit algorithm: ${rule.algorithm satisfies never}`);
    }
  }
}