import { useNavigate }    from "react-router-dom";
import { MapPin }         from "lucide-react";
import LazyImage          from "@/components/common/LazyImage";
import StatusBadge        from "@/components/common/StatusBadge";
import { formatCurrency } from "@/utils/formatCurrency";
import type { Booking } from "@/types/api";

interface Props {
  booking:  Booking;
  onCancel: (b: Booking) => void;
}

export default function BookingCard({ booking, onCancel }: Props) {
  const navigate = useNavigate();
  const cancelable = booking?.status === "pending_payment" || booking?.status === "confirmed";

  const checkInLabel  = new Date(booking?.checkIn).toLocaleDateString("en-NG",  { month: "short", day: "numeric" });
  const checkOutLabel = new Date(booking?.checkOut).toLocaleDateString("en-NG", { month: "short", day: "numeric" });

  return (
    <div className="w-full flex flex-col cursor-pointer group">
      <div
        onClick={() => navigate(`/trips/${booking?.bookingId}`)}
        className="w-full overflow-hidden rounded-xl relative h-[340px]"
      >
        {(booking?.room_type_images?.length ?? [].length) > 0 ? (
          <LazyImage src={booking?.room_type_images[0]} alt={booking?.propertyName ?? booking?.bookingRef} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#f2f0ed]">
            <MapPin size={24} className="text-[#a3a6af]" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <StatusBadge status={booking?.status} />
        </div>
      </div>

      <div className="w-full flex flex-col pt-3 gap-1.5">
        <h3
          onClick={() => navigate(`/trips/${booking?.bookingId}`)}
          className="text-lg lg:text-xl bold leading-snug line-clamp-1 text-[#17191c]"
        >
          {booking?.propertyName ?? booking?.bookingRef}
        </h3>

        <p className="text-sm lg:text-base text-[#777b86]">
          {checkInLabel} - {checkOutLabel} · {booking?.nights} night{booking?.nights !== 1 ? "s" : ""}
        </p>

        <div className="flex items-center justify-between pt-1">
          <p className="text-base bold text-[#17191c]">
            {formatCurrency(booking?.totalAmountNgn)}
          </p>
          {cancelable && (
            <button
              onClick={() => onCancel(booking)}
              className="text-s px-3 py-1 border border-[#e8e6e3] rounded-full text-[#4c4c4c] hover:bg-[#f2f0ed] transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}