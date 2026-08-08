import { useState } from "react";
import { useGetPlatformStatsQuery, useListAdminBookingsQuery } from "@/redux/services/adminApi";
import { useCheckInMutation, useCheckOutMutation } from "@/redux/services/bookingApi";
import { showToast } from "@/components/common/Toast";
import type { BookingStatus } from "@/types/api";
import type { DateRange } from "@/components/common/filters/DateRangeDropdown";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";

const ALL_STATUSES: BookingStatus[] = [
  "pending_payment", "confirmed", "checked_in", "checked_out", "cancelled", "refunded",
];

export function useAdminBookings() {
  const [page,         setPage]         = useState(1);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<Set<BookingStatus> | null>(null);
  const [dateRange,    setDateRange]    = useState<DateRange>({ start: null, end: null });

  const { data, isLoading } = useListAdminBookingsQuery({ page, limit: 10 });
  const { data: statsData, isLoading: isStatsLoading } = useGetPlatformStatsQuery();

  const [checkIn,  { isLoading: checkingIn  }] = useCheckInMutation();
  const [checkOut, { isLoading: checkingOut }] = useCheckOutMutation();

  const bookings = data?.data.bookings ?? [];
  const filtered = bookings.filter((b) => {
    if (search && !b.bookingRef.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && !statusFilter.has(b.status)) return false;
    if (dateRange.start && dateRange.end) {
      const checkInDate = new Date(b.checkIn);
      if (!isWithinInterval(checkInDate, { start: startOfDay(dateRange.start), end: endOfDay(dateRange.end) })) {
        return false;
      }
    }
    return true;
  });

  const toggleStatus = (status: string) => {
    setStatusFilter((prev) => {
      const next = new Set(prev ?? ALL_STATUSES);
      if (next.has(status as BookingStatus)) next.delete(status as BookingStatus);
      else next.add(status as BookingStatus);
      return next;
    });
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter(null);
    setDateRange({ start: null, end: null });
  };

  const handleCheckIn = async (bookingId: string) => {
    try {
      await checkIn(bookingId).unwrap();
      showToast("Guest checked in.", "success");
    } catch { /* errorMiddleware */ }
  };

  const handleCheckOut = async (bookingId: string) => {
    try {
      await checkOut(bookingId).unwrap();
      showToast("Guest checked out. Escrow released.", "success");
    } catch { /* errorMiddleware */ }
  };

  return {
    bookings: filtered, isLoading,
    page, setPage,
    search, setSearch,
    statusFilter: statusFilter ?? new Set(ALL_STATUSES), toggleStatus,
    dateRange, setDateRange,
    resetFilters,
    handleCheckIn,  checkingIn,
    handleCheckOut, checkingOut,
    stats: statsData?.data.bookings,
    isStatsLoading,
  };
}