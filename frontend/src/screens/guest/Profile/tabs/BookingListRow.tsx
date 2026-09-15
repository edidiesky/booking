import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import LazyImage from "@/components/common/LazyImage";
import StatusBadge from "@/components/common/StatusBadge";
import { formatCurrency } from "@/utils/formatCurrency";
import type { Booking } from "@/types/api";

interface Props {
  booking: Booking;
  onCancel: (b: Booking) => void;
}

export default function BookingListRow({ booking, onCancel }: Props) {
  const navigate = useNavigate();
  const cancelable =
    booking.status === "pending_payment" || booking.status === "confirmed";
  const checkIn = new Date(booking.checkIn).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
  });
  const checkOut = new Date(booking.checkOut).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
  });

  return (
    <div
      onClick={() => navigate(`/trips/${booking.bookingId}`)}
      className="flex items-center gap-4 p-3 rounded-xl border border-[#e8e6e3] bg-white cursor-pointer hover:bg-[#fafaf9] transition-colors"
    >
      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-[#f2f0ed] flex items-center justify-center">
        {booking.room_type_images?.length > 0 ? (
          <LazyImage
            src={booking.room_type_images[0]}
            alt={booking.propertyName ?? booking.bookingRef}
          />
        ) : (
          <MapPin size={18} className="text-[#a3a6af]" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-[#17191c] truncate">
          {booking.propertyName ?? booking.bookingRef}
        </p>
        <p className="text-xs text-[#777b86] mt-0.5">
          {checkIn} – {checkOut} · {booking.nights} night
          {booking.nights !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="shrink-0">
        <StatusBadge status={booking.status} />
      </div>

      <p className="text-[13px] text-[#17191c] w-24 text-right shrink-0">
        {formatCurrency(booking.totalAmountNgn)}
      </p>

      {cancelable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCancel(booking);
          }}
          className="text-xs px-3 py-1.5 border border-[#e8e6e3] rounded-full text-[#4c4c4c] hover:bg-[#f2f0ed] transition-colors shrink-0"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
