import type amqp from "amqplib";
import { redisClient, logger } from "@booking/shared";

interface RecurringTickConfig {
  name: string;
  delayExchange: string;
  deadExchange: string;
  delayQueue: string;
  processQueue: string;
  intervalMs: number;
}

export async function setupRecurringTick(
  channel: amqp.Channel,
  cfg: RecurringTickConfig,
  onTick: () => Promise<void>,
): Promise<void> {
  await channel.assertExchange(cfg.delayExchange, "direct", { durable: true });
  await channel.assertExchange(cfg.deadExchange, "direct", { durable: true });

  await channel.assertQueue(cfg.delayQueue, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": cfg.deadExchange,
      "x-dead-letter-routing-key": "tick",
    },
  });
  await channel.bindQueue(cfg.delayQueue, cfg.delayExchange, "tick");

  await channel.assertQueue(cfg.processQueue, { durable: true });
  await channel.bindQueue(cfg.processQueue, cfg.deadExchange, "tick");

  const scheduleNext = () => {
    channel.publish(cfg.delayExchange, "tick", Buffer.from("{}"), {
      expiration: String(cfg.intervalMs),
      persistent: true,
    });
  };

  const seedKey = `recurring_tick_seeded:${cfg.name}`;
  const seeded = await redisClient.set(seedKey, "1", "NX");
  if (seeded) {
    scheduleNext();
    logger.info("recurring_tick_seeded", {
      event: "recurring_tick_seeded",
      name: cfg.name,
      intervalMs: cfg.intervalMs,
    });
  }

  channel.consume(
    cfg.processQueue,
    async (msg) => {
      if (!msg) return;
      try {
        await onTick();
      } catch (err) {
        logger.error("recurring_tick_failed", {
          event: "recurring_tick_failed",
          name: cfg.name,
          error: (err as Error).message,
        });
      } finally {
        scheduleNext();
        channel.ack(msg);
      }
    },
    { noAck: false },
  );
}
