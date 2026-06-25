import axios  from "axios";
import crypto from "crypto";
import logger  from "../utils/logger";
import { IAdapterRequest, IPaymentAdapter, IPaymentProcessRequest, IPaymentRefundRequest, IPaymentResponse } from "./index";

const createPaystackAdapter = ({ secretKey }: IAdapterRequest): IPaymentAdapter => {
  if (!secretKey) throw new Error("Paystack secret key is required.");

  const client = axios.create({
    baseURL:  "https://api.paystack.co",
    headers:  { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
    timeout:  15_000,
  });

  return {
    async process(body: IPaymentProcessRequest): Promise<IPaymentResponse> {
      const { amount, callbackUrl, currency = "NGN", email, phone, userId, name, metadata } = body;
      const reference = `bk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      try {
        const { data } = await client.post("/transaction/initialize", {
          amount:       Math.round(Number(amount) * 100),
          currency,
          email,
          reference,
          callback_url: callbackUrl,
          metadata:     { userId, name, phone, ...metadata },
          channels:     ["card", "bank", "ussd", "qr", "mobile_money", "bank_transfer"],
        });

        if (!data.status) throw new Error(data.message ?? "Paystack init failed.");

        return {
          success:       true,
          message:       "Payment initialized.",
          transactionId: reference,
          redirectUrl:   data.data.authorization_url as string,
        };
      } catch (err) {
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        logger.error("paystack_init_failed", { event: "paystack_init_failed", error: error.response?.data?.message ?? error.message });
        return { success: false, message: error.response?.data?.message ?? error.message ?? "Payment init failed." };
      }
    },

    async refund({ transactionId, amount, reason }: IPaymentRefundRequest): Promise<IPaymentResponse> {
      try {
        const payload: Record<string, unknown> = { transaction: transactionId };
        if (amount) payload["amount"] = Math.round(amount * 100);
        if (reason) payload["reason"] = reason;

        const { data } = await client.post("/refund", payload);
        return { success: data.status, message: data.message, transactionId: data.data?.refund_id ?? transactionId };
      } catch (err) {
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        return { success: false, message: error.response?.data?.message ?? error.message ?? "Refund failed." };
      }
    },

    verifyWebhook(payload: unknown, signature?: string): boolean {
      if (!signature) return false;
      const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET ?? secretKey;
      const hash = crypto
        .createHmac("sha512", webhookSecret)
        .update(JSON.stringify(payload))
        .digest("hex");
      return hash === signature;
    },

    extractTransactionId(payload: unknown): string {
      const p = payload as { data?: { reference?: string } };
      return p.data?.reference ?? "";
    },

    extractStatus(payload: unknown): "success" | "failed" | "pending" {
      const p = payload as { event?: string; data?: { status?: string } };
      if (p.event === "charge.success") return "success";
      if (p.event === "charge.failed")  return "failed";
      return "pending";
    },

    extractAmount(payload: unknown): number {
      const p = payload as { data?: { amount?: number } };
      return Number(p.data?.amount ?? 0) / 100;
    },

    extractMetadata(payload: unknown): Record<string, unknown> {
      const p = payload as { data?: { metadata?: Record<string, unknown>; channel?: string; id?: number } };
      return {
        channel:     p.data?.channel,
        gatewayRef:  p.data?.id,
        ...(p.data?.metadata ?? {}),
      };
    },
  };
};

export default createPaystackAdapter;
