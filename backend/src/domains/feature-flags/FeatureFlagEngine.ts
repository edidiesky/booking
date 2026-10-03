import {
  ALL_FEATURE_FLAG_KEYS,
  FEATURE_FLAG_DEFAULT,
  type FeatureFlagKey,
} from "../../config/feature-registry";
import type { FeatureFlagRepository } from "./featureFlag.repository";

export class FeatureFlagEngine {
  private cache = new Map<FeatureFlagKey, boolean>();
  private ready = false;

  constructor(private readonly repository: FeatureFlagRepository) {}

  async start(): Promise<void> {
    const current = await this.repository.getAll();
    for (const key of ALL_FEATURE_FLAG_KEYS) {
      this.cache.set(key, current[key]);
    }
    this.ready = true;
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
}

let engineRef: FeatureFlagEngine | null = null;

export function setFeatureFlagEngine(engine: FeatureFlagEngine): void {
  engineRef = engine;
}

export function getFeatureFlagEngine(): FeatureFlagEngine {
  if (!engineRef) {
    throw new Error("FeatureFlagEngine not initialized");
  }
  return engineRef;
}

export function isFeatureEnabled(key: FeatureFlagKey): boolean {
  return getFeatureFlagEngine().isEnabled(key);
}