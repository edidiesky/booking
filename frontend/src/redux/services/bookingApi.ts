import { apiSlice }     from "./apiSlice";
import { BOOKING_URL }  from "@/constants/api";
import type {
  Booking, InitiateBookingPayload, InitiateBookingResponse,
  CancelBookingPayload, BookingListResponse,
  TenantBookingQueryParams, ApiSuccessResponse,
} from "@/types/api";

interface BookingResponse { success: boolean; data: Booking; }

export const bookingApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    initiateBooking: builder.mutation<InitiateBookingResponse, InitiateBookingPayload>({
      query: (body) => ({ url: BOOKING_URL, method: "POST", body }),
      invalidatesTags: ["Booking", "Availability"],
    }),

    getBookingById: builder.query<BookingResponse, string>({
      query: (id) => ({ url: `${BOOKING_URL}/${id}` }),
      providesTags: (_r, _e, id) => [{ type: "Booking", id }],
    }),

    getMyBookings: builder.query<BookingListResponse, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 20 } = {}) => ({ url: `${BOOKING_URL}/mine?page=${page}&limit=${limit}` }),
      providesTags: ["Booking"],
    }),

    getTenantBookings: builder.query<BookingListResponse, TenantBookingQueryParams>({
      query: ({ status, page = 1, limit = 20 }) => {
        const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (status) qs.set("status", status);
        return { url: `${BOOKING_URL}/tenant?${qs.toString()}` };
      },
      providesTags: ["Booking"],
    }),

    cancelBooking: builder.mutation<ApiSuccessResponse, { id: string; body: CancelBookingPayload }>({
      query: ({ id, body }) => ({ url: `${BOOKING_URL}/${id}/cancel`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Booking", id }, "Booking"],
    }),

    checkIn: builder.mutation<BookingResponse, string>({
      query: (id) => ({ url: `${BOOKING_URL}/${id}/checkin`, method: "PATCH" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Booking", id }, "Booking"],
    }),

    checkOut: builder.mutation<BookingResponse, string>({
      query: (id) => ({ url: `${BOOKING_URL}/${id}/checkout`, method: "PATCH" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Booking", id }, "Booking", "Escrow"],
    }),
  }),
});

export const {
  useInitiateBookingMutation,
  useGetBookingByIdQuery,
  useGetMyBookingsQuery,
  useGetTenantBookingsQuery,
  useCancelBookingMutation,
  useCheckInMutation,
  useCheckOutMutation,
} = bookingApi;