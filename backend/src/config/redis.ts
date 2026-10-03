import Redis from "ioredis";
import logger from "../utils/logger";

function createRedisOptions() {
  return {
    host: process.env.REDIS_HOST ?? "localhost",
    port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times: number) => Math.min(times * 200, 5_000),
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
  };
}

const redisClient = new Redis(createRedisOptions());

redisClient.on("connect", () =>
  logger.info("redis_connected", { event: "redis_connected" }),
);
redisClient.on("error", (err) =>
  logger.error("redis_error", { event: "redis_error", error: err.message }),
);
redisClient.on("close", () =>
  logger.warn("redis_closed", { event: "redis_closed" }),
);

export default redisClient;

/**
 * Dedicated subscriber connection.
 * ioredis: after SUBSCRIBE, this connection must not run GET/SET.
 * a subscriber rejects all other commands except: subscribe, unsubscribe, ping, quit
 */
export function createRedisSubscriber(): Redis {
  const sub = new Redis({
    ...createRedisOptions(),
    maxRetriesPerRequest: null, // required for subscriber mode
  });
  sub.on("error", (err) =>
    logger.error("redis_subscriber_error", {
      event: "redis_subscriber_error",
      error: err.message,
    }),
  );
  return sub;
}