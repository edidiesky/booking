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
  PropertyPerformancePoint,
  PropertySaleComparison,
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
      {
        status?: string;
        checkInAfter?: string;
        checkInBefore?: string;
        page?: number;
        limit?: number;
      }
    >({
      query: ({
        status,
        checkInAfter,
        checkInBefore,
        page = 1,
        limit = 20,
      } = {}) => {
        const qs = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        if (status) qs.set("status", status);
        if (checkInAfter) qs.set("checkInAfter", checkInAfter);
        if (checkInBefore) qs.set("checkInBefore", checkInBefore);
        return { url: `${BOOKING_URL}/mine?${qs.toString()}` };
      },
      providesTags: ["Booking"],
    }),

    getTenantBookings: builder.query<
      BookingListResponse,
      TenantBookingQueryParams
    >({
      query: ({
        status,
        search,
        checkInFrom,
        checkInTo,
        page = 1,
        limit = 20,
      }) => {
        const qs = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        const statuses = Array.isArray(status)
          ? status
          : status
            ? [status]
            : [];
        for (const s of statuses) qs.append("status", s);
        if (search) qs.set("search", search);
        if (checkInFrom) qs.set("checkInFrom", checkInFrom);
        if (checkInTo) qs.set("checkInTo", checkInTo);
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
    getPropertyPerformance: builder.query<
      {
        data: {
          trend: PropertyPerformancePoint[];
          comparison: PropertySaleComparison[];
        };
      },
      { propertyId: string; range: string }
    >({
      query: ({ propertyId, range }) =>
        `${BOOKING_URL}/property/${propertyId}/performance?range=${range}`,
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
  useGetRevenueTrendQuery,
} = bookingApi;
