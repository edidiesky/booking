import {
  ALL_FEATURE_FLAG_KEYS,
  FEATURE_FLAG_DEFAULT,
  isKnownFeatureFlag,
  setFeatureFlagEngine,
  type FeatureFlagKey,
} from "@booking/shared";
import { FeatureFlagRepository } from "./featureFlag.repository";
import { logger } from "../../logger";

export class FeatureFlagNotFoundError extends Error {
  status = 404;
  constructor() {
    super("Unknown feature flag.");
    this.name = "FeatureFlagNotFoundError";
  }
}

export class FeatureFlagValidationError extends Error {
  status = 400;
  constructor(message: string) {
    super(message);
    this.name = "FeatureFlagValidationError";
  }
}

/**
 * Domain service: in-process cache + writes through repository.
 * Registers with shared setFeatureFlagEngine so payment gateways use isFeatureEnabled().
 */
export class FeatureFlagService {
  private readonly cache = new Map<FeatureFlagKey, boolean>();
  private ready = false;

  constructor(private readonly repository: FeatureFlagRepository) {}

  async start(): Promise<void> {
    const current = await this.repository.getAll();
    for (const key of ALL_FEATURE_FLAG_KEYS) {
      this.cache.set(key, current[key]);
    }
    this.ready = true;

    setFeatureFlagEngine({
      isEnabled: (key: FeatureFlagKey) => this.isEnabled(key),
      getAll: () => this.getAll(),
      applyUpdate: (key: FeatureFlagKey, enabled: boolean) =>
        this.applyUpdate(key, enabled),
    });

    this.repository.onUpdate((msg) => {
      this.applyUpdate(msg.key, msg.enabled);
      logger.info("feature_flag_applied", {
        key: msg.key,
        enabled: msg.enabled,
        changedBy: msg.changedBy,
      });
    });

    logger.info("feature_flag_service_ready", { flags: this.getAll() });
  }

  applyUpdate(key: FeatureFlagKey, enabled: boolean): void {
    this.cache.set(key, enabled);
  }

  isEnabled(key: FeatureFlagKey): boolean {
    if (!this.ready) return FEATURE_FLAG_DEFAULT;
    return this.cache.get(key) ?? FEATURE_FLAG_DEFAULT;
  }

  getAll(): Record<FeatureFlagKey, boolean> {
    const result = {} as Record<FeatureFlagKey, boolean>;
    for (const key of ALL_FEATURE_FLAG_KEYS) {
      result[key] = this.cache.get(key) ?? FEATURE_FLAG_DEFAULT;
    }
    return result;
  }

  getOne(key: string): { key: FeatureFlagKey; enabled: boolean } {
    if (!isKnownFeatureFlag(key)) {
      throw new FeatureFlagNotFoundError();
    }
    return { key, enabled: this.isEnabled(key) };
  }

  async setFlag(
    key: string,
    enabled: boolean,
    changedBy: string,
  ): Promise<{ key: FeatureFlagKey; enabled: boolean }> {
    if (!isKnownFeatureFlag(key)) {
      throw new FeatureFlagNotFoundError();
    }
    if (typeof enabled !== "boolean") {
      throw new FeatureFlagValidationError("enabled must be a boolean.");
    }

    await this.repository.set(key, enabled, changedBy);
    this.applyUpdate(key, enabled);

    return { key, enabled };
  }
}
