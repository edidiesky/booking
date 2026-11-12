import { gatewayFeatureFlag, isFeatureEnabled } from "./feature-flags";

/**
 * Back-compat façade. Payment gateways now use FeatureFlagEngine keys
 * `feature.gateway.paystack` / `feature.gateway.flutterwave`.
 * Prefer isFeatureEnabled(FEATURE_FLAGS.GATEWAY_*) in new code.
 */
export const killSwitch = {
  isOpen(name: string): boolean {
    if (name === "gateway.paystack") {
      return isFeatureEnabled(gatewayFeatureFlag("paystack"));
    }
    if (name === "gateway.flutterwave") {
      return isFeatureEnabled(gatewayFeatureFlag("flutterwave"));
    }
    // Unknown legacy names: treat as open unless explicitly closed via flags later
    return true;
  },
  open(_name: string): void {
    // No-op: mutate via FeatureFlagRepository.set + engine.applyUpdate
  },
  close(_name: string): void {
    // No-op: mutate via FeatureFlagRepository.set + engine.applyUpdate
  },
};
