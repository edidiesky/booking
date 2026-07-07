import redisClient from "../../config/redis";
import { getRabbitMQChannel } from "../../config/rabbitmq";
import logger from "../../utils/logger";
import type { JobProgress } from "./job.types";

const JOB_STATE_TTL_SEC = 24 * 60 * 60;

const stateKey = (jobType: string, jobId: string) => `job:${jobType}:${jobId}`;
const progressChannel = (jobType: string, jobId: string) =>
  `job:progress:${jobType}:${jobId}`;

export const jobRepository = {
  async setState<T>(
    jobType: string,
    jobId: string,
    payload: JobProgress<T>,
  ): Promise<void> {
    await redisClient.set(
      stateKey(jobType, jobId),
      JSON.stringify(payload),
      "EX",
      JOB_STATE_TTL_SEC,
    );
    await redisClient.publish(
      progressChannel(jobType, jobId),
      JSON.stringify(payload),
    );
  },

  async getState<T>(
    jobType: string,
    jobId: string,
  ): Promise<JobProgress<T> | null> {
    const raw = await redisClient.get(stateKey(jobType, jobId));
    return raw ? JSON.parse(raw) : null;
  },

  async subscribe<T>(
    jobType: string,
    jobId: string,
    onMessage: (payload: JobProgress<T>) => void,
  ): Promise<() => Promise<void>> {
    const sub = redisClient.duplicate();
    const ch = progressChannel(jobType, jobId);

    await sub.subscribe(ch);
    sub.on("message", (receivedChannel: string, message: string) => {
      if (receivedChannel === ch) onMessage(JSON.parse(message));
    });

    return async () => {
      await sub.unsubscribe(ch);
      await sub.quit();
    };
  },

  publishToQueue(exchange: string, routingKey: string, payload: unknown): void {
    const channel = getRabbitMQChannel();
    channel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(payload)),
      { persistent: true },
    );
    logger.info("job_queue_message_published", {
      event: "job_queue_message_published",
      exchange,
      routingKey,
    });
  },
};
