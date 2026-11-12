import {
  FEATURE_FLAGS,
  FeatureFlagEngine,
  InMemoryFeatureFlagRepository,
  setFeatureFlagEngine,
  gatewayFeatureFlag,
  isFeatureEnabled,
} from "@booking/shared";
import { paymentGateways } from "../domains/payment/gateways";

describe("payment gateway feature flags", () => {
  beforeEach(async () => {
    const repo = new InMemoryFeatureFlagRepository();
    const engine = new FeatureFlagEngine(repo);
    await engine.start();
    setFeatureFlagEngine(engine);
  });

  it("maps gateway names to registry keys", () => {
    expect(gatewayFeatureFlag("paystack")).toBe(FEATURE_FLAGS.GATEWAY_PAYSTACK);
    expect(gatewayFeatureFlag("flutterwave")).toBe(
      FEATURE_FLAGS.GATEWAY_FLUTTERWAVE,
    );
  });

  it("defaults gateways to enabled", () => {
    expect(isFeatureEnabled(FEATURE_FLAGS.GATEWAY_PAYSTACK)).toBe(true);
    expect(paymentGateways.listEnabled()).toEqual(
      expect.arrayContaining(["paystack", "flutterwave"]),
    );
  });

  it("blocks initialize when flag is off", async () => {
    const repo = new InMemoryFeatureFlagRepository();
    const engine = new FeatureFlagEngine(repo);
    await engine.start();
    setFeatureFlagEngine(engine);
    await repo.set(FEATURE_FLAGS.GATEWAY_PAYSTACK, false, "test");
    engine.applyUpdate(FEATURE_FLAGS.GATEWAY_PAYSTACK, false);

    await expect(
      paymentGateways.initialize("paystack", {
        amountNgn: 1000,
        currency: "NGN",
        email: "a@b.com",
        userId: "u1",
        callbackUrl: "https://example.com/cb",
      }),
    ).rejects.toMatchObject({ status: 503 });
  });
});
