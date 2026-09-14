import { useMemo } from "react";
import { getSubdomainFromHostname } from "@/utils/subdomain";
import { useResolveTenantBySubdomainQuery } from "@/redux/services/tenantContextApi";

export function useTenantContext() {
  const subdomain = useMemo(() => getSubdomainFromHostname(), []);

  const { data, isLoading, isError } = useResolveTenantBySubdomainQuery(subdomain!, {
    skip: !subdomain,
  });

  return {
    isSubdomainContext: !!subdomain,
    subdomain,
    tenantId: data?.tenantId ?? null,
    tenantName: data?.tenantName ?? null,
    isUnresolvedSubdomain: !!subdomain && !isLoading && (isError || !data),
    isLoading: !!subdomain && isLoading,
  };
}