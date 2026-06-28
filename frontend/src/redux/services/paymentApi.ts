import { apiSlice }    from "./apiSlice";
import { PAYMENT_URL } from "@/constants/api";
import type {
  InitializePaymentPayload, InitializePaymentResponse,
  Payment, PaymentListResponse,
} from "@/types/api";

interface PaymentResponse { success: boolean; data: Payment; }

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

    getTenantPayments: builder.query<PaymentListResponse, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 20 } = {}) => ({
        url: `${PAYMENT_URL}/tenant?page=${page}&limit=${limit}`,
      }),
      providesTags: ["Payment"],
    }),
  }),
});

export const {
  useInitializePaymentMutation,
  useGetPaymentByBookingQuery,
  useGetTenantPaymentsQuery,
} = paymentApi;