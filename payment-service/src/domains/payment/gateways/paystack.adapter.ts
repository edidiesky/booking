import {
  InitializePaymentRequest,
  InitializePaymentResult,
  NormalizedWebhook,
  PaymentGatewayAdapter,
  RefundPaymentRequest,
  RefundPaymentResult,
} from "./types";

const PAYSTACK_BASE = "https://api.paystack.co";

export class PaystackAdapter implements PaymentGatewayAdapter {
  readonly name = "paystack" as const;
  readonly amountUnit = "kobo" as const;

  private secret(): string {
    const key = process.env.PAYSTACK_SECRET_KEY;
    if (!key) {
      throw Object.assign(new Error("PAYSTACK_SECRET_KEY is not configured"), {
        status: 503,
      });
    }
    return key;
  }

  async initialize(
    req: InitializePaymentRequest,
  ): Promise<InitializePaymentResult> {
    const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secret()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: req.email,
        amount: Math.round(req.amountNgn * 100),
        currency: req.currency || "NGN",
        callback_url: req.callbackUrl,
        metadata: {
          ...req.metadata,
          userId: req.userId,
          phone: req.phone,
        },
      }),
    });

    const body = (await res.json()) as {
      status: boolean;
      message: string;
      data?: { reference: string; authorization_url: string };
    };

    return {
      success: Boolean(body.status),
      message: body.message ?? (res.ok ? "ok" : "Paystack initialize failed"),
      transactionId: body.data?.reference,
      redirectUrl: body.data?.authorization_url,
    };
  }

  async refund(req: RefundPaymentRequest): Promise<RefundPaymentResult> {
    const payload: Record<string, unknown> = {
      transaction: req.transactionId,
    };
    if (req.amountNgn != null) {
      payload.amount = Math.round(req.amountNgn * 100);
    }

    const res = await fetch(`${PAYSTACK_BASE}/refund`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secret()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const body = (await res.json()) as {
      status: boolean;
      message: string;
      data?: { id?: number };
    };

    return {
      success: body.status === true,
      message: body.message ?? "Paystack refund failed",
      providerReference:
        body.data?.id != null ? String(body.data.id) : undefined,
    };
  }

  normalizeWebhook(body: Record<string, unknown>): NormalizedWebhook {
    const data = (body.data ?? body) as Record<string, unknown>;
    return {
      transactionId: String(data.reference ?? data.transactionId ?? ""),
      amount: Number(data.amount ?? 0),
      amountUnit: "kobo",
      event: String(body.event ?? ""),
      raw: body,
    };
  }
}
