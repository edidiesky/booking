import { useState }                  from "react";
import { useGetTenantBookingsQuery } from "@/redux/services/bookingApi";
import { useCheckInMutation, useCheckOutMutation } from "@/redux/services/bookingApi";
import { showToast }                 from "@/components/common/Toast";
import type { BookingStatus }        from "@/types/api";

export function useTenantBookings() {
  const [page,         setPage]         = useState(1);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "">("");

  const { data, isLoading } = useGetTenantBookingsQuery({
    status: statusFilter || undefined,
    page,
    limit:  10,
  });

  const [checkIn,  { isLoading: checkingIn  }] = useCheckInMutation();
  const [checkOut, { isLoading: checkingOut }] = useCheckOutMutation();

  const bookings    = data?.data ?? [];
  const filtered    = bookings.filter((b) =>
    !search || b.bookingRef.toLowerCase().includes(search.toLowerCase())
  );

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
    statusFilter, setStatusFilter,
    handleCheckIn,  checkingIn,
    handleCheckOut, checkingOut,
  };
}