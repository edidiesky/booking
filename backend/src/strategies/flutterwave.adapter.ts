import axios  from "axios";
import logger  from "../utils/logger";
import { IAdapterRequest, IPaymentAdapter, IPaymentProcessRequest, IPaymentRefundRequest, IPaymentResponse } from "./index";

const createFlutterwaveAdapter = ({ secretKey }: IAdapterRequest): IPaymentAdapter => {
  if (!secretKey) {
    return {
      async process(): Promise<IPaymentResponse> {
        return { success: false, message: "Flutterwave not configured." };
      },
    };
  }

  const client = axios.create({
    baseURL: "https://api.flutterwave.com/v3",
    headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
    timeout: 15_000,
  });

  return {
    async process(body: IPaymentProcessRequest): Promise<IPaymentResponse> {
      const { amount, callbackUrl, currency = "NGN", email, phone, userId, name } = body;
      const txRef = `bk_flw_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      try {
        const { data } = await client.post("/payments", {
          tx_ref:        txRef,
          amount:        Number(amount),
          currency,
          redirect_url:  callbackUrl,
          customer:      { email, phonenumber: phone, name },
          customizations:{ title: "Booking Payment" },
          meta:          { userId },
        });

        if (data.status !== "success") throw new Error(data.message ?? "Flutterwave init failed.");

        return {
          success:       true,
          message:       "Payment initialized.",
          transactionId: txRef,
          redirectUrl:   data.data.link as string,
        };
      } catch (err) {
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        logger.error("flutterwave_init_failed", { event: "flutterwave_init_failed", error: error.response?.data?.message ?? error.message });
        return { success: false, message: error.response?.data?.message ?? error.message ?? "Payment init failed." };
      }
    },

    async refund({ transactionId, amount }: IPaymentRefundRequest): Promise<IPaymentResponse> {
      try {
        const { data } = await client.post(`/transactions/${transactionId}/refund`, { amount: Number(amount) });
        return { success: data.status === "success", message: data.message, transactionId };
      } catch (err) {
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        return { success: false, message: error.response?.data?.message ?? error.message ?? "Refund failed." };
      }
    },

    verifyWebhook(_payload: unknown, signature?: string): boolean {
      const webhookSecret = process.env.FLW_WEBHOOK_SECRET ?? secretKey;
      return signature === webhookSecret;
    },

    extractTransactionId(payload: unknown): string {
      const p = payload as { data?: { tx_ref?: string } };
      return p.data?.tx_ref ?? "";
    },

    extractStatus(payload: unknown): "success" | "failed" | "pending" {
      const p = payload as { event?: string; data?: { status?: string } };
      if (p.data?.status === "successful") return "success";
      if (p.data?.status === "failed")     return "failed";
      return "pending";
    },

    extractAmount(payload: unknown): number {
      const p = payload as { data?: { amount?: number } };
      return Number(p.data?.amount ?? 0);
    },

    extractMetadata(payload: unknown): Record<string, unknown> {
      const p = payload as { data?: { meta?: Record<string, unknown>; payment_type?: string; id?: number } };
      return {
        channel:    p.data?.payment_type,
        gatewayRef: p.data?.id,
        ...(p.data?.meta ?? {}),
      };
    },
  };
};

export default createFlutterwaveAdapter;
