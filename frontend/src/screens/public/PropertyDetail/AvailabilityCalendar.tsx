import type { AvailabilitySlot } from "@/types/api";

interface Props {
  slots:    AvailabilitySlot[];
  checkIn:  string;
  checkOut: string;
}

function SlotCell({ slot, isCheckIn, isCheckOut, isInRange }: {
  slot:       AvailabilitySlot;
  isCheckIn:  boolean;
  isCheckOut: boolean;
  isInRange:  boolean;
}) {
  const isBlocked   = slot.isBlocked || slot.availableCount === 0;
  const isSelected  = isCheckIn || isCheckOut;

  let bg    = "var(--color-canvas)";
  let color = "var(--color-ink)";
  let border = "#e8e6e3";

  if (isBlocked)       { bg = "#f2f0ed"; color = "var(--color-hint-of-grey)"; }
  if (isInRange)       { bg = "var(--color-fog)"; }
  if (isSelected)      { bg = "var(--color-ink)"; color = "var(--color-canvas)"; border = "var(--color-ink)"; }

  return (
    <div
      className="flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-colors"
      style={{ backgroundColor: bg, color, borderColor: border, minHeight: "60px" }}
    >
      <span className="text-xs font-semibold">
        {new Date(slot.date).getDate()}
      </span>
      {!isBlocked && (
        <span className="text-[10px] mt-0.5" style={{ color: isSelected ? "rgba(255,255,255,0.7)" : "var(--color-hint-of-grey)" }}>
          {slot.availableCount} left
        </span>
      )}
      {isBlocked && (
        <span className="text-[10px] mt-0.5">Unavail.</span>
      )}
    </div>
  );
}

export default function AvailabilityCalendar({ slots, checkIn, checkOut }: Props) {
  if (!slots.length) return null;

  const checkInDate  = checkIn  ? new Date(checkIn).getTime()  : null;
  const checkOutDate = checkOut ? new Date(checkOut).getTime() : null;

  // Group slots by month
  const months = slots.reduce<Record<string, AvailabilitySlot[]>>((acc, slot) => {
    const key = slot.date.slice(0, 7); // "YYYY-MM"
    if (!acc[key]) acc[key] = [];
    acc[key].push(slot);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold" style={{ color: "var(--color-ink)" }}>
          Availability
        </p>
        <p className="text-xs" style={{ color: "var(--color-light-steel)" }}>
          Showing available dates for your selected room type.
        </p>
      </div>

      {Object.entries(months).map(([monthKey, monthSlots]) => {
        const [year, month] = monthKey.split("-");
        const monthLabel = new Date(Number(year), Number(month) - 1).toLocaleString("en-NG", {
          month: "long", year: "numeric",
        });

        return (
          <div key={monthKey} className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest"
               style={{ color: "var(--color-hint-of-grey)" }}>
              {monthLabel}
            </p>

            {/* Day of week header */}
            <div className="grid grid-cols-7 gap-1">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div key={d} className="text-center text-[10px] font-semibold pb-1"
                     style={{ color: "var(--color-hint-of-grey)" }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Offset first day of month */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: new Date(Number(year), Number(month) - 1, 1).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {monthSlots.map((slot) => {
                const slotTime = new Date(slot.date).getTime();
                const isCI    = checkInDate  !== null && slotTime === checkInDate;
                const isCO    = checkOutDate !== null && slotTime === checkOutDate;
                const inRange = checkInDate  !== null && checkOutDate !== null &&
                                slotTime > checkInDate && slotTime < checkOutDate;
                return (
                  <SlotCell
                    key={slot.date}
                    slot={slot}
                    isCheckIn={isCI}
                    isCheckOut={isCO}
                    isInRange={inRange}
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap pt-2">
        {[
          { bg: "var(--color-ink)",    color: "var(--color-canvas)", label: "Selected"    },
          { bg: "var(--color-fog)",    color: "var(--color-ink)",    label: "In range"    },
          { bg: "#f2f0ed",             color: "var(--color-hint-of-grey)", label: "Unavailable" },
          { bg: "var(--color-canvas)", color: "var(--color-ink)",    label: "Available"   },
        ].map(({ bg, color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded border"
                 style={{ backgroundColor: bg, borderColor: "#e8e6e3" }} />
            <span className="text-xs" style={{ color: color }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}