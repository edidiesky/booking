import type { Redis } from "ioredis";
import logger from "../../utils/logger";
import {
  ALL_FEATURE_FLAG_KEYS,
  FEATURE_FLAG_DEFAULT,
  type FeatureFlagKey,
} from "../../config/feature-registry";

const KEY_PREFIX = "featureflag:";
export const FEATURE_FLAG_CHANNEL = "featureflag:updates";

export interface FeatureFlagUpdateMessage {
  key: FeatureFlagKey;
  enabled: boolean;
  changedBy: string;
  changedAt: string;
}

export class FeatureFlagRepository {
  constructor(private readonly redis: Redis) {}

  private parse(raw: string | null): boolean {
    if (raw === null) return FEATURE_FLAG_DEFAULT;
    return raw === "true";
  }

  async getAll(): Promise<Record<FeatureFlagKey, boolean>> {
    const result = {} as Record<FeatureFlagKey, boolean>;
    for (const key of ALL_FEATURE_FLAG_KEYS) {
      const raw = await this.redis.get(KEY_PREFIX + key);
      result[key] = this.parse(raw);
    }
    return result;
  }

  async get(key: FeatureFlagKey): Promise<boolean> {
    return this.parse(await this.redis.get(KEY_PREFIX + key));
  }

  async set(
    key: FeatureFlagKey,
    enabled: boolean,
    changedBy: string,
  ): Promise<void> {
    await this.redis.set(KEY_PREFIX + key, String(enabled));

    const message: FeatureFlagUpdateMessage = {
      key,
      enabled,
      changedBy,
      changedAt: new Date().toISOString(),
    };

    await this.redis.publish(FEATURE_FLAG_CHANNEL, JSON.stringify(message));

    logger.info("feature_flag_changed", {
      event: "feature_flag_changed",
      key,
      enabled,
      changedBy,
    });
  }
}