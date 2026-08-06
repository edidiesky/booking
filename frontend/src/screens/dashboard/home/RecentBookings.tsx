import { useNavigate }  from "react-router-dom";
import StatusBadge      from "@/components/common/StatusBadge";
import { formatDate }   from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";
import type { Booking } from "@/types/api";

interface Props { bookings: Booking[]; }

export default function RecentBookings({ bookings }: Props) {
  const navigate = useNavigate();

  return (
    <div className="border rounded-xl overflow-hidden" style={{ borderColor: "#e8e6e3" }}>
      <div className="flex items-center justify-between px-5 py-4 border-b"
           style={{ borderColor: "#e8e6e3" }}>
        <p className="text-xs lg:text-sm lg:text-sm" style={{ color: "var(--color-ink)" }}>
          Recent Bookings
        </p>
        <button
          onClick={() => navigate("/dashboard/bookings")}
          className="text-xs lg:text-smtransition-opacity hover:opacity-70"
          style={{ color: "var(--color-terracotta)" }}
        >
          View all
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b" style={{ borderColor: "#f2f0ed" }}>
              {["Reference", "Check-in", "Check-out", "Amount", "Status"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs lg:text-smuppercase whitespace-nowrap"
                    style={{ color: "var(--color-hint-of-grey)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-xs"
                    style={{ color: "var(--color-hint-of-grey)" }}>
                  No bookings yet.
                </td>
              </tr>
            ) : bookings.map((b) => (
              <tr
                key={b.bookingId}
                onClick={() => navigate(`/dashboard/bookings`)}
                className="border-b last:border-0 hover:bg-[#fafaf9] transition-colors cursor-pointer"
                style={{ borderColor: "#f2f0ed" }}
              >
                <td className="px-5 py-3 bold" style={{ color: "var(--color-ink)" }}>
                  {b.bookingRef}
                </td>
                <td className="px-5 py-3 whitespace-nowrap" style={{ color: "var(--color-muted-stone)" }}>
                  {formatDate(b.checkIn)}
                </td>
                <td className="px-5 py-3 whitespace-nowrap" style={{ color: "var(--color-muted-stone)" }}>
                  {formatDate(b.checkOut)}
                </td>
                <td className="px-5 py-3 whitespace-nowrap" style={{ color: "var(--color-ink)" }}>
                  {formatCurrency(b.totalAmountNgn)}
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={b.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}