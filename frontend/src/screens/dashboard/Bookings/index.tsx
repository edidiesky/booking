import { useState } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import { useTenantBookings } from "./hooks/useTenantBookings";
import type { Booking, BookingStatus } from "@/types/api";
import BookingDrawer from "./BookingDrawer";
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
import { formatCurrency } from "@/utils/formatCurrency";
import {
  FilterBar,
  FilterSearchInput,
} from "@/components/common/filters/FilterBar";
import { STATUS_MAP } from "@/components/common/StatusBadge";
import MultiSelectDropdown from "@/components/dashboard/common/gant/MultiSelectDropdown";
import DateRangeDropdown from "@/components/common/filters/DateRangeDropdown";
import { EmptyState } from "@/components/common/EmptyState";
import Title from "@/components/dashboard/common/Title";
import TablePagination from "@/components/common/table/TablePagination";
import { StatCardGrid } from "@/components/common/widgets/StatCardGrid";
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
    search,
    setSearch,
    statusFilter,
    toggleStatus,
    dateRange,
    setDateRange,
    resetFilters,
    stats,
    isStatsLoading,
    isFetching,
    setPage,
    meta,
  } = useTenantBookings();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
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

  const pipeline =
    (stats?.confirmedCount ?? 0) +
      (stats?.checkedInCount ?? 0) +
      (stats?.cancelledCount ?? 0) +
      (stats?.pendingCount ?? 0) || 1;

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
        className="w-full p-4  flex flex-col gap-8"
      >
        <Title
          title={`Bookings`}
          description=" Manage guest reservations. Click a row to view details and take
              actions."
        />

        <StatCardGrid
          isLoading={isStatsLoading}
          cards={[
            {
              label: "Confirmed",
              value: String(stats?.confirmedCount ?? 0),
              total: `of ${pipeline}`,
              progress: (stats?.confirmedCount ?? 0) / pipeline,
              tone: "info",
              footnote: "Awaiting or upcoming stays",
            },
            {
              label: "Checked in",
              value: String(stats?.checkedInCount ?? 0),
              total: `of ${pipeline}`,
              progress: (stats?.checkedInCount ?? 0) / pipeline,
              tone: "success",
              footnote: "Currently on property",
            },
            {
              label: "Cancelled",
              value: String(stats?.cancelledCount ?? 0),
              total: `of ${pipeline}`,
              progress: (stats?.cancelledCount ?? 0) / pipeline,
              tone: "danger",
              footnote: "Of booking pipeline",
            },
            {
              label: "Revenue (month)",
              value: formatCurrency(stats?.currentMonthRevenueNgn ?? 0),
              total:
                stats?.revenueGrowthPct != null
                  ? `${stats.revenueGrowthPct >= 0 ? "+" : ""}${Math.round(stats.revenueGrowthPct)}% vs last month`
                  : "This calendar month",
              progress: 0,
              tone: "neutral",
              footnote: "Confirmed booking revenue",
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
              className="text-xs lg:text-[13px]     underline"
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
                    className="px-5 py-10 text-center text-xs lg:text-[13px]     text-[#a3a6af]"
                  >
                    <EmptyState
                      title="Bookings Empty"
                      description="No recent bookings yet"
                    />
                  </td>
                </tr>
              ) : (
                bookings.map((b) => {
                  return (
                    <BookingTableRow
                      booking={b}
                      key={b.bookingId}
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
        </div>
        <TablePagination
          meta={meta}
          onPageChange={setPage}
          isFetching={isFetching}
          noun={{ singular: "booking", plural: "bookings" }}
        />
      </motion.div>
    </>
  );
}
