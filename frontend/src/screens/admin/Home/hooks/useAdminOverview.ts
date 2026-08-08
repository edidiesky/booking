import { useGetPlatformStatsQuery } from "@/redux/services/adminApi";
import {
  useListAdminPaymentsQuery,
  useListAdminBookingsQuery,
} from "@/redux/services/adminApi";

export function useAdminOverview() {
  const { data: statsData, isLoading: isStatsLoading } =
    useGetPlatformStatsQuery();
  const { data: paymentsData } = useListAdminPaymentsQuery({
    page: 1,
    limit: 5,
  });
  const { data: bookingsData } = useListAdminBookingsQuery({
    page: 1,
    limit: 5,
  });

  const stats = statsData?.data;

  return {
    isLoading: isStatsLoading,
    totalRevenue: stats?.volume.currentMonthNgn ?? 0,
    revenueGrowthPct: stats?.volume.growthPct ?? 0,
    confirmedCount: stats?.bookings.confirmedCount ?? 0,
    checkedInCount: stats?.bookings.checkedInCount ?? 0,
    cancelledCount: stats?.bookings.cancelledCount ?? 0,
    recentTransactions: paymentsData?.data.payments?.slice(0,2) ?? [],
    recentBookings: bookingsData?.data.bookings ?? [],
    hostPayoutNgn: stats?.revenueSplit.hostPayoutNgn ?? 0,
    platformFeeNgn: stats?.revenueSplit.platformFeeNgn ?? 0,
    propertiesCount: stats?.properties ?? 0,
    paymentsCount: stats?.paymentsCount ?? 0,
    guestsCount: stats?.guests ?? 0,
    activeTenantsCount: stats?.tenants.active ?? 0,
  };
}
