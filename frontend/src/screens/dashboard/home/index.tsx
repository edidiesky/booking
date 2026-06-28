import { motion }            from "framer-motion";
import { useSelector }       from "react-redux";
import Title                 from "@/components/dashboard/common/Title";
import StatsGrid             from "./StatsGrid";
import RecentBookings        from "./RecentBookings";
import { useDashboardHome }  from "./hooks/useDashboardHome";
import { selectCurrentUser } from "@/redux/slices/authSlice";

export default function DashboardHome() {
  const currentUser = useSelector(selectCurrentUser);
  const {
    recentBookings, totalRevenue,
    confirmedCount, checkedInCount, cancelledCount,
    isLoading,
  } = useDashboardHome();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full p-6 lg:p-10 flex flex-col gap-8"
    >
      <Title
        title={`Welcome back, ${currentUser?.firstName ?? "Host"}`}
        description="Here's an overview of your property activity. Review bookings, monitor revenue, and manage your guests."
      />

      {isLoading ? (
        <div className="flex flex-col gap-6">
          <div className="h-40 rounded-xl animate-pulse" style={{ backgroundColor: "#f2f0ed" }} />
          <div className="h-64 rounded-xl animate-pulse" style={{ backgroundColor: "#f2f0ed" }} />
        </div>
      ) : (
        <>
          <StatsGrid
            totalRevenue={totalRevenue}
            confirmedCount={confirmedCount}
            checkedInCount={checkedInCount}
            cancelledCount={cancelledCount}
          />
          <RecentBookings bookings={recentBookings} />
        </>
      )}
    </motion.div>
  );
}