import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useSetRoomSortModeMutation } from "@/redux/services/propertyApi";

const SORT_OPTIONS = [
  { key: "alphabetical", label: "Alphabetical" },
  { key: "rating",       label: "Top rated" },
  { key: "newest",       label: "Newest" },
  { key: "oldest",       label: "Oldest" },
  { key: "price",        label: "Price" },
  { key: "custom",       label: "Custom order" },
] as const;

interface Props {
  propertyId: string;
  currentSortMode: string;
  currentMaxVisibleRooms: number;
  onMaxVisibleRoomsChange: (max: number) => void;
}

export default function GanttFilterDropdown({ propertyId, currentSortMode, currentMaxVisibleRooms, onMaxVisibleRoomsChange }: Props) {
  const [open, setOpen] = useState(false);
  const [localMax, setLocalMax] = useState(currentMaxVisibleRooms);
  const [setSortMode] = useSetRoomSortModeMutation();

  const handleSortChange = async (mode: string) => {
    try {
      await setSortMode({ propertyId, mode }).unwrap();
    } catch {
      // errorMiddleware surfaces this, dropdown stays open either way
    }
  };

  const commitMax = () => {
    const clamped = Math.max(1, Math.min(50, localMax));
    setLocalMax(clamped);
    onMaxVisibleRoomsChange(clamped);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 h-8 px-3 text-xs lg:text-[13px]  border rounded-full hover:bg-[#f2f0ed] transition-colors"
        style={{ borderColor: "#e8e6e3", color: "#17191c" }}
      >
        Filter rooms
        <ChevronDown size={13} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-1.5 w-64 bg-white border rounded-xl shadow-lg z-30 p-3 text-xs"
          style={{ borderColor: "#e8e6e3" }}
        >
          <p className="bold mb-1.5" style={{ color: "#17191c" }}>Sort by</p>
          {SORT_OPTIONS.map((opt) => (
            <label key={opt.key} className="flex items-center gap-2 py-1 cursor-pointer" style={{ color: "#4c4c4c" }}>
              <input
                type="radio"
                name="ganttSortMode"
                checked={currentSortMode === opt.key}
                onChange={() => handleSortChange(opt.key)}
              />
              {opt.label}
            </label>
          ))}

          <div className="mt-2.5 pt-2.5 border-t" style={{ borderColor: "#f2f0ed" }}>
            <label className="flex items-center justify-between gap-2" style={{ color: "#777b86" }}>
              Max rooms before scroll
              <input
                type="number"
                min={1}
                max={50}
                value={localMax}
                onChange={(e) => setLocalMax(Number(e.target.value) || 1)}
                onBlur={commitMax}
                className="w-14 border rounded px-1.5 py-0.5"
                style={{ borderColor: "#e8e6e3" }}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}