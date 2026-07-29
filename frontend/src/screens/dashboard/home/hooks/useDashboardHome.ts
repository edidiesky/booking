import { useGetTenantBookingsQuery, useGetTenantBookingStatsQuery } from "@/redux/services/bookingApi";
import { useGetTenantPaymentsQuery } from "@/redux/services/paymentApi";
import { useGetMyTenantQuery }       from "@/redux/services/tenantApi";

export function useDashboardHome() {
  const { data: tenantData }   = useGetMyTenantQuery();
  const { data: bookingsData, isLoading: loadingBookings } = useGetTenantBookingsQuery({ limit: 5 });
  const { data: paymentsData, isLoading: loadingPayments } = useGetTenantPaymentsQuery({ limit: 10 });
  const { data: statsData,    isLoading: loadingStats }    = useGetTenantBookingStatsQuery();

  const bookings = bookingsData?.data ?? [];
  const tenant   = tenantData?.data;
  const stats    = statsData?.data;

  return {
    tenant,
    recentBookings: bookings.slice(0, 5),
    recentTransactions: paymentsData?.data?.slice(0, 3) ?? [],
    totalRevenue:    stats?.currentMonthRevenueNgn ?? 0,
    revenueGrowthPct: stats?.revenueGrowthPct ?? 0,
    confirmedCount:  stats?.confirmedCount  ?? 0,
    checkedInCount:  stats?.checkedInCount  ?? 0,
    cancelledCount:  stats?.cancelledCount  ?? 0,
    isLoading: loadingBookings || loadingPayments || loadingStats,
  };
}