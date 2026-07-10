import { useGetTenantBookingsQuery } from "@/redux/services/bookingApi";
import { useGetTenantPaymentsQuery } from "@/redux/services/paymentApi";
import { useGetMyTenantQuery }       from "@/redux/services/tenantApi";

export function useDashboardHome() {
  const { data: tenantData }   = useGetMyTenantQuery();
  const { data: bookingsData, isLoading: loadingBookings } = useGetTenantBookingsQuery({ limit: 5 });
  const { data: paymentsData, isLoading: loadingPayments } = useGetTenantPaymentsQuery({ limit: 100 });

  const bookings  = bookingsData?.data  ?? [];
  const payments  = paymentsData?.data  ?? [];
  const tenant    = tenantData?.data;

  const totalRevenue  = payments.filter((p) => p.status === "success" || p.status === "checked_in")
    .reduce((sum, p) => sum + p.totalAmountNgn, 0);

  const confirmedCount  = bookings.filter((b) => b.status === "confirmed").length;
  const checkedInCount  = bookings.filter((b) => b.status === "checked_in").length;
  const cancelledCount  = bookings.filter((b) => b.status === "cancelled").length;

  console.log("totalRevenue", { totalRevenue})


  return {
    tenant,
    recentBookings: bookings.slice(0, 5),
    totalRevenue,
    confirmedCount,
    checkedInCount,
    cancelledCount,
    isLoading: loadingBookings || loadingPayments,
  };
}