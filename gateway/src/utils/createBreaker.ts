import CircuitBreaker from "opossum";
import { AxiosResponse } from "axios";
import { Readable } from "stream";
import { logger } from "@booking/shared";
// import { trackCircuitBreakerEvent } from "./metrics";

type ProxyAction = () => Promise<AxiosResponse<Readable>>;

interface BreakerEntry {
  breaker: CircuitBreaker<[], AxiosResponse<Readable>>;
  slot: { fn: ProxyAction };
}

const breakerCache = new Map<string, BreakerEntry>();

const options: CircuitBreaker.Options = {
  timeout: 20_000,
  errorThresholdPercentage: 50,
  resetTimeout: 30_000,
  rollingCountTimeout: 10_000,
  volumeThreshold: 5,
  errorFilter: (error: { response?: { status: number } }): boolean => {
    const status = error?.response?.status;
    return status !== undefined && status >= 400 && status < 500;
  },
};

function makeEntry(serviceName: string, firstAction: ProxyAction): BreakerEntry {
  const slot: { fn: ProxyAction } = { fn: firstAction };

  const breaker = new CircuitBreaker<[], AxiosResponse<Readable>>(
    () => slot.fn(),
    options,
  );

  breaker.fallback(() => {
    logger.warn(`Circuit breaker OPEN for ${serviceName}`);
    // trackCircuitBreakerEvent(serviceName, "reject");
    return Promise.reject({
      message: `Service ${serviceName} unavailable`,
      isBreakerOpen: true,
    });
  });

  breaker.on("open", () => {
    logger.error(`Circuit BREAKER OPEN for ${serviceName}`);
    // trackCircuitBreakerEvent(serviceName, "open");
  });
  breaker.on("halfOpen", () => {
    logger.warn(`Circuit HALF-OPEN for ${serviceName}`);
    // trackCircuitBreakerEvent(serviceName, "halfOpen");
  });
  breaker.on("close", () => {
    logger.info(`Circuit CLOSED for ${serviceName}`);
    // trackCircuitBreakerEvent(serviceName, "close");
  });
  // breaker.on("failure", () => trackCircuitBreakerEvent(serviceName, "failure"));
  // breaker.on("success", () => trackCircuitBreakerEvent(serviceName, "success"));
  // breaker.on("timeout", () => trackCircuitBreakerEvent(serviceName, "timeout"));
  // breaker.on("reject", () => trackCircuitBreakerEvent(serviceName, "reject"));

  return { breaker, slot };
}

export function getBreakerFire(
  serviceName: string,
  action: ProxyAction,
): () => Promise<AxiosResponse<Readable>> {
  let entry = breakerCache.get(serviceName);
  if (!entry) {
    entry = makeEntry(serviceName, action);
    breakerCache.set(serviceName, entry);
  }
  entry.slot.fn = action;
  return () => entry!.breaker.fire();
}