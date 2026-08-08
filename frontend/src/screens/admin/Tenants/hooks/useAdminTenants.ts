import { useState } from "react";
import {
  useListTenantsQuery,
  useSuspendTenantMutation,
  useActivateTenantMutation,
} from "@/redux/services/tenantApi";
import { useGetPlatformStatsQuery } from "@/redux/services/adminApi";
import { showToast } from "@/components/common/Toast";
import type { Tenant } from "@/types/api";

export function useAdminTenants() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useListTenantsQuery({ page, limit: 20 });
  const { data: statsData } = useGetPlatformStatsQuery();
  const [suspend, { isLoading: isSuspending }] = useSuspendTenantMutation();
  const [activate, { isLoading: isActivating }] = useActivateTenantMutation();

  const allTenants = data?.data ?? [];
  const tenants = search
    ? allTenants.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.slug.toLowerCase().includes(search.toLowerCase()),
      )
    : allTenants;

  const handleToggleStatus = async (tenant: Tenant) => {
    try {
      if (tenant.status === "suspended") {
        await activate(tenant.id).unwrap();
        showToast(`${tenant.name} reactivated.`, "success");
      } else {
        await suspend(tenant.id).unwrap();
        showToast(`${tenant.name} suspended.`, "success");
      }
    } catch {
      /* errorMiddleware */
    }
  };

  return {
    tenants,
    isLoading,
    search, setSearch,
    page, setPage,
    handleToggleStatus,
    isTogglingStatus: isSuspending || isActivating,
    stats: statsData?.data.tenants,
  };
}