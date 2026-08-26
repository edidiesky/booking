import type Redis from "ioredis";
import { randomUUID } from "crypto";
import type { RateLimitResult } from "../types";

const SLIDING_WINDOW_LUA = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local requestId = ARGV[4]
local windowStart = now - windowMs

redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)
local count = redis.call('ZCARD', key)

if count < limit then
  redis.call('ZADD', key, now, requestId)
  redis.call('PEXPIRE', key, windowMs)
  local remaining = limit - count - 1
  return {1, remaining, 0}
else
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local retryAfterMs = 0
  if oldest[2] then
    retryAfterMs = math.ceil(tonumber(oldest[2]) + windowMs - now)
  end
  redis.call('PEXPIRE', key, windowMs)
  return {0, 0, retryAfterMs}
end
`;

export interface SlidingWindowConfig {
  limit: number;
  windowMs: number;
  keyPrefix: string;
}

export class SlidingWindowLimiter {
  private scriptSha: string | null = null;

  constructor(
    private readonly redis: Redis,
    private readonly config: SlidingWindowConfig,
  ) {}

  private async loadScript(): Promise<string> {
    if (this.scriptSha) return this.scriptSha;
    this.scriptSha = (await (this.redis as any).script("LOAD", SLIDING_WINDOW_LUA)) as string;
    return this.scriptSha;
  }

  async consume(key: string): Promise<RateLimitResult> {
    const redisKey = `${this.config.keyPrefix}:swl:${key}`;
    const now = Date.now();
    const requestId = randomUUID();

    try {
      const sha = await this.loadScript();
      const result = (await (this.redis as any).evalsha(
        sha, 1, redisKey, now, this.config.windowMs, this.config.limit, requestId,
      )) as [number, number, number];

      return {
        allowed: result[0] === 1,
        remaining: result[1],
        retryAfterMs: result[2],
        algorithm: "sliding-window-log",
      };
    } catch (err: any) {
      if (err.message?.includes("NOSCRIPT")) {
        this.scriptSha = null;
        return this.consume(key);
      }
      throw err;
    }
  }
}