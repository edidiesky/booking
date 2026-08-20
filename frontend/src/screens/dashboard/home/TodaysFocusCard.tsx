import { ChevronRight, Circle } from "lucide-react";

interface Props {
  confirmedCount: number;
  checkedInCount: number;
  cancelledCount: number;
}

export default function TodaysFocusCard({ confirmedCount, checkedInCount, cancelledCount }: Props) {
  const items = [
    { id: "confirmed", label: "Confirmed bookings",  note: confirmedCount > 0 ? `${confirmedCount} awaiting guest arrival`      : "No bookings awaiting arrival", color: "#1d4ed8" },
    { id: "checkedIn", label: "Checked-in guests",    note: checkedInCount > 0 ? `${checkedInCount} currently on property`      : "No guests currently checked in", color: "#92400e" },
    { id: "cancelled", label: "Cancelled bookings",   note: cancelledCount > 0 ? `${cancelledCount} may need a refund review`   : "No cancellations to review", color: "#991b1b" },
  ];

  return (
    <div className="rounded-2xl border border-[var(--color-fog)] bg-[var(--color-canvas)] flex flex-col">
      <div className="px-5 py-4">
        <p className="text-xs font-semibold lg:text-sm">Today's Focus</p>
      </div>
      <div className="flex flex-col divide-y divide-[var(--color-fog)]">
        {items.map(({ id, label, note, color }) => (
          <button key={id} className="flex items-center gap-3 px-5 py-3.5 text-left hover:bg-[#f2f0ed5f] transition-colors">
            <Circle size={10} fill={color} style={{ color }} className="shrink-0" />
            <div className="flex-1">
              <p className="text-xs lg:text-[13px]" style={{ color: "var(--color-ink)" }}>{label}</p>
              <p className="text-xs lg:text-[13px]  medium mt-0.5" style={{ color: "var(--color-muted-stone)" }}>{note}</p>
            </div>
            <ChevronRight size={16} style={{ color: "var(--color-muted-stone)" }} />
          </button>
        ))}
      </div>
    </div>
  );
}