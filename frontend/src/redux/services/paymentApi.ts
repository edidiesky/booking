import { apiSlice }    from "./apiSlice";
import { PAYMENT_URL } from "@/constants/api";
import type {
  InitializePaymentPayload, InitializePaymentResponse,
  Payment, PaymentSummary, PaymentStatsResponse,
} from "@/types/api";

interface PaymentResponse { success: boolean; data: Payment; }
interface PaymentSummaryListResponse { success: boolean; data: PaymentSummary[]; }

interface RawPayment {
  id: string; booking_id: string; tenant_id: string; guest_user_id: string;
  gateway: Payment["gateway"]; transaction_id?: string; amount_ngn: number | string;
  status: Payment["status"]; channel?: string; paid_at?: string; refunded_at?: string;
  created_at: string; updated_at: string;
}

function toPayment(raw: RawPayment): Payment {
  return {
    id: raw.id, bookingId: raw.booking_id, tenantId: raw.tenant_id, guestUserId: raw.guest_user_id,
    gateway: raw.gateway, transactionId: raw.transaction_id, amountNgn: Number(raw.amount_ngn),
    status: raw.status, channel: raw.channel, paidAt: raw.paid_at, refundedAt: raw.refunded_at,
    createdAt: raw.created_at, updatedAt: raw.updated_at,
  };
}

export const paymentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    initializePayment: builder.mutation<InitializePaymentResponse, InitializePaymentPayload>({
      query: (body) => ({ url: `${PAYMENT_URL}/initialize`, method: "POST", body }),
      invalidatesTags: ["Payment"],
    }),

    getPaymentByBooking: builder.query<PaymentResponse, string>({
      query: (bookingId) => ({ url: `${PAYMENT_URL}/booking/${bookingId}` }),
      transformResponse: (r: { success: boolean; data: RawPayment }) => ({
        success: r.success, data: toPayment(r.data),
      }),
      providesTags: (_r, _e, bookingId) => [{ type: "Payment", id: bookingId }],
    }),

    getTenantPayments: builder.query<PaymentSummaryListResponse, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 20 } = {}) => ({
        url: `${PAYMENT_URL}/tenant?page=${page}&limit=${limit}`,
      }),
      providesTags: ["Payment"],
    }),

    getTenantPaymentStats: builder.query<PaymentStatsResponse, void>({
      query: () => ({ url: `${PAYMENT_URL}/tenant/stats` }),
      providesTags: ["Payment"],
    }),
  }),
});

export const {
  useInitializePaymentMutation,
  useGetPaymentByBookingQuery,
  useGetTenantPaymentsQuery,
  useGetTenantPaymentStatsQuery,
} = paymentApi;