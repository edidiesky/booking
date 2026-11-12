import type { Redis } from "ioredis";
import logger from "../../utils/logger";
import { isKnownFeatureFlag } from "../../config/feature-registry";
import {
  FEATURE_FLAG_CHANNEL,
  type FeatureFlagUpdateMessage,
} from "./featureFlag.repository";
import type { FeatureFlagEngine } from "./FeatureFlagEngine";

/**
 * A connection in subscriber mode cannot run GET/SET.
 */
export class FeatureFlagSync {
  constructor(
    private readonly subscriberRedis: Redis,
    private readonly engine: FeatureFlagEngine,
  ) {}

  async subscribe(): Promise<void> {
    await this.subscriberRedis.subscribe(FEATURE_FLAG_CHANNEL);

    this.subscriberRedis.on("message", (channel: string, raw: string) => {
      if (channel !== FEATURE_FLAG_CHANNEL) return;

      try {
        const message = JSON.parse(raw) as FeatureFlagUpdateMessage;
        if (!isKnownFeatureFlag(message.key)) {
          logger.warn("feature_flag_sync_unknown_key", {
            event: "feature_flag_sync_unknown_key",
            key: message.key,
          });
          return;
        }
        this.engine.applyUpdate(message.key, message.enabled);
        logger.info("feature_flag_sync_applied", {
          event: "feature_flag_sync_applied",
          key: message.key,
          enabled: message.enabled,
          changedBy: message.changedBy,
        });
      } catch (err) {
        logger.error("feature_flag_sync_parse_failed", {
          event: "feature_flag_sync_parse_failed",
          error: (err as Error).message,
          raw,
        });
      }
    });

    logger.info("feature_flag_sync_subscribed", {
      event: "feature_flag_sync_subscribed",
      channel: FEATURE_FLAG_CHANNEL,
    });
  }
}