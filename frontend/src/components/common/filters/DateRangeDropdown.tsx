import { useState, useRef, useEffect } from "react";
import {
  addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval,
  format, isSameMonth, isSameDay, isWithinInterval, isBefore,
} from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

export interface DateRange {
  start: Date | null;
  end:   Date | null;
}

interface Props {
  value:    DateRange;
  onApply:  (range: DateRange) => void;
  placeholder?: string;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
export default function DateRangeDropdown({ value, onApply, placeholder = "Select Date Range" }: Props) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => value.start ?? new Date());
  const [draftStart, setDraftStart] = useState<Date | null>(value.start);
  const [draftEnd, setDraftEnd] = useState<Date | null>(value.end);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const leadingBlanks = startOfMonth(month).getDay();

  const handleDayClick = (day: Date) => {
    if (!draftStart || (draftStart && draftEnd)) {
      setDraftStart(day);
      setDraftEnd(null);
    } else if (isBefore(day, draftStart)) {
      setDraftStart(day);
      setDraftEnd(null);
    } else {
      setDraftEnd(day);
    }
  };

  const handleApply = () => {
    onApply({ start: draftStart, end: draftEnd });
    setOpen(false);
  };

  const label = value.start && value.end
    ? `${format(value.start, "MMM d")} – ${format(value.end, "MMM d, yyyy")}`
    : placeholder;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-9 px-3 rounded-lg text-xs lg:text-sm flex items-center gap-1.5 border transition-colors hover:bg-[#fafaf9]"
        style={{ borderColor: "#e8e6e3", color: value.start ? "#17191c" : "#777b86" }}
      >
        <CalendarIcon size={12} style={{ color: "#a3a6af" }} />
        {label}
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1.5 z-30 bg-white border rounded-xl shadow-lg p-3 flex flex-col gap-3"
          style={{ borderColor: "#e8e6e3", width: 280 }}
        >
          <div className="flex items-center justify-between">
            <button onClick={() => setMonth((m) => subMonths(m, 1))} className="p-1 rounded-full hover:bg-[#f2f0ed]">
              <ChevronLeft size={14} />
            </button>
            <p className="text-xs lg:text-sm" style={{ color: "#17191c" }}>{format(month, "MMMM yyyy")}</p>
            <button onClick={() => setMonth((m) => addMonths(m, 1))} className="p-1 rounded-full hover:bg-[#f2f0ed]">
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-1">
            {WEEKDAYS.map((w, i) => (
              <div key={i} className="text-[10px] text-center" style={{ color: "#a3a6af" }}>{w}</div>
            ))}
            {Array.from({ length: leadingBlanks }).map((_, i) => <div key={`b${i}`} />)}
            {days.map((day) => {
              const inRange = draftStart && draftEnd && isWithinInterval(day, { start: draftStart, end: draftEnd });
              const isEndpoint = (draftStart && isSameDay(day, draftStart)) || (draftEnd && isSameDay(day, draftEnd));
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  disabled={!isSameMonth(day, month)}
                  className="text-xs lg:text-sm h-7 w-7 rounded-full mx-auto flex items-center justify-center disabled:opacity-0"
                  style={{
                    backgroundColor: isEndpoint ? "#17191c" : inRange ? "#f2f0ed" : "transparent",
                    color: isEndpoint ? "#fff" : "#17191c",
                  }}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-1.5 text-xs lg:text-sm pt-1 border-t" style={{ borderColor: "#f2f0ed", color: "#777b86" }}>
            <div className="flex items-center justify-between">
              <span>Start</span>
              <span className="bold" style={{ color: "#17191c" }}>{draftStart ? format(draftStart, "MMM d, yyyy") : "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>End</span>
              <span className="bold" style={{ color: "#17191c" }}>{draftEnd ? format(draftEnd, "MMM d, yyyy") : "—"}</span>
            </div>
          </div>

          <button
            onClick={handleApply}
            disabled={!draftStart}
            className="h-9 rounded-lg text-xs lg:text-sm disabled:opacity-50"
            style={{ backgroundColor: "#17191c", color: "#fff" }}
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}