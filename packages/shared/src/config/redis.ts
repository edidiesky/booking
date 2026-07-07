import Redis from "ioredis";
import logger from "../utils/logger";

const redisClient = new Redis({
  host:                 process.env.REDIS_HOST ?? "localhost",
  port:                 parseInt(process.env.REDIS_PORT ?? "6379", 10),
  password:             process.env.REDIS_PASSWORD,
  retryStrategy:        (times) => Math.min(times * 200, 5_000),
  maxRetriesPerRequest: 3,
  enableReadyCheck:     true,
});

redisClient.on("connect", () => logger.info("redis_connected", { event: "redis_connected" }));
redisClient.on("error",   (err) => logger.error("redis_error", { event: "redis_error", error: err.message }));
redisClient.on("close",   () => logger.warn("redis_closed", { event: "redis_closed" }));

export async function connectRedis(): Promise<void> {
  await redisClient.ping();
}

export default redisClient;