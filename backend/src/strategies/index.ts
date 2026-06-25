import { PaymentGateway }     from "../types";
import createPaystackAdapter   from "./paystack.adapter";
import createFlutterwaveAdapter from "./flutterwave.adapter";

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
  private strategies: Record<PaymentGateway, IPaymentAdapter>;

  constructor() {
    this.strategies = {
      paystack: createPaystackAdapter({
        secretKey: process.env.PAYSTACK_SECRET_KEY ?? "",
      }),
      flutterwave: createFlutterwaveAdapter({
        secretKey: process.env.FLW_SECRET_KEY ?? "",
      }),
    };
  }

  getAdapter(gateway: PaymentGateway): IPaymentAdapter {
    const strategy = this.strategies[gateway];
    if (!strategy) throw new Error(`No payment adapter for gateway: ${gateway}`);
    return strategy;
  }
}

export const paymentStrategies = new PaymentStrategies();
