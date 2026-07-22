import redisClient from "../config/redis";
import logger from "../utils/logger";


const CLAIM_SCRIPT = `
local due = redis.call('ZRANGEBYSCORE', KEYS[1], '-inf', ARGV[1], 'LIMIT', 0, ARGV[2])
if #due > 0 then
  redis.call('ZREM', KEYS[1], unpack(due))
end
return due
`;

export function createScheduleIndex(indexKey: string) {
  return {
    async add(member: string, dueAtMs: number): Promise<void> {
      await redisClient.zadd(indexKey, dueAtMs, member);
    },

    async remove(member: string): Promise<void> {
      await redisClient.zrem(indexKey, member);
    },

    async addMany(members: string[], dueAtMs: number): Promise<void> {
      if (members.length === 0) return;
      const pipeline = redisClient.pipeline();
      for (const m of members) pipeline.zadd(indexKey, dueAtMs, m);
      await pipeline.exec();
    },

    async has(member: string): Promise<boolean> {
      const score = await redisClient.zscore(indexKey, member);
      return score !== null;
    },

    // Pipelined batch existence check: N ZSCORE commands, 1 network round trip.
    async hasMany(members: string[]): Promise<Set<string>> {
      if (members.length === 0) return new Set();
      const pipeline = redisClient.pipeline();
      for (const m of members) pipeline.zscore(indexKey, m);
      const results = await pipeline.exec();
      const present = new Set<string>();
      results?.forEach((res, i) => {
        const [err, score] = res as [Error | null, string | null];
        if (!err && score !== null) present.add(members[i]);
      });
      return present;
    },

    async claimDue(nowMs: number, limit = 100): Promise<string[]> {
      try {
        return await redisClient.eval(CLAIM_SCRIPT, 1, indexKey, nowMs, limit) as string[];
      } catch (err) {
        logger.error("schedule_index_claim_failed", { event: "schedule_index_claim_failed", indexKey, error: (err as Error).message });
        return [];
      }
    },

    async count(): Promise<number> {
      return redisClient.zcard(indexKey);
    },
  };
}

const EXTEND_LOCK_SCRIPT = `
if redis.call('get', KEYS[1]) == ARGV[1] then
  return redis.call('expire', KEYS[1], ARGV[2])
else
  return 0
end`;

const RELEASE_LOCK_SCRIPT = `
if redis.call('get', KEYS[1]) == ARGV[1] then
  return redis.call('del', KEYS[1])
else
  return 0
end`;

export function createLockedScheduler(opts: {
  lockKey:      string;
  lockTtlSec:   number;
  tickMs:       number;
  serviceName:  string;
  onTick:       () => Promise<void>;
}): { start: () => void; stop: () => void } {
  let timer: NodeJS.Timeout | null = null;

  return {
    start(): void {
      if (timer) return;
      timer = setInterval(async () => {
        const token = `${process.pid}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
        const acquired = await redisClient.set(opts.lockKey, token, "EX", opts.lockTtlSec, "NX");
        if (!acquired) return;
        const renewMs = Math.max(1_000, Math.floor((opts.lockTtlSec * 1000) / 2));
        const renewTimer: NodeJS.Timeout = setInterval(async () => {
          try {
            const extended = await redisClient.eval(EXTEND_LOCK_SCRIPT, 1, opts.lockKey, token, opts.lockTtlSec);
            if (extended === 0) {
              logger.warn("scheduler_lock_lost", { event: "scheduler_lock_lost", service: opts.serviceName, lockKey: opts.lockKey });
            }
          } catch (err) {
            logger.error("scheduler_lock_renew_failed", { event: "scheduler_lock_renew_failed", service: opts.serviceName, lockKey: opts.lockKey, error: (err as Error).message });
          }
        }, renewMs);

        try {
          await opts.onTick();
        } catch (err) {
          logger.error("scheduler_tick_failed", { event: "scheduler_tick_failed", service: opts.serviceName, lockKey: opts.lockKey, error: (err as Error).message });
        } finally {
          clearInterval(renewTimer);
          try {
            await redisClient.eval(RELEASE_LOCK_SCRIPT, 1, opts.lockKey, token);
          } catch (err) {
            logger.error("scheduler_lock_release_failed", { event: "scheduler_lock_release_failed", service: opts.serviceName, lockKey: opts.lockKey, error: (err as Error).message });
          }
        }
      }, opts.tickMs);
      logger.info("scheduler_started", { event: "scheduler_started", service: opts.serviceName, lockKey: opts.lockKey, intervalMs: opts.tickMs });
    },
    stop(): void {
      if (timer) { clearInterval(timer); timer = null; }
    },
  };
}