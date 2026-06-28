import { apiSlice }   from "./apiSlice";
import { TENANT_URL } from "@/constants/api";
import type {
  Tenant,
  UpdateTenantSettingsPayload,
  UpdateCancellationPolicyPayload,
} from "@/types/api";

interface TenantResponse      { success: boolean; data: Tenant;   }
interface TenantListResponse  { success: boolean; data: Tenant[]; }

export const tenantApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    // Host: get own tenant (requires x-tenant-slug header)
    getMyTenant: builder.query<TenantResponse, void>({
      query: () => ({ url: `${TENANT_URL}/me` }),
      providesTags: ["Tenant"],
    }),

    // Host: update tenant settings
    updateSettings: builder.mutation<TenantResponse, UpdateTenantSettingsPayload>({
      query: (body) => ({ url: `${TENANT_URL}/me/settings`, method: "PATCH", body }),
      invalidatesTags: ["Tenant"],
    }),

    // Host: update cancellation policy
    updateCancellationPolicy: builder.mutation<TenantResponse, UpdateCancellationPolicyPayload>({
      query: (body) => ({ url: `${TENANT_URL}/me/policy`, method: "PATCH", body }),
      invalidatesTags: ["Tenant"],
    }),

    // Platform admin: list all tenants
    listTenants: builder.query<TenantListResponse, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 20 } = {}) => ({
        url: `${TENANT_URL}?page=${page}&limit=${limit}`,
      }),
      providesTags: ["Tenant"],
    }),

    // Platform admin: suspend a tenant
    suspendTenant: builder.mutation<TenantResponse, string>({
      query: (tenantId) => ({ url: `${TENANT_URL}/${tenantId}/suspend`, method: "PATCH" }),
      invalidatesTags: ["Tenant"],
    }),

    // Platform admin: activate a tenant
    activateTenant: builder.mutation<TenantResponse, string>({
      query: (tenantId) => ({ url: `${TENANT_URL}/${tenantId}/activate`, method: "PATCH" }),
      invalidatesTags: ["Tenant"],
    }),
  }),
});

export const {
  useGetMyTenantQuery,
  useUpdateSettingsMutation,
  useUpdateCancellationPolicyMutation,
  useListTenantsQuery,
  useSuspendTenantMutation,
  useActivateTenantMutation,
} = tenantApi;