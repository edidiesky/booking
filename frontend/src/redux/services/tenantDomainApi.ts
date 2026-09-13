import { apiSlice } from "./apiSlice";
import { TENANT_URL } from "@/constants/api";

export interface TenantDomainInfo {
  subdomain: string | null;
  customDomain: string | null;
  customDomainStatus: "none" | "pending" | "verified" | "failed";
  customDomainVerificationToken: string | null;
}

interface RawTenantDomainInfo {
  subdomain: string | null;
  custom_domain: string | null;
  custom_domain_status: "none" | "pending" | "verified" | "failed";
  custom_domain_verification_token: string | null;
}

function toDomainInfo(raw: RawTenantDomainInfo): TenantDomainInfo {
  return {
    subdomain: raw.subdomain,
    customDomain: raw.custom_domain,
    customDomainStatus: raw.custom_domain_status,
    customDomainVerificationToken: raw.custom_domain_verification_token,
  };
}

interface Response {
  success: boolean;
  data: RawTenantDomainInfo;
}

export const tenantDomainApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDomainInfo: builder.query<TenantDomainInfo, void>({
      query: () => ({ url: `${TENANT_URL}/me` }),
      transformResponse: (res: Response) => toDomainInfo(res.data),
      providesTags: ["Tenant"],
    }),
    claimSubdomain: builder.mutation<TenantDomainInfo, string>({
      query: (subdomain) => ({
        url: `${TENANT_URL}/me/subdomain`,
        method: "PATCH",
        body: { subdomain },
      }),
      transformResponse: (res: Response) => toDomainInfo(res.data),
      invalidatesTags: ["Tenant"],
    }),
    addCustomDomain: builder.mutation<TenantDomainInfo, string>({
      query: (domain) => ({
        url: `${TENANT_URL}/me/custom-domain`,
        method: "POST",
        body: { domain },
      }),
      transformResponse: (res: Response) => toDomainInfo(res.data),
      invalidatesTags: ["Tenant"],
    }),
    verifyCustomDomain: builder.mutation<TenantDomainInfo, void>({
      query: () => ({
        url: `${TENANT_URL}/me/custom-domain/verify`,
        method: "POST",
      }),
      transformResponse: (res: Response) => toDomainInfo(res.data),
      invalidatesTags: ["Tenant"],
    }),
    removeCustomDomain: builder.mutation<TenantDomainInfo, void>({
      query: () => ({
        url: `${TENANT_URL}/me/custom-domain`,
        method: "DELETE",
      }),
      transformResponse: (res: Response) => toDomainInfo(res.data),
      invalidatesTags: ["Tenant"],
    }),
  }),
});

export const {
  useGetDomainInfoQuery,
  useClaimSubdomainMutation,
  useAddCustomDomainMutation,
  useVerifyCustomDomainMutation,
  useRemoveCustomDomainMutation,
} = tenantDomainApi;
