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

    async has(member: string): Promise<boolean> {
      const score = await redisClient.zscore(indexKey, member);
      return score !== null;
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
        const acquired = await redisClient.set(opts.lockKey, process.pid.toString(), "EX", opts.lockTtlSec, "NX");
        if (!acquired) return;
        try {
          await opts.onTick();
        } catch (err) {
          logger.error("scheduler_tick_failed", { event: "scheduler_tick_failed", service: opts.serviceName, lockKey: opts.lockKey, error: (err as Error).message });
        }
      }, opts.tickMs);
      logger.info("scheduler_started", { event: "scheduler_started", service: opts.serviceName, lockKey: opts.lockKey, intervalMs: opts.tickMs });
    },
    stop(): void {
      if (timer) { clearInterval(timer); timer = null; }
    },
  };
}