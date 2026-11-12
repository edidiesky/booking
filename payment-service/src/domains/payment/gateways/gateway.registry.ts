import CircuitBreaker from "opossum";
import {
  gatewayFeatureFlag,
  isFeatureEnabled,
} from "@booking/shared";
import { logger } from "../../../logger";
import { FlutterwaveAdapter } from "./flutterwave.adapter";
import { PaystackAdapter } from "./paystack.adapter";
import {
  GatewayName,
  InitializePaymentRequest,
  InitializePaymentResult,
  NormalizedWebhook,
  PaymentGatewayAdapter,
  RefundPaymentRequest,
  RefundPaymentResult,
} from "./types";

const breakerOptions = {
  timeout: 15_000,
  errorThresholdPercentage: 50,
  resetTimeout: 3_000,
  rollingCountTimeout: 10_000,
  volumeThreshold: 5,
};

function wrapWithBreaker<TArgs extends unknown[], TResult>(
  name: string,
  fn: (...args: TArgs) => Promise<TResult>,
): CircuitBreaker<TArgs, TResult> {
  const breaker = new CircuitBreaker(fn, breakerOptions);
  breaker.fallback(() =>
    Promise.reject(new Error(`Gateway ${name} unavailable, circuit open.`)),
  );
  breaker.on("open", () =>
    logger.warn("circuit_breaker_state_open", { name }),
  );
  return breaker;
}

class PaymentGatewayRegistry {
  private readonly adapters: Map<GatewayName, PaymentGatewayAdapter>;
  private readonly initBreakers: Map<
    GatewayName,
    CircuitBreaker<[InitializePaymentRequest], InitializePaymentResult>
  >;
  private readonly refundBreakers: Map<
    GatewayName,
    CircuitBreaker<[RefundPaymentRequest], RefundPaymentResult>
  >;

  constructor() {
    const paystack = new PaystackAdapter();
    const flutterwave = new FlutterwaveAdapter();

    this.adapters = new Map<GatewayName, PaymentGatewayAdapter>([
      ["paystack", paystack],
      ["flutterwave", flutterwave],
    ]);

    this.initBreakers = new Map();
    this.refundBreakers = new Map();

    for (const [name, adapter] of this.adapters) {
      this.initBreakers.set(
        name,
        wrapWithBreaker(`${name}.initialize`, (req: InitializePaymentRequest) =>
          adapter.initialize(req),
        ),
      );
      this.refundBreakers.set(
        name,
        wrapWithBreaker(`${name}.refund`, (req: RefundPaymentRequest) =>
          adapter.refund(req),
        ),
      );
    }
  }

  list(): GatewayName[] {
    return [...this.adapters.keys()];
  }

  /** Gateways allowed by feature flags right now */
  listEnabled(): GatewayName[] {
    return this.list().filter((name) =>
      isFeatureEnabled(gatewayFeatureFlag(name)),
    );
  }

  get(name: GatewayName): PaymentGatewayAdapter {
    const adapter = this.adapters.get(name);
    if (!adapter) {
      throw Object.assign(new Error(`Unknown payment gateway: ${name}`), {
        status: 400,
      });
    }
    return adapter;
  }

  private assertEnabled(name: GatewayName): void {
    const flag = gatewayFeatureFlag(name);
    if (!isFeatureEnabled(flag)) {
      throw Object.assign(
        new Error(`Payment gateway ${name} is disabled (${flag})`),
        { status: 503 },
      );
    }
  }

  async initialize(
    name: GatewayName,
    req: InitializePaymentRequest,
  ): Promise<InitializePaymentResult> {
    this.assertEnabled(name);
    const breaker = this.initBreakers.get(name)!;
    return breaker.fire(req);
  }

  async refund(
    name: GatewayName,
    req: RefundPaymentRequest,
  ): Promise<RefundPaymentResult> {
    this.assertEnabled(name);
    const breaker = this.refundBreakers.get(name)!;
    return breaker.fire(req);
  }

  normalizeWebhook(
    name: GatewayName,
    body: Record<string, unknown>,
  ): NormalizedWebhook {
    return this.get(name).normalizeWebhook(body);
  }
}

export const paymentGateways = new PaymentGatewayRegistry();
