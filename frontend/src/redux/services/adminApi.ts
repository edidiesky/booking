import { apiSlice } from "./apiSlice";
import type { User, AuditLogEntry, Booking, Property, PaymentSummary } from "@/types/api";
import { ADMIN_URL } from "@/constants/api";

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

interface AdminPaymentListResponse {
  success: boolean;
  data: { payments: (PaymentSummary & PaymentTenantInfo)[]; page: number; limit: number };
}


interface AdminBookingListResponse {
  success: boolean;
  data: { bookings: (Booking & TenantInfo)[]; page: number; limit: number };
}

interface AdminPropertiesResponse {
  success: boolean;
  data: {
    properties: (Property & TenantInfo)[];
    page: number; limit: number; totalCount: number; totalPages: number;
  };
}

export const adminApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listGuests: builder.query<PaginatedResponse<User, "guests">, { page: number; limit?: number }>({
      query: ({ page, limit = 20 }) => ({ url: `${ADMIN_URL}/guests?page=${page}&limit=${limit}` }),
    }),
    listAdministrators: builder.query<PaginatedResponse<User, "administrators">, { page: number; limit?: number }>({
      query: ({ page, limit = 20 }) => ({ url: `${ADMIN_URL}/administrators?page=${page}&limit=${limit}` }),
      providesTags: ["Admin"],
    }),
    promoteAdministrator: builder.mutation<{ success: boolean }, string>({
      query: (userId) => ({ url: `${ADMIN_URL}/administrators/${userId}/promote`, method: "POST" }),
      invalidatesTags: ["Admin"],
    }),
    demoteAdministrator: builder.mutation<{ success: boolean }, string>({
      query: (userId) => ({ url: `${ADMIN_URL}/administrators/${userId}/demote`, method: "POST" }),
      invalidatesTags: ["Admin"],
    }),
    listAuditLogs: builder.query<PaginatedResponse<AuditLogEntry, "logs">, { page: number; limit?: number }>({
      query: ({ page, limit = 30 }) => ({ url: `${ADMIN_URL}/audit-logs?page=${page}&limit=${limit}` }),
    }),
    listAdminProperties: builder.query<AdminPropertiesResponse, { page: number; limit?: number }>({
      query: ({ page, limit = 20 }) => ({ url: `${ADMIN_URL}/properties?page=${page}&limit=${limit}` }),
    }),
    listAdminBookings: builder.query<AdminBookingListResponse, { page: number; limit?: number; status?: string }>({
      query: ({ page, limit = 20, status }) => ({
        url: `${ADMIN_URL}/bookings?page=${page}&limit=${limit}${status ? `&status=${status}` : ""}`,
      }),
    }),
    listAdminPayments: builder.query<AdminPaymentListResponse, { page: number; limit?: number }>({
      query: ({ page, limit = 20 }) => ({ url: `${ADMIN_URL}/payments?page=${page}&limit=${limit}` }),
    }),
    getAdminCalendar: builder.query<{ success: boolean; data: Booking[] }, { startDate: string; endDate: string }>({
      query: ({ startDate, endDate }) => ({ url: `${ADMIN_URL}/calendar?startDate=${startDate}&endDate=${endDate}` }),
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
} = adminApi;