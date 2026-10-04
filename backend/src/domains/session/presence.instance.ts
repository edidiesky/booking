import type { PresenceEngine } from "./PresenceEngine";
import type { PresenceRepository } from "./presence.repository";

/** Set during bootstrap; used by routes */
export let presenceRepository: PresenceRepository | null = null;
export let presenceEngine: PresenceEngine | null = null;

export function setPresence(
  repository: PresenceRepository,
  engine: PresenceEngine,
): void {
  presenceRepository = repository;
  presenceEngine = engine;
}

export function getPresenceRepository(): PresenceRepository {
  if (!presenceRepository) {
    throw new Error("Presence not bootstrapped");
  }
  return presenceRepository;
}

export function getPresenceEngine(): PresenceEngine {
  if (!presenceEngine) {
    throw new Error("Presence not bootstrapped");
  }
  return presenceEngine;
}

