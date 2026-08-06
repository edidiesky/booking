import { apiSlice } from "./apiSlice";
import { BOOKING_URL, PROPERTY_URL } from "@/constants/api";
import type {
  Booking,
  InitiateBookingPayload,
  InitiateBookingResponse,
  CancelBookingPayload,
  BookingListResponse,
  TenantBookingQueryParams,
  ApiSuccessResponse,
  BookingStatsResponse,
} from "@/types/api";

interface BookingResponse {
  success: boolean;
  data: Booking;
}

export const bookingApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    initiateBooking: builder.mutation<
      InitiateBookingResponse,
      InitiateBookingPayload
    >({
      query: (body) => ({ url: BOOKING_URL, method: "POST", body }),
      invalidatesTags: ["Booking", "Availability"],
    }),

    getBookingById: builder.query<BookingResponse, string>({
      query: (id) => ({ url: `${BOOKING_URL}/${id}` }),
      providesTags: (_r, _e, id) => [{ type: "Booking", id }],
    }),

    getMyBookings: builder.query<
      BookingListResponse,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 20 } = {}) => ({
        url: `${BOOKING_URL}/mine?page=${page}&limit=${limit}`,
      }),
      providesTags: ["Booking"],
    }),

    getTenantBookings: builder.query<
      BookingListResponse,
      TenantBookingQueryParams
    >({
      query: ({ status, page = 1, limit = 20 }) => {
        const qs = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        if (status) qs.set("status", status);
        return { url: `${BOOKING_URL}/tenant?${qs.toString()}` };
      },
      providesTags: ["Booking"],
    }),

    getTenantBookingStats: builder.query<BookingStatsResponse, void>({
      query: () => ({ url: `${BOOKING_URL}/tenant/stats` }),
      providesTags: ["Booking"],
    }),

    cancelBooking: builder.mutation<
      ApiSuccessResponse,
      { id: string; body: CancelBookingPayload }
    >({
      query: ({ id, body }) => ({
        url: `${BOOKING_URL}/${id}/cancel`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Booking", id }, "Booking"],
    }),

    checkIn: builder.mutation<BookingResponse, string>({
      query: (id) => ({ url: `${BOOKING_URL}/${id}/checkin`, method: "PATCH" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Booking", id }, "Booking"],
    }),

    checkOut: builder.mutation<BookingResponse, string>({
      query: (id) => ({
        url: `${BOOKING_URL}/${id}/checkout`,
        method: "PATCH",
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: "Booking", id },
        "Booking",
        "Escrow",
      ],
    }),

    getRevenueTrend: builder.query<
      {
        success: boolean;
        data: { day: string; hostPayout: number; platformFee: number }[];
      },
      { range: string }
    >({
      query: ({ range }) => ({
        url: `${BOOKING_URL}/tenant/revenue-trend?range=${range}`,
      }),
    }),

    getBookingsInRange: builder.query<
      { success: boolean; data: import("@/types/api").Booking[] },
      { from: string; to: string }
    >({
      query: ({ from, to }) => ({
        url: `${PROPERTY_URL}/gantt/bookings-in-range?from=${from}&to=${to}`,
      }),
    }),
    transitionBookingStatus: builder.mutation<
      BookingResponse,
      { id: string; status: string }
    >({
      query: ({ id, status }) => ({
        url: `${BOOKING_URL}/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Booking", id }, "Booking"],
    }),
  }),
});

export const {
  useInitiateBookingMutation,
  useGetBookingByIdQuery,
  useGetMyBookingsQuery,
  useGetTenantBookingsQuery,
  useGetTenantBookingStatsQuery,
  useCancelBookingMutation,
  useCheckInMutation,
  useCheckOutMutation,
  useLazyGetBookingsInRangeQuery,
  useTransitionBookingStatusMutation,
  useGetRevenueTrendQuery
} = bookingApi;
