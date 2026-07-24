import { addDays, subDays, format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { statusStyle, type GanttView, VIEW_DAYS } from "@/constants";
import MultiSelectDropdown from "./MultiSelectDropdown";
import type { BookingStatus } from "@/types/api";

const ALL_STATUSES: BookingStatus[] = [
  "pending_payment", "confirmed", "checked_in", "checked_out", "cancelled", "refunded",
];

interface RoomTypeOption { id: string; name: string; }

interface Props {
  windowStart:        Date;
  onWindowChange:     (d: Date) => void;
  view:               GanttView;
  onViewChange:       (v: GanttView) => void;
  roomTypes:          RoomTypeOption[];
  selectedRoomTypes:  Set<string>;
  onToggleRoomType:   (id: string) => void;
  selectedStatuses:   Set<string>;
  onToggleStatus:     (status: string) => void;
  onReset:            () => void;
}

const VIEWS: { key: GanttView; label: string }[] = [
  { key: "day",   label: "Day" },
  { key: "week",  label: "Week" },
  { key: "month", label: "Month" },
];

export default function GanttToolbar({
  windowStart, onWindowChange, view, onViewChange,
  roomTypes, selectedRoomTypes, onToggleRoomType,
  selectedStatuses, onToggleStatus, onReset,
}: Props) {
  const visibleDays = VIEW_DAYS[view];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b" style={{ borderColor: "#e8e6e3" }}>
      <div className="flex items-center gap-3">
        <p className="text-sm bold whitespace-nowrap" style={{ color: "#17191c" }}>
          {format(windowStart, "MMM d")} – {format(addDays(windowStart, visibleDays - 1), "MMM d, yyyy")}
        </p>
        <div className="flex items-center gap-1">
          <button onClick={() => onWindowChange(subDays(windowStart, visibleDays))} className="p-1.5 rounded-full hover:bg-[#f2f0ed]">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => onWindowChange(new Date())} className="h-8 px-3 rounded-full text-xs border" style={{ borderColor: "#e8e6e3" }}>
            Today
          </button>
          <button onClick={() => onWindowChange(addDays(windowStart, visibleDays))} className="p-1.5 rounded-full hover:bg-[#f2f0ed]">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center rounded-full border p-0.5" style={{ borderColor: "#e8e6e3" }}>
          {VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => onViewChange(v.key)}
              className="h-7 px-3 rounded-full text-xs bold transition-colors"
              style={{
                backgroundColor: view === v.key ? "#17191c" : "transparent",
                color: view === v.key ? "#fff" : "#777b86",
              }}
            >
              {v.label}
            </button>
          ))}
        </div>

        <MultiSelectDropdown
          label="Room type"
          options={roomTypes.map((r) => ({ value: r.id, label: r.name }))}
          selected={selectedRoomTypes}
          onToggle={onToggleRoomType}
        />
        <MultiSelectDropdown
          label="Status"
          options={ALL_STATUSES.map((s) => ({ value: s, label: statusStyle(s).label, color: statusStyle(s).color }))}
          selected={selectedStatuses}
          onToggle={onToggleStatus}
        />

        <button onClick={onReset} className="text-xs underline" style={{ color: "#777b86" }}>
          Reset
        </button>
      </div>
    </div>
  );
}