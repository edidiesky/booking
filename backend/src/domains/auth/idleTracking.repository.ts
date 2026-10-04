import type { Redis } from "ioredis";
import redisClient from "../../config/redis";

const KEY_PREFIX = "session-idle:";
const DEFAULT_IDLE_TIMEOUT_SEC = 30 * 60;

export class IdleTrackingRepository {
  constructor(
    private readonly redis: Redis,
    private readonly idleTimeoutSec: number,
  ) {}

  // Called exactly once, when the session row is created.
  async start(sessionId: string): Promise<void> {
    await this.redis.set(KEY_PREFIX + sessionId, "1", "EX", this.idleTimeoutSec);
  }

  async touchIfActive(sessionId: string): Promise<boolean> {
    const res = await this.redis.set(
      KEY_PREFIX + sessionId,
      "1",
      "EX",
      this.idleTimeoutSec,
      "XX",
    );
    return res === "OK";
  }

  async end(sessionId: string): Promise<void> {
    await this.redis.del(KEY_PREFIX + sessionId);
  }
}

const configured = Number(process.env.SESSION_IDLE_TIMEOUT_SEC);
const idleTimeoutSec =
  Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_IDLE_TIMEOUT_SEC;

export const idleTrackingRepository = new IdleTrackingRepository(
  redisClient,
  idleTimeoutSec,
);