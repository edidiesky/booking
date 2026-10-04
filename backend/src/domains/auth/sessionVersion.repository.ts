import type { Redis } from "ioredis";
import redisClient from "../../config/redis";

const KEY_PREFIX = "session-version:";

export class SessionVersionRepository {
  constructor(private readonly redis: Redis) {}

  async get(userId: string): Promise<number> {
    const raw = await this.redis.get(KEY_PREFIX + userId);
    return raw ? parseInt(raw, 10) : 0;
  }

  async bump(userId: string): Promise<void> {
    await this.redis.incr(KEY_PREFIX + userId);
  }
}

export const sessionVersionRepository = new SessionVersionRepository(redisClient);
