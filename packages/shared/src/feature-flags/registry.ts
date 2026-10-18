/**
 * Canonical feature flag keys for the booking platform.
 * Payment gateways use the same engine as product flags (not a separate killSwitch map).
 */
export const FEATURE_FLAGS = {
  // Product
  SELLER_MESSAGING: "feature.seller-messaging",
  SELLER_CUSTOM_DOMAIN: "feature.seller-custom-domain",
  NEW_CHECKOUT_FLOW: "feature.new-checkout-flow",
  SELLER_STOREFRONT_MAP_VIEW: "feature.storefront-map-view",

  // Payment gateways (rebranded from ad-hoc killSwitch names)
  GATEWAY_PAYSTACK: "feature.gateway.paystack",
  GATEWAY_FLUTTERWAVE: "feature.gateway.flutterwave",
} as const;

export type FeatureFlagKey = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];

export const ALL_FEATURE_FLAG_KEYS: FeatureFlagKey[] =
  Object.values(FEATURE_FLAGS);

export function isKnownFeatureFlag(key: string): key is FeatureFlagKey {
  return (ALL_FEATURE_FLAG_KEYS as string[]).includes(key);
}

/** When no value is stored yet — gateways default on so local boot is not blocked */
export const FEATURE_FLAG_DEFAULT = true;

/** Map gateway adapter name → feature flag key */
export function gatewayFeatureFlag(
  gateway: "paystack" | "flutterwave",
): FeatureFlagKey {
  return gateway === "paystack"
    ? FEATURE_FLAGS.GATEWAY_PAYSTACK
    : FEATURE_FLAGS.GATEWAY_FLUTTERWAVE;
}
