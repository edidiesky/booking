import { LANE_HEIGHT } from "@/constants";
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
  const left  = clampedStart * unitWidth;
  const width = Math.max(4, (clampedEnd - clampedStart) * unitWidth);
  const showThumbnail = Boolean(roomImage) && width > 90;
  const showText = width >= 50;

  return (
    <button
      onClick={onClick}
      title={`${bar.booking.bookingRef} · ${bar.label}`}
      className="absolute rounded-md px-2 flex items-center gap-1.5 overflow-hidden text-left transition-transform hover:scale-[1.02] hover:z-10"
      style={{
        left, width,
        top: bar.lane * (LANE_HEIGHT + 4),
        height: LANE_HEIGHT,
        backgroundColor: bar.bg,
        color: bar.color,
      }}
    >
      {showThumbnail && (
        <img src={roomImage!} alt="" className="w-5 h-5 rounded shrink-0 object-cover" />
      )}
      {showText && (
        <span className="flex flex-col justify-center min-w-0">
          <span className="text-[11px] bold truncate">{bar.booking.bookingRef}</span>
          <span className="text-[10px] truncate opacity-90">
            {[bar.booking.guestFirstName, bar.booking.guestLastName].filter(Boolean).join(" ") || "Guest"}
          </span>
        </span>
      )}
    </button>
  );
}