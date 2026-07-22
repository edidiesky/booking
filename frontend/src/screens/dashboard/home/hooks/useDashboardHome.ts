import { useGetTenantBookingsQuery } from "@/redux/services/bookingApi";
import { useGetTenantPaymentsQuery } from "@/redux/services/paymentApi";
import { useGetMyTenantQuery }       from "@/redux/services/tenantApi";

export function useDashboardHome() {
  const { data: tenantData }   = useGetMyTenantQuery();
  const { data: bookingsData, isLoading: loadingBookings } = useGetTenantBookingsQuery({ limit: 5 });
  const { data: paymentsData, isLoading: loadingPayments } = useGetTenantPaymentsQuery({ limit: 10 });

  const bookings  = bookingsData?.data  ?? [];
  const tenant    = tenantData?.data;

  const totalRevenue  = bookings
    .reduce((sum, p) => sum + p.hostPayoutNgn, 0);

  const confirmedCount  = bookings.filter((b) => b.status === "confirmed").length;
  const checkedInCount  = bookings.filter((b) => b.status === "checked_in").length;
  const cancelledCount  = bookings.filter((b) => b.status === "cancelled").length;

  // console.log("totalRevenue", { totalRevenue, payments, bookings})


  return {
    tenant,
    recentBookings: bookings?.slice(0, 5) ?? [], // paymentsData
    recentTransactions: paymentsData?.data?.slice(0, 4) ?? [], // paymentsData
    totalRevenue,
    confirmedCount,
    checkedInCount,
    cancelledCount,
    isLoading: loadingBookings || loadingPayments,
  };
}