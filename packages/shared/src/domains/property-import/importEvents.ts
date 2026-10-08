
import redisClient from "../../config/redis";
import logger from "../../utils/logger";
import type { ImportEvent } from "./importTypes";

const channel = (batchId: string) => `import_batch:${batchId}`;

export async function publishImportEvent(batchId: string, event: ImportEvent): Promise<void> {
  try {
    await redisClient.publish(channel(batchId), JSON.stringify(event));
  } catch (err) {
    logger.warn("import_event_publish_failed", {
      event: "import_event_publish_failed",
      batchId,
      type: event.type,
      error: (err as Error).message,
    });
  }
}

export async function subscribeImportEvents(
  batchId: string,
  onEvent: (event: ImportEvent) => void,
): Promise<() => Promise<void>> {
  const sub = redisClient.duplicate();
  const ch = channel(batchId);
  sub.on("message", (received: string, message: string) => {
    if (received !== ch) return;
    try {
      onEvent(JSON.parse(message) as ImportEvent);
    } catch {
      /* ignore malformed message */
    }
  });
  await sub.subscribe(ch);
  return async () => {
    try {
      await sub.unsubscribe(ch);
    } finally {
      sub.disconnect();
    }
  };
}