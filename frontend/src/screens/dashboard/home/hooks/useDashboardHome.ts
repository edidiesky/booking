import {
  useGetTenantBookingsQuery,
  useGetTenantBookingStatsQuery,
} from "@/redux/services/bookingApi";
import {
  useGetTenantPaymentsQuery,
  useGetTenantPaymentStatsQuery,
} from "@/redux/services/paymentApi";
import { useGetTenantPropertyStatsQuery } from "@/redux/services/propertyApi";
import { useGetMyTenantQuery } from "@/redux/services/tenantApi";

export function useDashboardHome() {
  const { data: tenantData } = useGetMyTenantQuery();
  const { data: bookingsData, isLoading: loadingBookings } =
    useGetTenantBookingsQuery({ limit: 5 });
  const { data: paymentsData, isLoading: loadingPayments } =
    useGetTenantPaymentsQuery({ limit: 10 });
  const { data: bookingStatsData, isLoading: loadingBookingStats } =
    useGetTenantBookingStatsQuery();
  const { data: paymentStatsData, isLoading: loadingPaymentStats } =
    useGetTenantPaymentStatsQuery();
  const { data: propertyStatsData, isLoading: loadingPropertyStats } =
    useGetTenantPropertyStatsQuery();

  const bookings = bookingsData?.data ?? [];
  const tenant = tenantData?.data;
  const bookingStats = bookingStatsData?.data;
  const paymentStats = paymentStatsData?.data;
  const propertyStats = propertyStatsData?.data;

  const totalProperties =
    (propertyStats?.activeCount ?? 0) +
    (propertyStats?.draftCount ?? 0) +
    (propertyStats?.pausedCount ?? 0) +
    (propertyStats?.archivedCount ?? 0);

  const totalBookings =
    (bookingStats?.confirmedCount ?? 0) +
    (bookingStats?.checkedInCount ?? 0) +
    (bookingStats?.checkedOutCount ?? 0) +
    (bookingStats?.cancelledCount ?? 0) +
    (bookingStats?.pendingCount ?? 0);

  const totalPayments =
    (paymentStats?.successCount ?? 0) +
    (paymentStats?.failedCount ?? 0) +
    (paymentStats?.pendingCount ?? 0) +
    (paymentStats?.refundedCount ?? 0);

  const successfulPayments = paymentStats?.successCount ?? 0;

  return {
    tenant,
    recentBookings: bookings.slice(0, 5),
    recentTransactions: paymentsData?.data?.slice(0, 3) ?? [],

    // overview cards
    totalProperties,
    activeProperties: propertyStats?.activeCount ?? 0,
    totalBookings,
    confirmedCount: bookingStats?.confirmedCount ?? 0,
    checkedInCount: bookingStats?.checkedInCount ?? 0,
    cancelledCount: bookingStats?.cancelledCount ?? 0,
    totalPayments,
    successfulPayments,
    totalRevenue: bookingStats?.currentMonthRevenueNgn ?? 0,
    revenueGrowthPct: bookingStats?.revenueGrowthPct ?? 0,
    paymentVolumeNgn: paymentStats?.currentMonthVolumeNgn ?? 0,
    volumeGrowthPct: paymentStats?.volumeGrowthPct ?? 0,

    isLoading:
      loadingBookings ||
      loadingPayments ||
      loadingBookingStats ||
      loadingPaymentStats ||
      loadingPropertyStats,
  };
}