import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { Layers } from "lucide-react";
import Title from "@/components/dashboard/common/Title";
import StatsGrid from "@/screens/dashboard/home/StatsGrid";
import RecentBookings from "@/screens/dashboard/home/RecentBookings";
import TodaysFocusCard from "@/screens/dashboard/home/TodaysFocusCard";
import RadialTickCard from "@/components/common/charts/RadialTickCard";
import { useAdminOverview } from "./hooks/useAdminOverview";
import { selectCurrentUser } from "@/redux/slices/authSlice";
import AdminQuickActionsRow from "./QuickActionsRow";
import AdminRevenueTrendCard from "./AdminRevenueTrendCard";
import LinearTickBarCard from "@/components/common/charts/LinearTickBarCard";
import AdminSecondaryStats from "./AdminSecondaryStats";
import RecentTransactionsCard from "./BookingFunnelCard";

export default function AdminOverview() {
  const currentUser = useSelector(selectCurrentUser);
  const {
    isLoading,
    totalRevenue,
    revenueGrowthPct,
    confirmedCount,
    checkedInCount,
    cancelledCount,
    recentTransactions,
    recentBookings,
    hostPayoutNgn,
    platformFeeNgn,
    propertiesCount,
    paymentsCount,
    guestsCount,
    activeTenantsCount,
  } = useAdminOverview();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full p-6 lg:p-10 flex flex-col gap-8"
    >
      <Title
        title={`Welcome back, ${currentUser?.firstName ?? "Admin"}`}
        description="Platform-wide activity across every seller, every property, every booking."
      />

      {isLoading ? (
        <div className="flex flex-col gap-6">
          <div
            className="h-40 rounded-xl animate-pulse"
            style={{ backgroundColor: "#f2f0ed" }}
          />
          <div
            className="h-64 rounded-xl animate-pulse"
            style={{ backgroundColor: "#f2f0ed" }}
          />
        </div>
      ) : (
        <>
          <StatsGrid
            totalRevenue={totalRevenue}
            confirmedCount={confirmedCount}
            checkedInCount={checkedInCount}
            cancelledCount={cancelledCount}
          />
          <AdminSecondaryStats
            propertiesCount={propertiesCount}
            paymentsCount={paymentsCount}
            guestsCount={guestsCount}
            activeTenantsCount={activeTenantsCount}
          />

          <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-4">
            <div className="w-full flex flex-col gap-4">
              <AdminRevenueTrendCard />
              <LinearTickBarCard
                title="Revenue Split"
                totalValue={new Intl.NumberFormat("en-NG", {
                  style: "currency",
                  currency: "NGN",
                  minimumFractionDigits: 0,
                }).format(hostPayoutNgn + platformFeeNgn)}
                trend={{ value: revenueGrowthPct, label: "vs last month" }}
                segments={[
                  {
                    label: "Host Payout",
                    value: hostPayoutNgn,
                    color: "#17191c",
                  },
                  {
                    label: "Platform Fee",
                    value: platformFeeNgn,
                    color: "#777b86",
                  },
                ]}
              />
              
            </div>

            <div className="flex flex-col gap-4">
              <RadialTickCard
                title="Booking Status"
                icon={<Layers size={14} style={{ color: "#777b86" }} />}
                totalLabel="Total"
                totalValue={confirmedCount + checkedInCount + cancelledCount}
                segments={[
                  {
                    label: "Confirmed",
                    value: confirmedCount,
                    color: "#1e40af",
                  },
                  {
                    label: "Checked in",
                    value: checkedInCount,
                    color: "#166534",
                  },
                  {
                    label: "Cancelled",
                    value: cancelledCount,
                    color: "#991b1b",
                  },
                ]}
              />
              <RecentTransactionsCard recentTransactions={recentTransactions} />
              <TodaysFocusCard
                confirmedCount={confirmedCount}
                checkedInCount={checkedInCount}
                cancelledCount={cancelledCount}
              />
            </div>
          </div>

          <AdminQuickActionsRow />

          <RecentBookings bookings={recentBookings} />
        </>
      )}
    </motion.div>
  );
}
