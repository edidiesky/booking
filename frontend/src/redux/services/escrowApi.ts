import { apiSlice }   from "./apiSlice";
import { ESCROW_URL } from "@/constants/api";
import type { Escrow, EscrowListResponse, EscrowStats, EscrowStatsResponse } from "@/types/api";

interface EscrowResponse { success: boolean; data: Escrow; }

interface RawEscrow {
  id:                 string;
  booking_id:         string;
  tenant_id:          string;
  amount_ngn:         number | string;
  platform_fee_ngn:   number | string;
  host_payout_ngn:    number | string;
  status:             Escrow["status"];
  held_at:            string;
  released_at?:       string | null;
  refunded_at?:       string | null;
  refund_amount_ngn?: number | string | null;
  created_at:         string;
  updated_at:         string;
  booking_ref:        string;
  check_in:           string;
  check_out:          string;
}

function toEscrow(raw: RawEscrow): Escrow {
  return {
    id:              raw.id,
    bookingId:       raw.booking_id,
    tenantId:        raw.tenant_id,
    amountNgn:       Number(raw.amount_ngn),
    platformFeeNgn:  Number(raw.platform_fee_ngn),
    hostPayoutNgn:   Number(raw.host_payout_ngn),
    status:          raw.status,
    heldAt:          raw.held_at,
    releasedAt:      raw.released_at ?? undefined,
    refundedAt:      raw.refunded_at ?? undefined,
    refundAmountNgn: raw.refund_amount_ngn != null ? Number(raw.refund_amount_ngn) : undefined,
    createdAt:       raw.created_at,
    updatedAt:       raw.updated_at,
    bookingRef:      raw.booking_ref,
    checkIn:         raw.check_in,
    checkOut:        raw.check_out,
  };
}

interface RawEscrowStats {
  held:     { count: number; amountNgn: number | string };
  released: { count: number; amountNgn: number | string };
  refunded: { count: number; amountNgn: number | string };
  currentMonthVolumeNgn:  number | string;
  previousMonthVolumeNgn: number | string;
  volumeGrowthPct:        number | string;
}

function toEscrowStats(raw: RawEscrowStats): EscrowStats {
  return {
    held:     { count: raw.held.count,     amountNgn: Number(raw.held.amountNgn) },
    released: { count: raw.released.count, amountNgn: Number(raw.released.amountNgn) },
    refunded: { count: raw.refunded.count, amountNgn: Number(raw.refunded.amountNgn) },
    currentMonthVolumeNgn:  Number(raw.currentMonthVolumeNgn),
    previousMonthVolumeNgn: Number(raw.previousMonthVolumeNgn),
    volumeGrowthPct:        Number(raw.volumeGrowthPct),
  };
}

export const escrowApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTenantEscrow: builder.query<EscrowListResponse, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 20 } = {}) => ({
        url: `${ESCROW_URL}?page=${page}&limit=${limit}`,
      }),
      transformResponse: (response: { success: boolean; data: RawEscrow[] }) => ({
        success: response.success,
        data:    response.data.map(toEscrow),
      }),
      providesTags: ["Escrow"],
    }),

    getTenantEscrowStats: builder.query<EscrowStatsResponse, void>({
      query: () => ({ url: `${ESCROW_URL}/stats` }),
      transformResponse: (response: { success: boolean; data: RawEscrowStats }) => ({
        success: response.success,
        data:    toEscrowStats(response.data),
      }),
      providesTags: ["Escrow"],
    }),

    getEscrowByBooking: builder.query<EscrowResponse, string>({
      query: (bookingId) => ({ url: `${ESCROW_URL}/booking/${bookingId}` }),
      transformResponse: (response: { success: boolean; data: RawEscrow }) => ({
        success: response.success,
        data:    toEscrow(response.data),
      }),
      providesTags: (_r, _e, bookingId) => [{ type: "Escrow", id: bookingId }],
    }),
  }),
});

export const {
  useGetTenantEscrowQuery,
  useGetTenantEscrowStatsQuery,
  useGetEscrowByBookingQuery,
} = escrowApi;