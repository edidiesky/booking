import { Pool } from "pg";
import { randomUUID } from "crypto";
import { notificationRepository } from "./domains/notification/notification.repository";
import { notificationService } from "./domains/notification/notification.service";
import { registerGracefulShutdown } from "./shutdown";
import { logger } from "./logger";

const pool = new Pool({ connectionString: process.env.LEDGER_DATABASE_URL });
const WORKER_ID = randomUUID();

async function pollOnce(): Promise<void> {
  const events = await notificationRepository.claimBatch(pool, WORKER_ID, 20);

  for (const event of events) {
    try {
      await notificationService.deliver(event);
      await notificationRepository.markPublished(pool, event.id, WORKER_ID);
    } catch (err) {
      logger.error("notification_delivery_failed", {
        eventId: event.id,
        error: (err as Error).message,
      });
    }
  }
}

const interval = setInterval(() => {
  pollOnce().catch((err) =>
    logger.error("notification_poll_failed", {
      error: (err as Error).message,
    }),
  );
}, 5_000);

registerGracefulShutdown(pool, () => clearInterval(interval));

logger.info("notification_worker_started", { workerId: WORKER_ID });
