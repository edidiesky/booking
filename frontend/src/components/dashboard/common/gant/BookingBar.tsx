import { LANE_GAP_PX, ROW_HEIGHT_PX } from "@/constants";
import type { PositionedBar } from "@/hooks/useGanttLayout";

interface Props {
  bar:      PositionedBar;
  onClick:  () => void;
}

export default function BookingBar({ bar, onClick }: Props) {
  const top = bar.lane * (ROW_HEIGHT_PX + LANE_GAP_PX);

  return (
    <button
      onClick={onClick}
      title={`${bar.booking.bookingRef} · ${bar.label}`}
      className="absolute rounded-md px-3 flex flex-col justify-center overflow-hidden text-left transition-transform hover:scale-[1.02] hover:z-10"
      style={{
        left: `${bar.leftPct}%`,
        width: `calc(${bar.widthPct}% - 4px)`,
        top,
        height: ROW_HEIGHT_PX - 6,
        // backgroundColor: "#f5f5f3",
        backgroundColor: bar.bg,
        color: "#000",
      }}
    >
      <span className="text-xs text-[#9e9e9e] bold truncate">{bar.booking.bookingRef}</span>
      <span className="text-sm truncate opacity-90">
        {[bar.booking.guestFirstName, bar.booking.guestLastName].filter(Boolean).join(" ") || "Guest"}
      </span>
    </button>
  );
}