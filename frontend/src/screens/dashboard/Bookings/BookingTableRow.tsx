import StatusBadge    from "@/components/common/StatusBadge";
import { formatDate } from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";
import type { Booking }   from "@/types/api";

interface Props {
  booking:       Booking;
  onCheckIn:     (id: string) => void;
  onCheckOut:    (id: string) => void;
  isCheckingIn:  boolean;
  isCheckingOut: boolean;
}

export default function BookingTableRow({ booking, onCheckIn, onCheckOut, isCheckingIn, isCheckingOut }: Props) {
  return (
    <tr className="border-b last:border-0 hover:bg-[#fafaf9] transition-colors"
        style={{ borderColor: "#f2f0ed" }}>
      <td className="px-5 py-3 bold text-sm whitespace-nowrap"
          style={{ color: "var(--color-ink)" }}>
        {booking.bookingRef}
      </td>
      <td className="px-5 py-3 text-sm whitespace-nowrap"
          style={{ color: "var(--color-muted-stone)" }}>
        {formatDate(booking.checkIn)}
      </td>
      <td className="px-5 py-3 text-sm whitespace-nowrap"
          style={{ color: "var(--color-muted-stone)" }}>
        {formatDate(booking.checkOut)}
      </td>
      <td className="px-5 py-3 text-sm whitespace-nowrap"
          style={{ color: "var(--color-ink)" }}>
        {formatCurrency(booking.totalAmountNgn)}
      </td>
      <td className="px-5 py-3">
        <StatusBadge status={booking.status} />
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-2">
          {booking.status === "confirmed" && (
            <button
              onClick={() => onCheckIn(booking.bookingId)}
              disabled={isCheckingIn}
              className="text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}
            >
              Check In
            </button>
          )}
          {booking.status === "checked_in" && (
            <button
              onClick={() => onCheckOut(booking.bookingId)}
              disabled={isCheckingOut}
              className="text-xs px-3 py-1.5 rounded-full border transition-opacity hover:opacity-70 disabled:opacity-50"
              style={{ borderColor: "var(--color-ink)", color: "var(--color-ink)" }}
            >
              Check Out
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}