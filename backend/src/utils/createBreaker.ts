import CircuitBreaker from "opossum";
import logger from "./logger";
import { trackCircuitBreakerEvent } from "./metrics";

const options = {
  timeout:                  15_000,
  errorThresholdPercentage: 50,
  resetTimeout:             30_000,
  rollingCountTimeout:      10_000,
  volumeThreshold:          5,
};

export function createBreaker<Args extends unknown[], R>(
  name:   string,
  action: (...args: Args) => Promise<R>,
): CircuitBreaker<Args, R> {
  const breaker = new CircuitBreaker(action, options);

  breaker.fallback(() => {
    logger.warn("circuit_breaker_open", { event: "circuit_breaker_open", name });
    trackCircuitBreakerEvent(name, "reject");
    return Promise.reject(new Error(`Gateway ${name} unavailable, circuit open.`));
  });

  breaker.on("open",     () => { logger.error("circuit_breaker_state_open",    { event: "circuit_breaker_state_open",    name }); trackCircuitBreakerEvent(name, "open"); });
  breaker.on("halfOpen", () => { logger.warn("circuit_breaker_state_halfopen", { event: "circuit_breaker_state_halfopen", name }); trackCircuitBreakerEvent(name, "halfOpen"); });
  breaker.on("close",    () => { logger.info("circuit_breaker_state_closed",  { event: "circuit_breaker_state_closed",  name }); trackCircuitBreakerEvent(name, "close"); });
  breaker.on("failure",  () => trackCircuitBreakerEvent(name, "failure"));
  breaker.on("timeout",  () => trackCircuitBreakerEvent(name, "timeout"));

  return breaker;
}