import { redisClient, logger } from "@booking/shared";

export type ProviderName = "email" | "sms";
export type HealthStatus = "healthy" | "degraded" | "down";

const HEALTH_KEY = (provider: ProviderName) => `provider:health:${provider}`;
const FAILURE_KEY = (provider: ProviderName) => `provider:failures:${provider}`;

const HEALTH_TTL_SEC   = 300; 
const FAILURE_WINDOW_SEC = 60;
const DEGRADED_THRESHOLD = 5;  // failures in the window
const DOWN_THRESHOLD     = 15;

// Deliberately simple for v1, not a full circuit breaker: track a rolling
// failure count in Redis, derive a status from it, require a human to
// notice and resume rather than auto-recover. Auto-recovery is itself a
// thing that can misfire (flapping between healthy/down under sustained
// partial failure), not worth building until there's real production
// signal on how these providers actually degrade.
export const providerHealth = {
  async recordFailure(provider: ProviderName): Promise<void> {
    const key = FAILURE_KEY(provider);
    const count = await redisClient.incr(key);
    if (count === 1) await redisClient.expire(key, FAILURE_WINDOW_SEC);

    if (count >= DOWN_THRESHOLD) {
      await redisClient.set(HEALTH_KEY(provider), "down", "EX", HEALTH_TTL_SEC);
      logger.error("provider_marked_down", { event: "provider_marked_down", provider, failureCount: count });
    } else if (count >= DEGRADED_THRESHOLD) {
      await redisClient.set(HEALTH_KEY(provider), "degraded", "EX", HEALTH_TTL_SEC);
      logger.warn("provider_marked_degraded", { event: "provider_marked_degraded", provider, failureCount: count });
    }
  },

  async recordSuccess(provider: ProviderName): Promise<void> {
    // A success doesn't immediately clear "down", that requires a human
    // to resume (see file header), it just stops the failure count from
    // climbing further.
    await redisClient.del(FAILURE_KEY(provider));
  },

  async getStatus(provider: ProviderName): Promise<HealthStatus> {
    const status = await redisClient.get(HEALTH_KEY(provider));
    return (status as HealthStatus) ?? "healthy";
  },

  async resume(provider: ProviderName): Promise<void> {
    await redisClient.del(HEALTH_KEY(provider));
    await redisClient.del(FAILURE_KEY(provider));
    logger.info("provider_manually_resumed", { event: "provider_manually_resumed", provider });
  },
};