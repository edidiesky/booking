import { apiSlice }    from "./apiSlice";
import { PAYMENT_URL } from "@/constants/api";
import type {
  InitializePaymentPayload, InitializePaymentResponse,
  Payment, PaymentSummary, PaymentStatsResponse,
} from "@/types/api";

interface PaymentResponse { success: boolean; data: Payment; }
interface PaymentSummaryListResponse { success: boolean; data: PaymentSummary[]; }

export const paymentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    initializePayment: builder.mutation<InitializePaymentResponse, InitializePaymentPayload>({
      query: (body) => ({ url: `${PAYMENT_URL}/initialize`, method: "POST", body }),
      invalidatesTags: ["Payment"],
    }),

    getPaymentByBooking: builder.query<PaymentResponse, string>({
      query: (bookingId) => ({ url: `${PAYMENT_URL}/booking/${bookingId}` }),
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