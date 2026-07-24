import { ROW_HEIGHT_PX, LANE_GAP_PX, LABEL_COLUMN_PX } from "@/constants";
import type { RoomTypeRow as RoomTypeRowData } from "@/hooks/useGanttLayout";
import BookingBar from "./BookingBar";

interface Props {
  row:      RoomTypeRowData;
  onSelectBooking: (bookingId: string) => void;
}

export default function GanttRow({ row, onSelectBooking }: Props) {
  const height = row.laneCount * ROW_HEIGHT_PX + (row.laneCount - 1) * LANE_GAP_PX + 8;

  return (
    <div className="flex border-b" style={{ borderColor: "#f2f0ed" }}>
      {/* Single-line room type label, sticky to the left as the timeline scrolls */}
      <div
        className="shrink-0 sticky left-0 z-[5] bg-white border-r px-3 flex items-center gap-1.5 overflow-hidden"
        style={{ width: LABEL_COLUMN_PX, borderColor: "#e8e6e3", height }}
      >
        <span className="text-xs lg:text-sm bold truncate" style={{ color: "#17191c" }}>
          {row.roomTypeName}
        </span>
        {row.laneCount > 1 && (
          <span
            className="text-[9px] bold px-1.5 py-0.5 rounded-full shrink-0"
            style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}
          >
            {row.laneCount}×
          </span>
        )}
      </div>

      {/* Timeline area, fills whatever width remains, no fixed px total */}
      <div className="relative flex-1 min-w-0" style={{ height }}>
        {row.bars.map((bar) => (
          <BookingBar
            key={bar.booking.bookingId}
            bar={bar}
            onClick={() => onSelectBooking(bar.booking.bookingId)}
          />
        ))}
      </div>
    </div>
  );
}