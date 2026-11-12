import type Redis from "ioredis";
import logger from "../../utils/logger";
import { PresenceRepository } from "./presence.repository";
import type { PresenceEngine } from "./PresenceEngine";

/**
 * Listens for Redis key expiry on presence keys and updates PresenceEngine.
 * Must use a dedicated subscriber connection (not the command client).
 *
 * Requires: notify-keyspace-events including "E" and "x" (Ex).
 */
export class PresenceSync {
  constructor(
    private readonly subscriber: Redis,
    private readonly engine: PresenceEngine,
  ) {}

  async subscribe(): Promise<void> {
    // DB 0 expired events: __keyevent@0__:expired
    const channel = "__keyevent@0__:expired";

    await this.subscriber.subscribe(channel);

    this.subscriber.on("message", (ch, message) => {
      if (ch !== channel) return;

      const sessionId = PresenceRepository.sessionIdFromKey(message);
      if (!sessionId) return;

      this.engine.setOffline(sessionId);

      logger.debug("presence_expired", {
        event: "presence_expired",
        sessionId,
      });
    });

    this.subscriber.on("error", (err) => {
      logger.error("presence_sync_error", {
        event: "presence_sync_error",
        error: err.message,
      });
    });

    logger.info("presence_sync_subscribed", {
      event: "presence_sync_subscribed",
      channel,
    });
  }
}