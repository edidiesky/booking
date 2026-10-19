/**
 * Shared contracts for payment gateway adapters.
 * Domain code depends only on this interface, not on Paystack/Flutterwave details.
 */

export type GatewayName = "paystack" | "flutterwave";

export type AmountUnit = "ngn" | "kobo";

export interface InitializePaymentRequest {
  amountNgn: number;
  currency: string;
  email: string;
  phone?: string;
  userId: string;
  customerName?: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}

export interface InitializePaymentResult {
  success: boolean;
  message: string;
  transactionId?: string;
  redirectUrl?: string;
}

export interface RefundPaymentRequest {
  transactionId: string;
  amountNgn?: number;
}

export interface RefundPaymentResult {
  success: boolean;
  message: string;
  providerReference?: string;
}

export interface NormalizedWebhook {
  transactionId: string;
  amount: number;
  amountUnit: AmountUnit;
  event?: string;
  raw: Record<string, unknown>;
}

/**
 * One adapter per payment provider.
 * All provider-specific HTTP, amount units, and payload shapes stay inside the adapter.
 */
export interface PaymentGatewayAdapter {
  readonly name: GatewayName;

  /** Unit the provider uses on initialize/webhook amounts for comparison helpers */
  readonly amountUnit: AmountUnit;

  initialize(req: InitializePaymentRequest): Promise<InitializePaymentResult>;

  refund(req: RefundPaymentRequest): Promise<RefundPaymentResult>;

  /**
   * Map provider webhook JSON into a common shape.
   * Signature verification stays outside (HTTP middleware) using raw body.
   */
  normalizeWebhook(body: Record<string, unknown>): NormalizedWebhook;
}
