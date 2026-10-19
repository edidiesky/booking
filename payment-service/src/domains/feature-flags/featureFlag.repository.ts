import {
  ALL_FEATURE_FLAG_KEYS,
  FEATURE_FLAG_DEFAULT,
  type FeatureFlagKey,
  type FeatureFlagUpdateMessage,
} from "@booking/shared";

/**
 * Persistence for feature flags.
 * In-memory for local/dev; swap implementation for Redis without changing the service.
 */
export class FeatureFlagRepository {
  private readonly store = new Map<FeatureFlagKey, boolean>();
  private readonly listeners = new Set<(msg: FeatureFlagUpdateMessage) => void>();

  async getAll(): Promise<Record<FeatureFlagKey, boolean>> {
    const result = {} as Record<FeatureFlagKey, boolean>;
    for (const key of ALL_FEATURE_FLAG_KEYS) {
      result[key] = this.store.has(key)
        ? this.store.get(key)!
        : FEATURE_FLAG_DEFAULT;
    }
    return result;
  }

  async get(key: FeatureFlagKey): Promise<boolean> {
    return this.store.has(key) ? this.store.get(key)! : FEATURE_FLAG_DEFAULT;
  }

  async set(
    key: FeatureFlagKey,
    enabled: boolean,
    changedBy: string,
  ): Promise<void> {
    this.store.set(key, enabled);
    const message: FeatureFlagUpdateMessage = {
      key,
      enabled,
      changedBy,
      changedAt: new Date().toISOString(),
    };
    for (const listener of this.listeners) {
      listener(message);
    }
  }

  onUpdate(listener: (msg: FeatureFlagUpdateMessage) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
