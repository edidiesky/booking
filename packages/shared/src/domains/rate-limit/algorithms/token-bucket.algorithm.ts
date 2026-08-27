import type Redis from "ioredis";
import type { RateLimitResult } from "../types";

const TOKEN_BUCKET_LUA = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refillRate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local ttl = tonumber(ARGV[4])

local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
local tokens = tonumber(bucket[1])
local lastRefill = tonumber(bucket[2])

if tokens == nil then
  tokens = capacity
  lastRefill = now
end

local elapsed = now - lastRefill
tokens = math.min(capacity, tokens + elapsed * refillRate)
lastRefill = now

if tokens >= 1 then
  tokens = tokens - 1
  redis.call('HSET', key, 'tokens', tokens, 'lastRefill', lastRefill)
  redis.call('PEXPIRE', key, ttl)
  return {1, math.floor(tokens), 0}
else
  local waitMs = math.ceil((1 - tokens) / refillRate)
  redis.call('HSET', key, 'tokens', tokens, 'lastRefill', lastRefill)
  redis.call('PEXPIRE', key, ttl)
  return {0, 0, waitMs}
end
`;

export interface TokenBucketConfig {
  capacity: number;
  refillRate: number; // tokens per second
  windowMs: number;
  keyPrefix: string;
}

export class TokenBucketLimiter {
  private scriptSha: string | null = null;

  constructor(
    private readonly redis: Redis,
    private readonly config: TokenBucketConfig,
  ) {}

  private async loadScript(): Promise<string> {
    if (this.scriptSha) return this.scriptSha;
    this.scriptSha = (await (this.redis as any).script("LOAD", TOKEN_BUCKET_LUA)) as string;
    return this.scriptSha;
  }

  async consume(key: string): Promise<RateLimitResult> {
    const redisKey = `${this.config.keyPrefix}:tb:${key}`;
    const now = Date.now();
    const refillRatePerMs = this.config.refillRate / 1000;
    const ttl = this.config.windowMs * 2;

    try {
      const sha = await this.loadScript();
      const result = (await (this.redis as any).evalsha(
        sha, 1, redisKey, this.config.capacity, refillRatePerMs, now, ttl,
      )) as [number, number, number];

      return {
        allowed: result[0] === 1,
        remaining: result[1],
        retryAfterMs: result[2],
        algorithm: "token-bucket",
      };
    } catch (err: any) {
      // NOSCRIPT: Redis restarted/flushed its script cache since we last
      // loaded, the sha is stale, reload once and retry, not a real error.
      if (err.message?.includes("NOSCRIPT")) {
        this.scriptSha = null;
        return this.consume(key);
      }
      throw err;
    }
  }
}