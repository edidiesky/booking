export const FEATURE_FLAGS = {
  SELLER_MESSAGING: "feature.seller-messaging",
  SELLER_CUSTOM_DOMAIN: "feature.seller-custom-domain",
  NEW_CHECKOUT_FLOW: "feature.new-checkout-flow",
  SELLER_STOREFRONT_MAP_VIEW: "feature.storefront-map-view",
} as const;

export type FeatureFlagKey = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];

export const ALL_FEATURE_FLAG_KEYS: FeatureFlagKey[] =
  Object.values(FEATURE_FLAGS);

export function isKnownFeatureFlag(key: string): key is FeatureFlagKey {
  return (ALL_FEATURE_FLAG_KEYS as string[]).includes(key);
}

/** Default when Redis has no key yet — prefer false for risky flags in prod if you tighten later */
export const FEATURE_FLAG_DEFAULT = true;