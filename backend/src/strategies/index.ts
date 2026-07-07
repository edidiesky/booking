import { PaymentGateway }     from "../types";
import createPaystackAdapter   from "./paystack.adapter";
import createFlutterwaveAdapter from "./flutterwave.adapter";
import { createBreaker } from "../utils/createBreaker";

export interface IAdapterRequest {
  secretKey: string;
}

export interface IPaymentProcessRequest {
  amount:      number;
  callbackUrl: string;
  currency:    string;
  email:       string;
  phone:       string;
  userId:      string;
  name:        string;
  metadata?:   Record<string, unknown>;
}
export interface IPaymentRefundRequest {
  transactionId: string;
  amount:        number;
  reason?:       string;
}

export interface IPaymentResponse {
  success:        boolean;
  message:        string;
  transactionId?: string;
  redirectUrl?:   string;
}

export interface IPaymentAdapter {
  process:                 (req: IPaymentProcessRequest) => Promise<IPaymentResponse>;
  refund?:                 (req: IPaymentRefundRequest)  => Promise<IPaymentResponse>;
  verifyWebhook?:          (payload: unknown, signature?: string) => boolean;
  extractTransactionId?:   (payload: unknown) => string;
  extractStatus?:          (payload: unknown) => "success" | "failed" | "pending";
  extractAmount?:          (payload: unknown) => number;
  extractMetadata?:        (payload: unknown) => Record<string, unknown>;
}

class PaymentStrategies {
 private strategies:      Record<PaymentGateway, IPaymentAdapter>;
  private processBreakers: Record<PaymentGateway, ReturnType<typeof createBreaker<[IPaymentProcessRequest], IPaymentResponse>>>;
  private refundBreakers:  Partial<Record<PaymentGateway, ReturnType<typeof createBreaker<[IPaymentRefundRequest], IPaymentResponse>>>>;

  constructor() {
    const paystack    = createPaystackAdapter({ secretKey: process.env.PAYSTACK_SECRET_KEY ?? "" });
    const flutterwave = createFlutterwaveAdapter({ secretKey: process.env.FLW_SECRET_KEY ?? "" });

    this.strategies = { paystack, flutterwave };

    this.processBreakers = {
      paystack:    createBreaker("paystack.process",    paystack.process),
      flutterwave: createBreaker("flutterwave.process", flutterwave.process),
    };

    this.refundBreakers = {
      paystack:    paystack.refund    ? createBreaker("paystack.refund",    paystack.refund)    : undefined,
      flutterwave: flutterwave.refund ? createBreaker("flutterwave.refund", flutterwave.refund) : undefined,
    };
  }

  getAdapter(gateway: PaymentGateway): IPaymentAdapter {
    const strategy = this.strategies[gateway];
    if (!strategy) throw new Error(`No payment adapter for gateway: ${gateway}`);

    const processBreaker = this.processBreakers[gateway];
    const refundBreaker  = this.refundBreakers[gateway];

    return {
      ...strategy,
      process: (req) => processBreaker.fire(req),
      refund:  refundBreaker ? (req) => refundBreaker.fire(req) : strategy.refund,
    };
}
}

export const paymentStrategies = new PaymentStrategies();
