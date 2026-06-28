import { motion }           from "framer-motion";
import Title                from "@/components/dashboard/common/Title";
import BookingFilters       from "./BookingFilters";
import BookingTableRow      from "./BookingTableRow";
import { useTenantBookings } from "./hooks/useTenantBookings";

const HEADERS = ["Reference", "Check-in", "Check-out", "Amount", "Status", "Actions"];

export default function DashboardBookings() {
  const {
    bookings, isLoading,
    search, setSearch,
    statusFilter, setStatusFilter,
    handleCheckIn, checkingIn,
    handleCheckOut, checkingOut,
  } = useTenantBookings();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full p-6 lg:p-10 flex flex-col gap-8"
    >
      <Title title="Bookings" description="Manage guest reservations. Check guests in and out from here." />

      <BookingFilters
        search={search}           onSearch={setSearch}
        statusFilter={statusFilter} onStatusFilter={setStatusFilter}
      />

      <div className="border rounded-xl overflow-x-auto" style={{ borderColor: "#e8e6e3" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: "#e8e6e3" }}>
              {HEADERS.map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs uppercase whitespace-nowrap"
                    style={{ color: "var(--color-hint-of-grey)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b" style={{ borderColor: "#f2f0ed" }}>
                  {HEADERS.map((h) => (
                    <td key={h} className="px-5 py-4">
                      <div className="h-4 rounded animate-pulse" style={{ backgroundColor: "#f2f0ed", width: "70%" }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm"
                    style={{ color: "var(--color-hint-of-grey)" }}>
                  No bookings found{search ? ` for "${search}"` : ""}.
                </td>
              </tr>
            ) : bookings.map((b) => (
              <BookingTableRow
                key={b.bookingId}
                booking={b}
                onCheckIn={handleCheckIn}
                onCheckOut={handleCheckOut}
                isCheckingIn={checkingIn}
                isCheckingOut={checkingOut}
              />
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}