/**
 * @deprecated Prefer `paymentGateways` from `./gateways`.
 * Kept so existing imports keep working during the adapter migration.
 */
import { paymentGateways, GatewayName } from "./gateways";

export async function processPayment(
  gateway: GatewayName,
  req: {
    amount: number;
    callbackUrl: string;
    currency: string;
    email: string;
    phone: string;
    userId: string;
    name: string;
    metadata?: Record<string, unknown>;
  },
) {
  return paymentGateways.initialize(gateway, {
    amountNgn: req.amount,
    currency: req.currency,
    email: req.email,
    phone: req.phone,
    userId: req.userId,
    customerName: req.name,
    callbackUrl: req.callbackUrl,
    metadata: req.metadata,
  });
}

export async function refundPayment(
  gateway: GatewayName,
  input: { transactionId: string; amountNgn?: number },
) {
  return paymentGateways.refund(gateway, input);
}
