import { statusStyle } from "@/constants";
import type { BookingStatus } from "@/types/api";

const ALL_STATUSES: BookingStatus[] = [
  "pending_payment", "confirmed", "checked_in", "checked_out", "cancelled", "refunded",
];

interface RoomTypeOption {
  id:   string;
  name: string;
}

interface Props {
  roomTypes:          RoomTypeOption[];
  selectedRoomTypes:  Set<string>;
  onToggleRoomType:   (id: string) => void;
  selectedStatuses:   Set<string>;
  onToggleStatus:     (status: string) => void;
  onReset:            () => void;
}

export default function GanttFilterPanel({
  roomTypes, selectedRoomTypes, onToggleRoomType,
  selectedStatuses, onToggleStatus, onReset,
}: Props) {
  return (
    <div className="w-64 shrink-0 flex flex-col gap-6 p-4 border-l" style={{ borderColor: "#e8e6e3" }}>
      <div className="flex items-center justify-between">
        <p className="text-xs bold" style={{ color: "#17191c" }}>Filters</p>
        <button onClick={onReset} className="text-xs underline" style={{ color: "#777b86" }}>
          Reset
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-widest" style={{ color: "#a3a6af" }}>Room type</p>
        {roomTypes.map((rt) => (
          <label key={rt.id} className="flex items-center gap-2 text-xs" style={{ color: "#17191c" }}>
            <input
              type="checkbox"
              checked={selectedRoomTypes.has(rt.id)}
              onChange={() => onToggleRoomType(rt.id)}
            />
            {rt.name}
          </label>
        ))}
        {roomTypes.length === 0 && (
          <p className="text-xs" style={{ color: "#a3a6af" }}>No room types with bookings yet.</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-widest" style={{ color: "#a3a6af" }}>Status</p>
        {ALL_STATUSES.map((status) => {
          const { label, color } = statusStyle(status);
          return (
            <label key={status} className="flex items-center gap-2 text-xs" style={{ color: "#17191c" }}>
              <input
                type="checkbox"
                checked={selectedStatuses.has(status)}
                onChange={() => onToggleStatus(status)}
              />
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
              {label}
            </label>
          );
        })}
      </div>
    </div>
  );
}