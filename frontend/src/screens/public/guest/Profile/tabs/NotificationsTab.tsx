import { Search } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { selectModal, closeModal } from "@/redux/slices/modalSlice";
import { useProfileBookings } from "../hooks/useProfileBookings";
import BookingListRow from "./BookingListRow";
import CancelBookingModal from "@/screens/guest/MyBookings/CancelBookingModal";

const STATUS_OPTIONS = [
  { value: "", label: "Status" },
  { value: "pending_payment", label: "Pending payment" },
  { value: "confirmed", label: "Confirmed" },
  { value: "checked_in", label: "Checked in" },
  { value: "checked_out", label: "Checked out" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

export default function BookingsTab() {
  const dispatch = useDispatch();
  const cancelModal = useSelector(selectModal("cancelBooking"));

  const {
    bookings,
    isLoading,
    cancelling,
    search,
    setSearch,
    status,
    setStatus,
    duration,
    setDuration,
    selected,
    handleCancelOpen,
    handleCancel,
  } = useProfileBookings();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a3a6af]"
          />
          <input
            type="search"
            placeholder="Search by reference"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#e8e6e3] bg-white text-[13px] outline-none focus:border-[#c4c6ce]"
          />
        </div>
        <select
          value={duration}
          onChange={(e) => setDuration(e.target.value as typeof duration)}
          className="h-9 px-3 rounded-lg border border-[#e8e6e3] bg-white text-[13px] text-[#777b86]"
        >
          <option value="all">All stays</option>
          <option value="upcoming">Upcoming</option>
          <option value="past">Past</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 px-3 rounded-lg border border-[#e8e6e3] bg-white text-[13px] text-[#777b86]"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-[88px] rounded-xl animate-pulse bg-[#f2f0ed]"
            />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white border border-[#e8e6e3] rounded-2xl p-8 text-center">
          <p className="text-[13px] text-[#a3a6af]">
            No bookings match these filters.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {bookings.map((b) => (
            <BookingListRow
              key={b.bookingId}
              booking={b}
              onCancel={handleCancelOpen}
            />
          ))}
        </div>
      )}

      {cancelModal.open && selected && (
        <CancelBookingModal
          bookingRef={selected.bookingRef}
          isLoading={cancelling}
          isOpen={cancelModal.open}
          onConfirm={handleCancel}
          onClose={() => dispatch(closeModal("cancelBooking"))}
        />
      )}
    </div>
  );
}
