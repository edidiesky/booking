import {
  ALL_FEATURE_FLAG_KEYS,
  FEATURE_FLAG_DEFAULT,
  type FeatureFlagKey,
} from "./registry";

export const FEATURE_FLAG_CHANNEL = "featureflag:updates";

export interface FeatureFlagUpdateMessage {
  key: FeatureFlagKey;
  enabled: boolean;
  changedBy: string;
  changedAt: string;
}

export interface FeatureFlagRepository {
  getAll(): Promise<Record<FeatureFlagKey, boolean>>;
  get(key: FeatureFlagKey): Promise<boolean>;
  set(key: FeatureFlagKey, enabled: boolean, changedBy: string): Promise<void>;
}

/**
 * In-memory store for local/dev and services without Redis.
 * Same interface as the Redis-backed repo in the monolith.
 */
export class InMemoryFeatureFlagRepository implements FeatureFlagRepository {
  private store = new Map<FeatureFlagKey, boolean>();
  private listeners = new Set<(msg: FeatureFlagUpdateMessage) => void>();

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

  /** Local pub/sub substitute when Redis is not wired */
  onUpdate(listener: (msg: FeatureFlagUpdateMessage) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
