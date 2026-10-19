import crypto from "crypto";
import { Request } from "express";
import { paymentGateways, GatewayName } from "./gateways";

export class WebhookSignatureError extends Error {
  status = 401;
  constructor(message: string) {
    super(message);
    this.name = "WebhookSignatureError";
  }
}

/**
 * Paystack: x-paystack-signature = HMAC-SHA512(secret, rawBody)
 * Flutterwave: verif-hash shared secret or HMAC-SHA256(rawBody)
 */
export function verifyWebhookSignature(
  gateway: GatewayName,
  req: Request,
  rawBody: Buffer | string,
): void {
  const body =
    typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");

  if (gateway === "paystack") {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      throw new WebhookSignatureError("PAYSTACK_SECRET_KEY not configured");
    }
    const signature = req.header("x-paystack-signature");
    if (!signature) {
      throw new WebhookSignatureError("Missing x-paystack-signature");
    }
    const expected = crypto
      .createHmac("sha512", secret)
      .update(body)
      .digest("hex");
    if (!timingSafeEqualHex(expected, signature)) {
      throw new WebhookSignatureError("Invalid Paystack signature");
    }
    return;
  }

  const hashHeader =
    req.header("verif-hash") ?? req.header("x-flutterwave-signature");
  const secret =
    process.env.FLW_SECRET_HASH ?? process.env.FLW_SECRET_KEY ?? "";
  if (!secret) {
    throw new WebhookSignatureError("FLW_SECRET_HASH not configured");
  }
  if (!hashHeader) {
    throw new WebhookSignatureError("Missing Flutterwave verification header");
  }
  if (hashHeader === secret) {
    return;
  }
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  if (!timingSafeEqualHex(expected, hashHeader)) {
    throw new WebhookSignatureError("Invalid Flutterwave signature");
  }
}

function timingSafeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "utf8");
    const bb = Buffer.from(b, "utf8");
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

/** Delegate payload shape mapping to the gateway adapter. */
export function normalizeWebhookPayload(
  gateway: GatewayName,
  body: Record<string, unknown>,
) {
  return paymentGateways.normalizeWebhook(gateway, body);
}
