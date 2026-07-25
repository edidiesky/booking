import { ROW_HEIGHT_PX, LANE_GAP_PX, LABEL_COLUMN_PX } from "@/constants";
import type { RoomTypeRow as RoomTypeRowData } from "@/hooks/useGanttLayout";
import BookingBar from "./BookingBar";

interface Props {
  row:             RoomTypeRowData;
  visibleDays:     number;
  onSelectBooking: (bookingId: string) => void;
}

export default function GanttRow({ row, visibleDays, onSelectBooking }: Props) {
  const height = row.laneCount * ROW_HEIGHT_PX + (row.laneCount - 1) * LANE_GAP_PX + 8;

  return (
    <div className="flex border-b" style={{ borderColor: "#f2f0ed" }}>
      {/* Single-line room type label, sticky to the left as the timeline scrolls */}
      <div
        className="shrink-0 sticky left-0 z-[5] bg-white border-r px-3 flex items-center gap-1.5 overflow-hidden"
        style={{ width: LABEL_COLUMN_PX, borderColor: "#e8e6e3", height }}
      >
        <span className="text-xs bold truncate" style={{ color: "#17191c" }}>
          {row.roomTypeName}
        </span>
        {row.laneCount > 1 && (
          row.overCapacity ? (
            <span
              className="text-[9px] bold px-1.5 py-0.5 rounded-full shrink-0"
              style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}
              title={`${row.laneCount} bookings overlap but this room type only has ${row.quantity} unit${row.quantity === 1 ? "" : "s"}. This is a real double-booking, not expected multi-unit usage.`}
            >
              ⚠ {row.laneCount} over capacity
            </span>
          ) : (
            <span
              className="text-[9px] bold px-1.5 py-0.5 rounded-full shrink-0"
              style={{ backgroundColor: "#f2f0ed", color: "#4c4c4c" }}
              title={row.quantity != null
                ? `${row.laneCount} of ${row.quantity} units in use for overlapping dates, within capacity.`
                : `${row.laneCount} bookings overlap, room type capacity unknown.`}
            >
              {row.laneCount}×
            </span>
          )
        )}
      </div>

      {/* Timeline area, fills whatever width remains, no fixed px total.
          Day gridlines are the same flex-1 column count as GanttHeader, so
          they land exactly under the date they belong to regardless of
          view (day/week/month) or container width. */}
      <div className="relative flex flex-1 min-w-0" style={{ height }}>
        {Array.from({ length: visibleDays }).map((_, i) => (
          <div
            key={i}
            className="flex-1 min-w-0 border-r"
            style={{ borderColor: "#e8e6e3" }}
          />
        ))}
        <div className="absolute inset-0">
          {row.bars.map((bar) => (
            <BookingBar
              key={bar.booking.bookingId}
              bar={bar}
              onClick={() => onSelectBooking(bar.booking.bookingId)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}