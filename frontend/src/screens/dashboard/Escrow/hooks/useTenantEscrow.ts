import { useState } from "react";
import { useGetTenantEscrowQuery, useGetTenantEscrowStatsQuery } from "@/redux/services/escrowApi";

export function useTenantEscrow() {
  const [page, setPage] = useState(1);

  const { data, isLoading }             = useGetTenantEscrowQuery({ page, limit: 10 });
  const { data: statsData, isLoading: isStatsLoading } = useGetTenantEscrowStatsQuery();

  const escrows = data?.data ?? [];
  const stats   = statsData?.data;

  return {
    escrows,
    isLoading,
    page,
    setPage,
    stats,
    isStatsLoading,
  };
}