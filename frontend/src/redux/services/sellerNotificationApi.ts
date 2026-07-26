import { apiSlice } from "./apiSlice";
import { SELLER_NOTIFICATION_URL } from "@/constants/api";
import type { SellerNotificationListResponse } from "@/types/api";

export const sellerNotificationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listSellerNotifications: builder.query<SellerNotificationListResponse, { page?: number } | void>({
      query: (params) => ({ url: `${SELLER_NOTIFICATION_URL}?page=${params?.page ?? 1}` }),
      providesTags: ["SellerNotification"],
    }),

    markNotificationRead: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `${SELLER_NOTIFICATION_URL}/${id}/read`, method: "PATCH" }),
      invalidatesTags: ["SellerNotification"],
    }),

    markAllNotificationsRead: builder.mutation<{ success: boolean }, void>({
      query: () => ({ url: `${SELLER_NOTIFICATION_URL}/read-all`, method: "PATCH" }),
      invalidatesTags: ["SellerNotification"],
    }),
  }),
});

export const {
  useListSellerNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = sellerNotificationApi;