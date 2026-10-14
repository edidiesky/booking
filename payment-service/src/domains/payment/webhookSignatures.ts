import crypto from "crypto";
import { Request } from "express";

export class WebhookSignatureError extends Error {
  status = 401;
  constructor(message: string) {
    super(message);
    this.name = "WebhookSignatureError";
  }
}

/**
 * Paystack: header x-paystack-signature = HMAC-SHA512(secret, rawBody)
 * Flutterwave: header verif-hash === FLW_SECRET_HASH (simple shared secret)
 *            or HMAC-SHA256 when FLW_SECRET_HASH is used as HMAC key over raw body
 */
export function verifyWebhookSignature(
  gateway: "paystack" | "flutterwave",
  req: Request,
  rawBody: Buffer | string,
): void {
  const body = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");

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
  // Flutterwave dashboard verif-hash is a shared secret equality check
  if (hashHeader === secret) {
    return;
  }
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
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

/** Normalize provider payloads to internal webhook shape */
export function normalizeWebhookPayload(
  gateway: "paystack" | "flutterwave",
  body: Record<string, unknown>,
): {
  transactionId: string;
  amount: number;
  amountUnit: "ngn" | "kobo";
  event?: string;
} {
  if (gateway === "paystack") {
    const data = (body.data ?? body) as Record<string, unknown>;
    return {
      transactionId: String(data.reference ?? data.transactionId ?? ""),
      amount: Number(data.amount ?? 0),
      amountUnit: "kobo",
      event: String(body.event ?? ""),
    };
  }
  const data = (body.data ?? body) as Record<string, unknown>;
  return {
    transactionId: String(
      data.tx_ref ?? data.flw_ref ?? data.transactionId ?? "",
    ),
    amount: Number(data.amount ?? 0),
    amountUnit: "ngn",
    event: String(body.event ?? body.status ?? ""),
  };
}
