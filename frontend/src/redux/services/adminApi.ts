import { apiSlice } from "./apiSlice";
import type {
  User,
  AuditLogEntry,
  Booking,
  Property,
  AdminPaymentSummary,
} from "@/types/api";
import { ADMIN_URL } from "@/constants/api";
interface AdminGuestSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  profileImage: string | null;
  status: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  twoFactorEnabled: boolean;
  googleId: string | null;
  lastActiveAt: string | null;
  createdAt: string;
}
interface PaginatedResponse<T, K extends string> {
  success: boolean;
  data: { [key in K]: T[] } & {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

interface TenantInfo {
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
}

interface PaymentTenantInfo {
  tenant_id: string;
  tenant_name: string;
  tenant_email: string;
}

interface AdminBookingListResponse {
  success: boolean;
  data: { bookings: (Booking & TenantInfo)[]; page: number; limit: number };
}

interface AdminPropertiesResponse {
  success: boolean;
  data: {
    properties: (Property & TenantInfo)[];
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

interface AdminPaymentListResponse {
  success: boolean;
  data: { payments: (AdminPaymentSummary & PaymentTenantInfo)[]; page: number; limit: number };
}

export const adminApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listGuests: builder.query<
      PaginatedResponse<AdminGuestSummary, "guests">,
      { page: number; limit?: number }
    >({
      query: ({ page, limit = 20 }) => ({
        url: `${ADMIN_URL}/guests?page=${page}&limit=${limit}`,
      }),
    }),
    listAdministrators: builder.query<
      PaginatedResponse<User, "administrators">,
      { page: number; limit?: number }
    >({
      query: ({ page, limit = 20 }) => ({
        url: `${ADMIN_URL}/administrators?page=${page}&limit=${limit}`,
      }),
      providesTags: ["Admin"],
    }),
    promoteAdministrator: builder.mutation<{ success: boolean }, string>({
      query: (userId) => ({
        url: `${ADMIN_URL}/administrators/${userId}/promote`,
        method: "POST",
      }),
      invalidatesTags: ["Admin"],
    }),
    demoteAdministrator: builder.mutation<{ success: boolean }, string>({
      query: (userId) => ({
        url: `${ADMIN_URL}/administrators/${userId}/demote`,
        method: "POST",
      }),
      invalidatesTags: ["Admin"],
    }),
    listAuditLogs: builder.query<
      PaginatedResponse<AuditLogEntry, "logs">,
      { page: number; limit?: number }
    >({
      query: ({ page, limit = 30 }) => ({
        url: `${ADMIN_URL}/audit-logs?page=${page}&limit=${limit}`,
      }),
    }),
    listAdminProperties: builder.query<
      AdminPropertiesResponse,
      { page: number; limit?: number; tenantId?: string }
    >({
      query: ({ page, limit = 20, tenantId }) => ({
        url: `${ADMIN_URL}/properties?page=${page}&limit=${limit}${tenantId ? `&tenantId=${tenantId}` : ""}`,
      }),
    }),
    listAdminBookings: builder.query<
      AdminBookingListResponse,
      { page: number; limit?: number; status?: string; tenantId?: string }
    >({
      query: ({ page, limit = 20, status, tenantId }) => ({
        url: `${ADMIN_URL}/bookings?page=${page}&limit=${limit}${status ? `&status=${status}` : ""}${tenantId ? `&tenantId=${tenantId}` : ""}`,
      }),
    }),
    listAdminPayments: builder.query<
      AdminPaymentListResponse,
      { page: number; limit?: number; tenantId?: string }
    >({
      query: ({ page, limit = 20, tenantId }) => ({
        url: `${ADMIN_URL}/payments?page=${page}&limit=${limit}${tenantId ? `&tenantId=${tenantId}` : ""}`,
      }),
    }),
    getAdminCalendar: builder.query<
      { success: boolean; data: Booking[] },
      { startDate: string; endDate: string }
    >({
      query: ({ startDate, endDate }) => ({
        url: `${ADMIN_URL}/calendar?startDate=${startDate}&endDate=${endDate}`,
      }),
    }),
    listAdminNotifications: builder.query<
      {
        success: boolean;
        data: {
          notifications: {
            id: string;
            type: string;
            title: string;
            body: string;
            isRead: boolean;
            tenantName: string;
            createdAt: string;
          }[];
          page: number;
          limit: number;
          unreadCount:   number;
          totalPages:number
        };
      },
      { page: number; limit?: number; tenantId?: string }
    >({
      query: ({ page, limit = 30, tenantId }) => ({
        url: `${ADMIN_URL}/notifications?page=${page}&limit=${limit}${tenantId ? `&tenantId=${tenantId}` : ""}`,
      }),
    }),
    getTenantActivity: builder.query<
      {
        success: boolean;
        data: { logs: AuditLogEntry[]; page: number; limit: number };
      },
      { tenantId: string; page: number; limit?: number }
    >({
      query: ({ tenantId, page, limit = 20 }) => ({
        url: `${ADMIN_URL}/tenants/${tenantId}/activity?page=${page}&limit=${limit}`,
      }),
    }),

    getPlatformStats: builder.query<
      {
        success: boolean;
        data: {
          tenants: { active: number; suspended: number; draft: number };
          guests: number;
          administrators: number;
          properties: number;
          guestBreakdown:number;
          bookings: {
            confirmedCount: number;
            checkedInCount: number;
            checkedOutCount: number;
            cancelledCount: number;
            pendingCount: number;
          };
          volume: {
            currentMonthNgn: number;
            previousMonthNgn: number;
            growthPct: number;
          };
          revenueSplit: {
            hostPayoutNgn: number;
            platformFeeNgn: number;
          };
          paymentsCount: number;
        };
      },
      void
    >({
      query: () => ({ url: `${ADMIN_URL}/stats` }),
    }),

    getAdminRevenueTrend: builder.query<
      {
        success: boolean;
        data: { day: string; hostPayout: number; platformFee: number }[];
      },
      { range: string }
    >({
      query: ({ range }) => ({
        url: `${ADMIN_URL}/revenue-trend?range=${range}`,
      }),
    }),
  }),
});

export const {
  useListGuestsQuery,
  useListAdministratorsQuery,
  usePromoteAdministratorMutation,
  useDemoteAdministratorMutation,
  useListAuditLogsQuery,
  useListAdminPropertiesQuery,
  useListAdminBookingsQuery,
  useListAdminPaymentsQuery,
  useGetAdminCalendarQuery,
  useGetTenantActivityQuery,
  useGetPlatformStatsQuery,
  useListAdminNotificationsQuery,
  useGetAdminRevenueTrendQuery,
} = adminApi;
