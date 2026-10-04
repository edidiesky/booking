import type Redis from "ioredis";

const KEY = (sessionId: string) => `presence:session:${sessionId}`;

/** Default online window; client should heartbeat more often than this */
const DEFAULT_TTL_SEC = 90;

export class PresenceRepository {
  constructor(
    private readonly redis: Redis,
    private readonly ttlSec: number = DEFAULT_TTL_SEC,
  ) {}

  async heartbeat(sessionId: string): Promise<void> {
    await this.redis.set(KEY(sessionId), "1", "EX", this.ttlSec);
  }

  async isOnline(sessionId: string): Promise<boolean> {
    const v = await this.redis.get(KEY(sessionId));
    return v !== null;
  }

  async markOffline(sessionId: string): Promise<void> {
    await this.redis.del(KEY(sessionId));
  }

  static key(sessionId: string): string {
    return KEY(sessionId);
  }

  static sessionIdFromKey(key: string): string | null {
    const prefix = "presence:session:";
    if (!key.startsWith(prefix)) return null;
    return key.slice(prefix.length) || null;
  }
}