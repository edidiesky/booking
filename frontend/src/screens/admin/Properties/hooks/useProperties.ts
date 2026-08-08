import { useState } from "react";
import { useListAdminPropertiesQuery, useGetPlatformStatsQuery } from "@/redux/services/adminApi";

export function useAdminProperties() {
  const [page, setPage] = useState(1);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useListAdminPropertiesQuery({ page, limit: 20 });
  const { data: statsData, isLoading: isStatsLoading } = useGetPlatformStatsQuery();

  const properties = data?.data.properties ?? [];

  return {
    properties, isLoading, isFetching,
    page, setPage,
    totalPages: data?.data.totalPages ?? 1,
    selectedPropertyId, setSelectedPropertyId,
    stats: statsData?.data.propertyBreakdown,
    isStatsLoading,
  };
}