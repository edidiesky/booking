import { apiSlice }   from "./apiSlice";
import { ESCROW_URL } from "@/constants/api";
import type { Escrow, EscrowListResponse } from "@/types/api";

interface EscrowResponse { success: boolean; data: Escrow; }

export const escrowApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTenantEscrow: builder.query<EscrowListResponse, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 20 } = {}) => ({
        url: `${ESCROW_URL}?page=${page}&limit=${limit}`,
      }),
      providesTags: ["Escrow"],
    }),

    getEscrowByBooking: builder.query<EscrowResponse, string>({
      query: (bookingId) => ({ url: `${ESCROW_URL}/booking/${bookingId}` }),
      providesTags: (_r, _e, bookingId) => [{ type: "Escrow", id: bookingId }],
    }),
  }),
});

export const {
  useGetTenantEscrowQuery,
  useGetEscrowByBookingQuery,
} = escrowApi;