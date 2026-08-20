import { LANE_GAP_PX, LANE_HEIGHT, ROW_HEIGHT_PX } from "@/constants";
import type { ContinuousBar } from "@/hooks/useGanttLayout";

interface Props {
  bar:        ContinuousBar;
  unitWidth:  number; // px per hour (Day view) or px per day (Week/Month)
  totalUnits: number;
  roomImage?: string | null;
  onClick:    () => void;
}

export default function BookingBar({ bar, unitWidth, totalUnits, roomImage, onClick }: Props) {
  const clampedStart = Math.max(0, bar.offset);
  const clampedEnd   = Math.min(totalUnits, bar.end);
  const left  = clampedStart * unitWidth + 10;
  const width = Math.max(4, (clampedEnd - clampedStart) * unitWidth);
  const showText = width >= 50;

  console.log("roomImage:", roomImage)
  return (
    <button
      onClick={onClick}
      title={`${bar.booking.bookingRef} · ${bar.label}`}
      className="absolute rounded-md px-1 border-r-2 flex items-center gap-1.5 overflow-hidden text-left transition-transform hover:scale-[1.02] hover:z-10"
      style={{
        left, width,
        top: bar.lane * (ROW_HEIGHT_PX + LANE_GAP_PX) + 10,
        height: LANE_HEIGHT,
        backgroundColor: bar.bg,
        color: bar.color,
      }}
    >
      {showText && (
        <span className="flex flex-col justify-center min-w-0">
          <span className="text-xs lg:text-[13px]  truncate">{bar.booking.bookingRef}</span>
          <span className="text-xs lg:text-[13px]truncate opacity-90">
            {[bar.booking.guestFirstName, bar.booking.guestLastName].filter(Boolean).join(" ") || "Guest"}
          </span>
        </span>
      )}
    </button>
  );
}