import { useState } from "react";
import { useListAdminEscrowQuery, useGetAdminEscrowStatsQuery } from "@/redux/services/adminApi";

export function useAdminEscrow() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useListAdminEscrowQuery({ page, limit: 8 });
  const { data: statsData, isLoading: isStatsLoading } = useGetAdminEscrowStatsQuery();

  return {
    escrows: data?.data.escrows ?? [],
    isLoading, isFetching,
    page, setPage,
    stats: statsData?.data,
    isStatsLoading,
  };
}