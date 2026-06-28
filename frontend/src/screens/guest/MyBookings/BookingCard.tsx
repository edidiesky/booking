import { useNavigate }   from "react-router-dom";
import { MapPin, Calendar } from "lucide-react";
import StatusBadge       from "@/components/common/StatusBadge";
import { formatDate }    from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";
import type { Booking }  from "@/types/api";

interface Props {
  booking:       Booking;
  onCancel:      (b: Booking) => void;
}

export default function BookingCard({ booking, onCancel }: Props) {
  const navigate = useNavigate();

  const cancelable = booking.status === "pending_payment" || booking.status === "confirmed";

  return (
    <div
      className="flex flex-col gap-4 p-5 border rounded-2xl transition-colors hover:border-[#d0cdc9]"
      style={{ borderColor: "#e8e6e3", backgroundColor: "var(--color-canvas)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold" style={{ color: "var(--color-ink)" }}>
            {booking.bookingRef}
          </p>
          <p className="text-xs flex items-center gap-1"
             style={{ color: "var(--color-light-steel)" }}>
            <MapPin size={10} />
            Property ID: {booking.propertyId}
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="flex items-center gap-4 text-xs"
           style={{ color: "var(--color-muted-stone)" }}>
        <span className="flex items-center gap-1">
          <Calendar size={11} />
          {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
        </span>
        <span>{booking.nights} night{booking.nights !== 1 ? "s" : ""}</span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t"
           style={{ borderColor: "#f2f0ed" }}>
        <p className="text-sm font-semibold" style={{ color: "var(--color-ink)" }}>
          {formatCurrency(booking.totalAmountNgn)}
        </p>
        <div className="flex items-center gap-2">
          {cancelable && (
            <button
              onClick={() => onCancel(booking)}
              className="text-xs px-3 py-1.5 border rounded-full transition-opacity hover:opacity-70"
              style={{ borderColor: "#e8e6e3", color: "var(--color-muted-stone)" }}
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => navigate(`/trips/${booking.bookingId}`)}
            className="text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
            style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
}