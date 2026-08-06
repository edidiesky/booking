import { useState } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import { useAdminBookings } from "./hooks/useAdminBookings";
import type { Booking, BookingStatus } from "@/types/api";
import BookingDrawer from "./AdminBookingDrawer";
import {
  useCheckInMutation,
  useCheckOutMutation,
  useCancelBookingMutation,
} from "@/redux/services/bookingApi";
import { showToast } from "@/components/common/Toast";
import CancelBookingModal from "@/screens/guest/MyBookings/CancelBookingModal";
import BookingTableRow from "./BookingTableRow";
import ExportPdfButton from "@/components/common/ExportPdfButton";
import { BOOKING_URL } from "@/constants/api";
import StatsOverview from "@/components/dashboard/common/StatsOverview";
import { formatCurrency } from "@/utils/formatCurrency";
import {
  FilterBar,
  FilterSearchInput,
} from "@/components/common/filters/FilterBar";
import { STATUS_MAP } from "@/components/common/StatusBadge";
import MultiSelectDropdown from "@/components/dashboard/common/gant/MultiSelectDropdown";
import DateRangeDropdown from "@/components/common/filters/DateRangeDropdown";

// const STATUS_CONFIG: Record<
//   BookingStatus,
//   { label: string; className: string }
// > = {
//   pending_payment: {
//     label: "Pending Payment",
//     className: "bg-yellow-50 text-yellow-800",
//   },
//   confirmed: { label: "Confirmed", className: "bg-blue-50 text-blue-700" },
//   checked_in: { label: "Checked In", className: "bg-green-50 text-green-700" },
//   checked_out: {
//     label: "Checked Out",
//     className: "bg-[#f2f0ed] text-[#4c4c4c]",
//   },
//   cancelled: { label: "Cancelled", className: "bg-red-50 text-red-700" },
//   refunded: { label: "Refunded", className: "bg-purple-50 text-purple-700" },
// };

const STATUS_OPTIONS: { label: string; value: BookingStatus | "" }[] = [
  { label: "All statuses", value: "" },
  { label: "Pending Payment", value: "pending_payment" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Checked In", value: "checked_in" },
  { label: "Checked Out", value: "checked_out" },
  { label: "Cancelled", value: "cancelled" },
];

const HEADERS = [
  "Reference",
  "Property",
  "Dates",
  "Rooms",
  "Amount",
  "Status",
  "",
];

export default function DashboardBookings() {
  const {
    bookings,
    isLoading,
    page,
    setPage,
    search,
    setSearch,
    statusFilter,
    toggleStatus,
    dateRange,
    setDateRange,
    resetFilters,
    stats,
    isStatsLoading,
  } = useAdminBookings();
  const [selectedBooking, setSelectedBooking] = useState<(Booking & { tenantName: string }) | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);

  const [checkIn] = useCheckInMutation();
  const [checkOut] = useCheckOutMutation();
  const [cancelBooking] = useCancelBookingMutation();

  const handleCheckIn = async (id: string) => {
    try {
      await checkIn(id).unwrap();
      showToast("Guest checked in.", "success");
    } catch {
      /* errorMiddleware */
    }
  };

  const handleCheckOut = async (id: string) => {
    try {
      await checkOut(id).unwrap();
      showToast("Guest checked out.", "success");
    } catch {
      /* errorMiddleware */
    }
  };

  const handleConfirmCancel = async (reason?: string) => {
    if (!cancelTarget) return;
    try {
      await cancelBooking({
        id: cancelTarget.bookingId,
        body: { reason },
      }).unwrap();
      showToast("Booking cancelled.", "success");
      setCancelTarget(null);
    } catch {
      /* errorMiddleware */
    }
  };

  return (
    <>
      <AnimatePresence>
        {selectedBooking && (
          <BookingDrawer
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cancelTarget && (
          <CancelBookingModal
            bookingRef={cancelTarget.bookingRef}
            isLoading={false}
            isOpen={Boolean(cancelTarget)}
            onConfirm={handleConfirmCancel}
            onClose={() => setCancelTarget(null)}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full p-4 py-8 lg:p-12 flex flex-col gap-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="text-lg lg:text-xl bold  text-[#17191c]">
              Bookings
            </h4>
            <p className="text-xs lg:text-smtext-[#64645f] mt-1 max-w-[420px] bold">
              Manage guest reservations. Click a row to view details and take
              actions.
            </p>
          </div>
          <span className="text-xs lg:text-sm text-[#a3a6af] mt-2">
            {bookings.length} total
          </span>
        </div>

        <StatsOverview
          isLoading={isStatsLoading}
          growthPct={stats?.revenueGrowthPct}
          growthTooltip="Confirmed booking revenue this calendar month vs. last calendar month"
          cards={[
            {
              label: "Confirmed",
              value: String(stats?.confirmedCount ?? 0),
              color: "#1e40af",
              bg: "#dbeafe",
            },
            {
              label: "Checked In",
              value: String(stats?.checkedInCount ?? 0),
              color: "#166534",
              bg: "#dcfce7",
            },
            {
              label: "Cancelled",
              value: String(stats?.cancelledCount ?? 0),
              color: "#991b1b",
              bg: "#fee2e2",
            },
            {
              label: "Revenue (Month)",
              value: formatCurrency(stats?.currentMonthRevenueNgn ?? 0),
              color: "#5b21b6",
              bg: "#ede9fe",
            },
          ]}
        />

        <div className="w-full flex lg:items-center justify-between lg:flex-row flex-col gap-3">
          <FilterBar>
            <FilterSearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by booking reference..."
            />
            <MultiSelectDropdown
              label="Status"
              options={STATUS_OPTIONS.filter((o) => o.value !== "").map(
                (o) => ({
                  value: o.value,
                  label: o.label,
                  color: STATUS_MAP[o.value]?.color,
                }),
              )}
              selected={statusFilter}
              onToggle={toggleStatus}
            />
            <DateRangeDropdown
              value={dateRange}
              onApply={setDateRange}
              placeholder="Check-in date range"
            />
            <button
              onClick={resetFilters}
              className="text-xs lg:text-sm underline"
              style={{ color: "#777b86" }}
            >
              Reset
            </button>
          </FilterBar>

          <div className="flex lg:justify-end">
            <ExportPdfButton
              triggerUrl={`${BOOKING_URL}/tenant/export`}
              label="Export bookings PDF"
            />
          </div>
        </div>

        <div className="border border-[#e8e6e3] overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#e8e6e3]">
                {HEADERS.map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs lg:text-xs text-[#a3a6af] uppercase whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#f2f0ed]">
                    {HEADERS.map((h) => (
                      <td key={h} className="px-5 py-4">
                        <div className="h-4 rounded animate-pulse bg-[#f2f0ed] w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : bookings.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-xs lg:text-sm text-[#a3a6af]"
                  >
                    No bookings found{search ? ` for "${search}"` : ""}
                  </td>
                </tr>
              ) : (
                bookings.map((b) => {
                  return (
                    <BookingTableRow
                      booking={b}
                      onViewDetails={setSelectedBooking}
                      onCancel={setCancelTarget}
                      onCheckIn={handleCheckIn}
                      onCheckOut={handleCheckOut}
                      setSelectedOrder={() => setSelectedBooking(b)}
                    />
                  );
                })
              )}
            </tbody>
          </table>
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-xs disabled:opacity-40"
            >
              Previous
            </button>
            <span
              className="text-xs"
              style={{ color: "var(--color-muted-stone)" }}
            >
              Page {page}
            </span>
            <button
              onClick={() => setPage((p) => (bookings.length < 20 ? p : p + 1))}
              disabled={bookings.length < 20}
              className="text-xs disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
