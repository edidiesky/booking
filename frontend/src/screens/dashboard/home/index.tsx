import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { Layers } from "lucide-react";
import Title from "@/components/dashboard/common/Title";
import RecentBookings from "./RecentBookings";
import { useDashboardHome } from "./hooks/useDashboardHome";
import { selectCurrentUser } from "@/redux/slices/authSlice";
import RevenueTrendCard from "./RevenueTrendCard";
import RecentTransactionsCard from "./BookingFunnelCard";
import TodaysFocusCard from "./TodaysFocusCard";
import QuickActionsRow from "./QuickActionsRow";
import RadialTickCard from "@/components/common/charts/RadialTickCard";
import LinearTickBarCard from "@/components/common/charts/LinearTickBarCard";
import { StatCardGrid } from "@/components/common/widgets/StatCardGrid";

function formatNgn(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function DashboardHome() {
  const currentUser = useSelector(selectCurrentUser);
  const {
    recentBookings,
    totalRevenue,
    revenueGrowthPct,
    confirmedCount,
    checkedInCount,
    cancelledCount,
    isLoading,
    recentTransactions,
    tenant,
    totalProperties,
    activeProperties,
    totalBookings,
    totalPayments,
    successfulPayments,
  } = useDashboardHome();
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full p-4 lg:p-10 flex flex-col gap-8"
    >
      <Title
        title={`Welcome back, ${currentUser?.firstName ?? "Host"}`}
        description="Here's an overview of your property activity. Review bookings, monitor revenue, and manage your guests."
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
          <StatCardGrid
            isLoading={isLoading}
            cards={[
              {
                label: "Properties",
                value: String(totalProperties),
                total: `${activeProperties} active`,
                progress:
                  totalProperties > 0 ? activeProperties / totalProperties : 0,
                tone: "success",
                footnote: "All listing statuses",
              },
              {
                label: "Bookings",
                value: String(totalBookings),
                total: `${confirmedCount} confirmed`,
                progress:
                  totalBookings > 0 ? confirmedCount / totalBookings : 0,
                tone: "info",
                footnote: "All statuses in pipeline",
              },
              {
                label: "Payments",
                value: String(totalPayments),
                total: `${successfulPayments} successful`,
                progress:
                  totalPayments > 0 ? successfulPayments / totalPayments : 0,
                tone: "warning",
                footnote: "All payment attempts",
              },
              {
                label: "Revenue",
                value: formatNgn(totalRevenue),
                total:
                  revenueGrowthPct != null
                    ? `${revenueGrowthPct >= 0 ? "+" : ""}${Math.round(revenueGrowthPct)}% vs last month`
                    : "This month",
                progress: 0,
                tone: "neutral",
                footnote: "Confirmed booking revenue",
              },
            ]}
          />
          <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-4">
            <div className="w-full flex flex-col gap-4">
              <RevenueTrendCard />
              <LinearTickBarCard
                title="Revenue Split"
                totalValue={new Intl.NumberFormat("en-NG", {
                  style: "currency",
                  currency: "NGN",
                  minimumFractionDigits: 0,
                }).format(totalRevenue)}
                trend={{ value: revenueGrowthPct, label: "vs last month" }}
                segments={[
                  {
                    label: "Host Payout",
                    value:
                      totalRevenue * (1 - (tenant?.platformFeePct ?? 10) / 100),
                    color: "#17191c",
                  },
                  {
                    label: "Platform Fee",
                    value:
                      totalRevenue * ((tenant?.platformFeePct ?? 10) / 100),
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
                  { label: "Confirmed", value: confirmedCount },
                  { label: "Checked in", value: checkedInCount },
                  { label: "Cancelled", value: cancelledCount },
                ]}
              />
              <RecentTransactionsCard
                recentTransactions={recentTransactions || []}
              />
              <TodaysFocusCard
                confirmedCount={confirmedCount}
                checkedInCount={checkedInCount}
                cancelledCount={cancelledCount}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <QuickActionsRow />
          </div>

          <RecentBookings bookings={recentBookings} />
        </>
      )}
    </motion.div>
  );
}
