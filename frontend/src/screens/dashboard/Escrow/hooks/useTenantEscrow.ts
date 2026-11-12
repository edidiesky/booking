import {
  useGetTenantEscrowQuery,
  useGetTenantEscrowStatsQuery,
} from "@/redux/services/escrowApi";
import { useClampPage, usePagination } from "@/hooks/usePagination";

const PAGE_SIZE = 10;

export function useTenantEscrow() {
  const { page, setPage } = usePagination();

  const { data, isLoading, isFetching } = useGetTenantEscrowQuery({
    page,
    limit: PAGE_SIZE,
  });
  const { data: statsData, isLoading: isStatsLoading } =
    useGetTenantEscrowStatsQuery();

  useClampPage(data?.meta, page, setPage);

  return {
    escrows: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    isFetching,
    page,
    setPage,
    stats: statsData?.data,
    isStatsLoading,
  };
}