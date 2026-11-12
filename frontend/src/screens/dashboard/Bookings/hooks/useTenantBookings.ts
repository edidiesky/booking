import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  useGetTenantBookingsQuery,
  useGetTenantBookingStatsQuery,
  useCheckInMutation,
  useCheckOutMutation,
} from "@/redux/services/bookingApi";
import { showToast } from "@/components/common/Toast";
import type { BookingStatus } from "@/types/api";
import type { DateRange } from "@/components/common/filters/DateRangeDropdown";
import { useDebounce } from "@/hooks/useDebounce";
import { useClampPage, usePagination } from "@/hooks/usePagination";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 350;

const ALL_STATUSES: BookingStatus[] = [
  "pending_payment",
  "confirmed",
  "checked_in",
  "checked_out",
  "cancelled",
  "refunded",
];

export function useTenantBookings() {
  const { page, setPage, resetPage } = usePagination();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Set<BookingStatus> | null>(null);
  const [dateRange, setDateRangeRaw] = useState<DateRange>({ start: null, end: null });

  const debouncedSearch = useDebounce(search.trim(), SEARCH_DEBOUNCE_MS);

  const [lastSearch, setLastSearch] = useState(debouncedSearch);
  if (lastSearch !== debouncedSearch) {
    setLastSearch(debouncedSearch);
    setPage(1);
  }
  
  const noStatusSelected = statusFilter !== null && statusFilter.size === 0;
  const statuses = useMemo(
    () =>
      statusFilter && statusFilter.size < ALL_STATUSES.length
        ? [...statusFilter].sort()
        : undefined,
    [statusFilter],
  );

  const { data, isLoading, isFetching } = useGetTenantBookingsQuery(
    {
      page,
      limit: PAGE_SIZE,
      status: statuses,
      search: debouncedSearch || undefined,
      checkInFrom: dateRange.start ? format(dateRange.start, "yyyy-MM-dd") : undefined,
      checkInTo: dateRange.end ? format(dateRange.end, "yyyy-MM-dd") : undefined,
    },
    { skip: noStatusSelected },
  );
  const { data: statsData, isLoading: isStatsLoading } = useGetTenantBookingStatsQuery();

  const [checkIn, { isLoading: checkingIn }] = useCheckInMutation();
  const [checkOut, { isLoading: checkingOut }] = useCheckOutMutation();

  const meta = noStatusSelected ? undefined : data?.meta;
  useClampPage(meta, page, setPage);

  const toggleStatus = (status: string) => {
    setStatusFilter((prev) => {
      const next = new Set(prev ?? ALL_STATUSES);
      if (next.has(status as BookingStatus)) next.delete(status as BookingStatus);
      else next.add(status as BookingStatus);
      return next;
    });
    resetPage();
  };

  const setDateRange = (range: DateRange) => {
    setDateRangeRaw(range);
    resetPage();
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter(null);
    setDateRangeRaw({ start: null, end: null });
    resetPage();
  };

  const handleCheckIn = async (bookingId: string) => {
    try {
      await checkIn(bookingId).unwrap();
      showToast("Guest checked in.", "success");
    } catch {
      /* errorMiddleware */
    }
  };

  const handleCheckOut = async (bookingId: string) => {
    try {
      await checkOut(bookingId).unwrap();
      showToast("Guest checked out. Escrow released.", "success");
    } catch {
      /* errorMiddleware */
    }
  };

  return {
    bookings: noStatusSelected ? [] : (data?.data ?? []),
    meta,
    isLoading,
    isFetching,
    page,
    setPage,
    search,
    setSearch,
    statusFilter: statusFilter ?? new Set(ALL_STATUSES),
    toggleStatus,
    dateRange,
    setDateRange,
    resetFilters,
    handleCheckIn,
    checkingIn,
    handleCheckOut,
    checkingOut,
    stats: statsData?.data,
    isStatsLoading,
  };
}