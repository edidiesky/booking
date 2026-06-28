import { Calendar, MapPin, Users, Moon } from "lucide-react";
import StatusBadge    from "@/components/common/StatusBadge";
import { formatDate } from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";
import type { Booking }   from "@/types/api";

interface Props { booking: Booking; }

export default function BookingDetailCard({ booking }: Props) {
  return (
    <div className="flex flex-col gap-6 p-6 border rounded-2xl"
         style={{ borderColor: "#e8e6e3" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-widest bold"
             style={{ color: "var(--color-hint-of-grey)" }}>Booking Reference</p>
          <p className="text-2xl bold"
             style={{ color: "var(--color-ink)", letterSpacing: "-0.3px" }}>
            {booking.bookingRef}
          </p>
        </div>
        <StatusBadge status={booking.status} size="md" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { Icon: Calendar, label: "Check-in",  value: formatDate(booking.checkIn)  },
          { Icon: Calendar, label: "Check-out", value: formatDate(booking.checkOut) },
          { Icon: Moon,     label: "Nights",    value: String(booking.nights)       },
          { Icon: Users,    label: "Guests",    value: String(booking.guestCount)   },
        ].map(({ Icon, label, value }) => (
          <div key={label} className="flex flex-col gap-1 p-3 rounded-xl"
               style={{ backgroundColor: "var(--color-fog)" }}>
            <p className="text-xs flex items-center gap-1"
               style={{ color: "var(--color-hint-of-grey)" }}>
              <Icon size={11} /> {label}
            </p>
            <p className="text-sm bold" style={{ color: "var(--color-ink)" }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 pt-4 border-t" style={{ borderColor: "#f2f0ed" }}>
        {[
          { label: "Rooms",        value: String(booking.roomsCount)             },
          { label: "Total amount", value: formatCurrency(booking.totalAmountNgn) },
          { label: "Platform fee", value: formatCurrency(booking.platformFeeNgn) },
          { label: "Host payout",  value: formatCurrency(booking.hostPayoutNgn)  },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <span style={{ color: "var(--color-muted-stone)" }}>{label}</span>
            <span style={{ color: "var(--color-ink)" }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}