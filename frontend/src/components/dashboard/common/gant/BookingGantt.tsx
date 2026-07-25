import { useState, useMemo } from "react";
import type { Booking } from "@/types/api";
import { VIEW_DAYS, type GanttView, LABEL_COLUMN_PX } from "@/constants";
import { useGanttLayout } from "@/hooks/useGanttLayout";
import GanttHeader from "./GanttHeader";
import GanttRow from "./GanttRow";
import GanttToolbar from "./GanttToolbar";

interface Props {
  bookings:        Booking[];
  onSelectBooking: (booking: Booking) => void;
}

const ALL_STATUS_VALUES = ["pending_payment", "confirmed", "checked_in", "checked_out", "cancelled", "refunded"];

// Fully custom, no third-party scheduler dependency, no license: rooms as
// slim single-line rows, overlapping bookings stack into visible lanes,
// filters and the day/week/month view selector live in one top toolbar
// (not a right sidebar), and every column is a flex fraction of the
// container width, so the whole thing stays contained, no horizontal
// scroll or bleed regardless of view granularity.
export default function BookingGantt({ bookings, onSelectBooking }: Props) {
  const [view, setView] = useState<GanttView>("month");
  const [windowStart, setWindowStart] = useState(() => new Date());
  const [selectedRoomTypes, setSelectedRoomTypes] = useState<Set<string> | null>(null);
  const [selectedStatuses, setSelectedStatuses]   = useState<Set<string> | null>(null);

  const visibleDays = VIEW_DAYS[view];

  const allRoomTypes = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of bookings) map.set(b.roomTypeId, b.roomTypeName ?? "Untitled room type");
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [bookings]);

  const rows = useGanttLayout({
    bookings,
    windowStart,
    visibleDays,
    roomTypeFilter: selectedRoomTypes,
    statusFilter: selectedStatuses,
  });

  const toggleRoomType = (id: string) => {
    setSelectedRoomTypes((prev) => {
      const next = new Set(prev ?? allRoomTypes.map((r) => r.id));
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) => {
      const next = new Set(prev ?? ALL_STATUS_VALUES);
      if (next.has(status)) next.delete(status); else next.add(status);
      return next;
    });
  };

  const resetFilters = () => {
    setSelectedRoomTypes(null);
    setSelectedStatuses(null);
  };

  const handleSelectBookingId = (bookingId: string) => {
    const booking = bookings.find((b) => b.bookingId === bookingId);
    if (booking) onSelectBooking(booking);
  };

  return (
    <div className="w-full border rounded-xl overflow-hidden" style={{ borderColor: "#e8e6e3" }}>
      <GanttToolbar
        windowStart={windowStart}
        onWindowChange={setWindowStart}
        view={view}
        onViewChange={setView}
        roomTypes={allRoomTypes}
        selectedRoomTypes={selectedRoomTypes ?? new Set(allRoomTypes.map((r) => r.id))}
        onToggleRoomType={toggleRoomType}
        selectedStatuses={selectedStatuses ?? new Set(ALL_STATUS_VALUES)}
        onToggleStatus={toggleStatus}
        onReset={resetFilters}
      />

      <div className="overflow-y-auto" style={{ height: 600 }}>
        <div className="flex">
          <div className="shrink-0 sticky left-0 top-0 z-[6] bg-white border-r" style={{ width: LABEL_COLUMN_PX, borderColor: "#e8e6e3" }} />
          <GanttHeader windowStart={windowStart} visibleDays={visibleDays} />
        </div>

        {rows.length === 0 ? (
          <div className="p-10 text-center text-xs" style={{ color: "#a3a6af" }}>
            No bookings match the current filters.
          </div>
        ) : (
          rows.map((row) => (
            <GanttRow key={row.roomTypeId} row={row} visibleDays={visibleDays} onSelectBooking={handleSelectBookingId} />
          ))
        )}
      </div>
    </div>
  );
}