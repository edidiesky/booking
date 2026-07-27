export { runConsumerLoop, getInFlightCount, stopAllConsumers } from "./messaging/consumerLoop";
export type { MessageHandler } from "./messaging/consumerLoop";
export { registerGracefulShutdown } from "./shutdown/gracefulShutdown";
export type { GracefulShutdownOptions } from "./shutdown/gracefulShutdown";
export { connectDB, query, queryOne, withTransaction, checkoutClient, disconnectDB } from "./config/database";
export { default as redisClient, connectRedis }                     from "./config/redis";
export { connectRabbitMQ, getRabbitMQConnection, getRabbitMQChannel, disconnectRabbitMQ, EXCHANGES, ROUTING_KEYS } from "./config/rabbitmq";
export { createScheduleIndex, createLockedScheduler } from "./scheduling/scheduleIndex";

export { bookingRepository }       from "./domains/booking/booking.repository";
export { propertyRepository }      from "./domains/property/property.repository";
export { availabilityRepository }  from "./domains/availability/availability.repository";
export { availabilityBroadcaster } from "./domains/availability/availability.broadcaster";
export { outboxRepository }        from "./domains/outbox/outbox.repository";
export type { OutboxEventType, OutboxEvent } from "./domains/outbox/outbox.repository";

export * from "./messaging/publisher";

export { jobRepository } from "./infra/jobs/job.repository";
export { jobService }    from "./infra/jobs/job.service";
export type { JobProgress, JobState } from "./infra/jobs/job.types";

export { requestContext } from "./context/requestContext";

export { default as logger } from "./utils/logger";
export { AppError }          from "./utils/AppError";
export * from "./utils/metrics";