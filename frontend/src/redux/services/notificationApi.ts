import { apiSlice }          from "./apiSlice";
import { NOTIFICATION_URL }  from "@/constants/api";
import type { NotificationListResponse } from "@/types/api";

export const notificationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTenantNotifications: builder.query<NotificationListResponse, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 50 } = {}) => ({
        url: `${NOTIFICATION_URL}/tenant?page=${page}&limit=${limit}`,
      }),
      providesTags: ["Notification"],
    }),

    getMyNotifications: builder.query<NotificationListResponse, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 50 } = {}) => ({
        url: `${NOTIFICATION_URL}/me?page=${page}&limit=${limit}`,
      }),
      providesTags: ["Notification"],
    }),
  }),
});

export const {
  useGetTenantNotificationsQuery,
  useGetMyNotificationsQuery,
} = notificationApi;