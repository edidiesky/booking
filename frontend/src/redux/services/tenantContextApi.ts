import { apiSlice } from "./apiSlice";
import { TENANT_URL } from "@/constants/api";

export interface ResolvedTenant {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
}

interface Response { success: boolean; data: ResolvedTenant; }

export const tenantContextApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    resolveTenantBySubdomain: builder.query<ResolvedTenant, string>({
      query: (subdomain) => ({ url: `${TENANT_URL}/by-subdomain/${subdomain}` }),
      transformResponse: (res: Response) => res.data,
    }),
  }),
});

export const { useResolveTenantBySubdomainQuery } = tenantContextApi;