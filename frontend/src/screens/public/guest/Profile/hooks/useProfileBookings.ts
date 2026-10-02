import { useMemo, useState } from "react";
import { useGetMyBookingsQuery, useCancelBookingMutation } from "@/redux/services/bookingApi";
import { useDispatch } from "react-redux";
import { openModal } from "@/redux/slices/modalSlice";
import { showToast } from "@/components/common/Toast";
import type { Booking } from "@/types/api";

export type DurationFilter = "all" | "upcoming" | "past";

export function useProfileBookings() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [duration, setDuration] = useState<DurationFilter>("all");
  const [selected, setSelected] = useState<Booking | null>(null);
  const dispatch = useDispatch();

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const { data, isLoading } = useGetMyBookingsQuery({
    page,
    limit: 10,
    status: status || undefined,
    checkInAfter: duration === "upcoming" ? todayIso : undefined,
    checkInBefore: duration === "past" ? todayIso : undefined,
  });

  const [cancelBooking, { isLoading: cancelling }] = useCancelBookingMutation();

  const bookings = data?.data ?? [];
  const filtered = bookings.filter(
    (b) => !search || b.bookingRef.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCancelOpen = (booking: Booking) => {
    setSelected(booking);
    dispatch(openModal({ name: "cancelBooking", payload: { bookingId: booking.bookingId } }));
  };

  const handleCancel = async (reason?: string) => {
    if (!selected) return;
    try {
      await cancelBooking({ id: selected.bookingId, body: { reason } }).unwrap();
      showToast("Booking cancelled.", "success");
      setSelected(null);
    } catch { /* errorMiddleware */ }
  };

  return {
    bookings: filtered, isLoading, cancelling,
    page, setPage,
    search, setSearch,
    status, setStatus,
    duration, setDuration,
    selected, setSelected,
    handleCancelOpen, handleCancel,
  };
}