import {
  InitializePaymentRequest,
  InitializePaymentResult,
  NormalizedWebhook,
  PaymentGatewayAdapter,
  RefundPaymentRequest,
  RefundPaymentResult,
} from "./types";

const FLW_BASE = "https://api.flutterwave.com/v3";

export class FlutterwaveAdapter implements PaymentGatewayAdapter {
  readonly name = "flutterwave" as const;
  readonly amountUnit = "ngn" as const;

  private secret(): string {
    const key = process.env.FLW_SECRET_KEY;
    if (!key) {
      throw Object.assign(new Error("FLW_SECRET_KEY is not configured"), {
        status: 503,
      });
    }
    return key;
  }

  async initialize(
    req: InitializePaymentRequest,
  ): Promise<InitializePaymentResult> {
    // Single tx_ref so stored transactionId matches what the provider sees
    const txRef = `${req.userId}-${Date.now()}`;

    const res = await fetch(`${FLW_BASE}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secret()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: req.amountNgn,
        currency: req.currency || "NGN",
        redirect_url: req.callbackUrl,
        customer: {
          email: req.email,
          phonenumber: req.phone,
          name: req.customerName ?? req.userId,
        },
        meta: req.metadata,
      }),
    });

    const body = (await res.json()) as {
      status: string;
      message: string;
      data?: { link: string };
    };

    return {
      success: body.status === "success",
      message: body.message ?? (res.ok ? "ok" : "Flutterwave initialize failed"),
      transactionId: txRef,
      redirectUrl: body.data?.link,
    };
  }

  async refund(req: RefundPaymentRequest): Promise<RefundPaymentResult> {
    const res = await fetch(`${FLW_BASE}/refunds`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secret()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: req.transactionId,
        amount: req.amountNgn,
      }),
    });

    const body = (await res.json()) as {
      status: string;
      message: string;
      data?: { id?: string | number };
    };

    return {
      success: body.status === "success",
      message: body.message ?? "Flutterwave refund failed",
      providerReference:
        body.data?.id != null ? String(body.data.id) : undefined,
    };
  }

  normalizeWebhook(body: Record<string, unknown>): NormalizedWebhook {
    const data = (body.data ?? body) as Record<string, unknown>;
    return {
      transactionId: String(
        data.tx_ref ?? data.flw_ref ?? data.transactionId ?? "",
      ),
      amount: Number(data.amount ?? 0),
      amountUnit: "ngn",
      event: String(body.event ?? body.status ?? ""),
      raw: body,
    };
  }
}
