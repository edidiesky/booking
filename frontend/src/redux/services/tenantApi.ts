import { apiSlice } from "./apiSlice";
import { TENANT_URL } from "@/constants/api";
import type {
  Tenant,
  UpdateTenantSettingsPayload,
  UpdateCancellationPolicyPayload,
  AdminTenantDetailResponse,
} from "@/types/api";

interface TenantResponse {
  success: boolean;
  data: Tenant;
}
interface TenantListResponse {
  success: boolean;
  data: Tenant[];
}

interface HostProfileResponse {
  success: boolean;
  data: {
    tenant: {
      id: string;
      name: string;
      slug: string;
      createdAt: string;
      settings: { timezone: string; currency: string; locale: string };
      bio: string | null;
      avatarUrl: string | null;
      city: string | null;
      state: string | null;
      country: string | null;
    };
    properties: {
      id: string;
      name: string;
      images: string[];
      city: string;
      property_type: string;
      roomTypes: {
        id: string;
        property_id: string;
        name: string;
        base_price_ngn: number;
        max_occupancy: number;
        images: string[];
      }[];
    }[];
    recentReviews: {
      id: string;
      rating: number;
      title: string;
      comment: string;
      guest_first_name?: string;
      guest_last_name?: string;
      guest_profile_image?: string | null;
      created_at: string;
    }[];
    stats: { avgRating: number; totalReviews: number; totalBookings: number };
  };
}

export const tenantApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Host: get own tenant (requires x-tenant-slug header)
    getMyTenant: builder.query<TenantResponse, void>({
      query: () => ({ url: `${TENANT_URL}/me` }),
      providesTags: ["Tenant"],
    }),

    getHostProfile: builder.query<HostProfileResponse, string>({
      query: (tenantId) => ({ url: `${TENANT_URL}/${tenantId}/profile` }),
      providesTags: (_r, _e, id) => [{ type: "Tenant", id }],
    }),

    // Host: update tenant settings
    updateSettings: builder.mutation<
      TenantResponse,
      UpdateTenantSettingsPayload
    >({
      query: (body) => ({
        url: `${TENANT_URL}/me/settings`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Tenant"],
    }),

    // Host: update own bio/avatar/location, real dedicated columns on
    // tenants, not part of the settings JSONB blob.
    updateProfile: builder.mutation<
      TenantResponse,
      {
        bio?: string;
        avatarUrl?: string;
        city?: string;
        state?: string;
        country?: string;
      }
    >({
      query: (body) => ({
        url: `${TENANT_URL}/me/profile`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Tenant"],
    }),

    // Host: update cancellation policy
    updateCancellationPolicy: builder.mutation<
      TenantResponse,
      UpdateCancellationPolicyPayload
    >({
      query: (body) => ({
        url: `${TENANT_URL}/me/policy`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Tenant"],
    }),

    // Platform admin: list all tenants
    listTenants: builder.query<
      TenantListResponse,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 20 } = {}) => ({
        url: `${TENANT_URL}?page=${page}&limit=${limit}`,
      }),
      providesTags: ["Tenant"],
    }),

    // Platform admin: suspend a tenant
    suspendTenant: builder.mutation<TenantResponse, string>({
      query: (tenantId) => ({
        url: `${TENANT_URL}/${tenantId}/suspend`,
        method: "PATCH",
      }),
      invalidatesTags: ["Tenant"],
    }),

    // Platform admin: activate a tenant
    activateTenant: builder.mutation<TenantResponse, string>({
      query: (tenantId) => ({
        url: `${TENANT_URL}/${tenantId}/activate`,
        method: "PATCH",
      }),
      invalidatesTags: ["Tenant"],
    }),
    getAdminTenantDetail: builder.query<AdminTenantDetailResponse, string>({
      query: (tenantId) => ({ url: `${TENANT_URL}/${tenantId}/admin-detail` }),
      providesTags: (_r, _e, tenantId) => [{ type: "Tenant", id: tenantId }],
    }),
  }),
});

export const {
  useGetMyTenantQuery,
  useGetHostProfileQuery,
  useUpdateSettingsMutation,
  useUpdateProfileMutation,
  useUpdateCancellationPolicyMutation,
  useListTenantsQuery,
  useSuspendTenantMutation,
  useActivateTenantMutation,
  useGetAdminTenantDetailQuery
} = tenantApi;
