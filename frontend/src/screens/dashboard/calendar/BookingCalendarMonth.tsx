import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Search, Building2 } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  isWeekend,
  addMonths,
  subMonths,
  parseISO,
  isValid,
} from "date-fns";
import { Input } from "@/components/ui/input";
import type { Booking } from "@/types/api";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Soft pastel chips — matched to the first screenshot */
const CARD_PALETTE = [
  {
    bg: "#FFEDD5",
    border: "#FDBA74",
    text: "#9A3412",
    iconBg: "#FED7AA",
  }, // soft orange
  {
    bg: "#FEF9C3",
    border: "#FDE047",
    text: "#854D0E",
    iconBg: "#FEF08A",
  }, // soft yellow
  {
    bg: "#F3E8FF",
    border: "#D8B4FE",
    text: "#6B21A8",
    iconBg: "#E9D5FF",
  }, // soft purple
  {
    bg: "#DCFCE7",
    border: "#86EFAC",
    text: "#166534",
    iconBg: "#BBF7D0",
  }, // soft green
  {
    bg: "#E0F2FE",
    border: "#7DD3FC",
    text: "#075985",
    iconBg: "#BAE6FD",
  }, // soft sky
  {
    bg: "#FCE7F3",
    border: "#F9A8D4",
    text: "#9D174D",
    iconBg: "#FBCFE8",
  }, // soft pink
  {
    bg: "#E0E7FF",
    border: "#A5B4FC",
    text: "#3730A3",
    iconBg: "#C7D2FE",
  }, // soft indigo
];

function cardStyleFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++)
    hash = (hash + id.charCodeAt(i) * 17) % CARD_PALETTE.length;
  return CARD_PALETTE[hash]!;
}

function statusLabel(status: string): string {
  if (status === "checked_in") return "Ongoing";
  if (status === "confirmed") return "Booked";
  if (status === "pending_payment") return "Pending";
  if (status === "checked_out") return "Done";
  if (status === "cancelled") return "Cancelled";
  return status.replace(/_/g, " ");
}

/** Status pill colors taken from the reference screenshot */
function statusPillStyle(status: string): { bg: string; text: string } {
  if (status === "checked_in") {
    return { bg: "#FACC15", text: "#422006" }; // Ongoing
  }
  if (status === "confirmed") {
    return { bg: "#22C55E", text: "#FFFFFF" }; // Booked
  }
  if (status === "pending_payment") {
    return { bg: "#F97316", text: "#FFFFFF" };
  }
  if (status === "checked_out") {
    return { bg: "#94A3B8", text: "#FFFFFF" };
  }
  if (status === "cancelled") {
    return { bg: "#EF4444", text: "#FFFFFF" };
  }
  return { bg: "#E5E7EB", text: "#374151" };
}

function parseDay(value: string): Date {
  const d = parseISO(value.slice(0, 10));
  return isValid(d) ? d : new Date(value);
}

interface Props {
  bookings: Booking[];
  onSelectBooking?: (booking: Booking) => void;
  onAddBooking?: () => void;
}

export default function BookingCalendarMonth({
  bookings,
  onSelectBooking,
  onAddBooking,
}: Props) {
  const [monthCursor, setMonthCursor] = useState(new Date());
  const [search, setSearch] = useState("");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const safeBookings = bookings ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return safeBookings;
    const q = search.toLowerCase();
    return safeBookings.filter(
      (b) =>
        b.bookingRef?.toLowerCase().includes(q) ||
        b.propertyName?.toLowerCase().includes(q) ||
        `${b.guestFirstName ?? ""} ${b.guestLastName ?? ""}`
          .toLowerCase()
          .includes(q),
    );
  }, [safeBookings, search]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthCursor), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(monthCursor), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [monthCursor]);

  const bookingsByDay = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of filtered) {
      const cursor = parseDay(b.checkIn);
      const end = parseDay(b.checkOut);
      while (cursor < end) {
        const key = format(cursor, "yyyy-MM-dd");
        const list = map.get(key) ?? [];
        list.push(b);
        map.set(key, list);
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    return map;
  }, [filtered]);

  return (
    <div className="">
      <div className="border border-[#e8e6e3] rounded-2xl overflow-hidden bg-white shadow-sm">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-[#e8e6e3]">
          <div>
            <h4 className="text-xl font-semibold text-[#17191c]">
              Accommodation
            </h4>
            <p className="text-xs text-[#a3a6af] mt-0.5">
              {format(startOfMonth(monthCursor), "MMM d")} –{" "}
              {format(endOfMonth(monthCursor), "MMM d, yyyy")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-48">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a3a6af]"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search guest or property"
                className="pl-8 h-9 text-xs rounded-full border-[#e8e6e3]"
              />
            </div>
            {onAddBooking && (
              <button
                type="button"
                onClick={onAddBooking}
                className="h-9 px-4 rounded-full text-xs text-white"
                style={{ backgroundColor: "var(--color-ink)" }}
              >
                Add booking
              </button>
            )}
          </div>
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#e8e6e3]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMonthCursor((d) => subMonths(d, 1))}
              className="p-1.5 hover:bg-[#f2f0ed] rounded-full transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => setMonthCursor((d) => addMonths(d, 1))}
              className="p-1.5 hover:bg-[#f2f0ed] rounded-full transition-colors"
            >
              <ChevronRight size={16} />
            </button>
            <p className="text-sm font-semibold text-[#17191c] ml-1">
              {format(monthCursor, "MMMM yyyy")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMonthCursor(new Date())}
              className="h-8 px-4 border border-[#e8e6e3] rounded-full text-xs text-[#17191c] hover:bg-[#f2f0ed]"
            >
              Today
            </button>
            <span className="h-8 px-3 rounded-full text-xs bg-[#f2f0ed] text-[#17191c] flex items-center">
              Month
            </span>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-[#f2f0ed] bg-[#fafaf9]">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="text-center text-[11px] font-medium text-[#a3a6af] uppercase tracking-wide py-2.5 border-r border-[#f2f0ed] last:border-r-0"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day grid – no day numbers, cards fill the cell */}
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayBookings = bookingsByDay.get(key) ?? [];
            const inMonth = isSameMonth(day, monthCursor);
            const today = isToday(day);
            const weekend = isWeekend(day);
            const selected = selectedDay === key;

            return (
              <div
                key={key}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedDay(key)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setSelectedDay(key);
                }}
                className={[
                  "min-h-[8.5rem] border-b border-r border-[#f2f0ed] p-1 flex flex-col gap-1 overflow-hidden last:border-r-0 transition-colors",
                  !inMonth ? "bg-[#f7f6f4]" : "",
                  inMonth && weekend ? "bg-[#fcfbfa]" : "",
                  inMonth && !weekend ? "bg-white" : "",
                  today ? "ring-2 ring-inset ring-[#17191c]/15" : "",
                  selected ? "bg-[#f0f7ff]" : "",
                  "hover:bg-[#f5f8ff]",
                ].join(" ")}
              >
                {/* Booking cards – fill full height & width */}
                <div className="flex flex-col gap-1 flex-1 min-h-0 h-full">
                  {dayBookings.slice(0, 3).map((b) => {
                    const palette = cardStyleFor(b.bookingId ?? b.bookingRef);
                    const guest =
                      [b.guestFirstName, b.guestLastName]
                        .filter(Boolean)
                        .join(" ") || b.bookingRef;
                    const range = `${format(parseDay(b.checkIn), "d MMM")} – ${format(
                      parseDay(b.checkOut),
                      "d MMM",
                    )}`;
                    const pill = statusPillStyle(b.status);

                    return (
                      <button
                        key={`${b.bookingId}-${key}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectBooking?.(b);
                        }}
                        className="w-full flex-1 text-left rounded-xl px-2 py-1.5 border transition-shadow hover:shadow-sm flex flex-col justify-between min-h-0"
                        style={{
                          backgroundColor: palette.bg,
                          borderColor: palette.border,
                          color: palette.text,
                        }}
                      >
                        <div className="flex items-start gap-1.5 min-h-0">
                          {/* Icon */}
                          <span
                            className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                            style={{ backgroundColor: palette.iconBg }}
                          >
                            <Building2
                              size={11}
                              strokeWidth={2.2}
                              style={{ color: palette.text }}
                            />
                          </span>

                          <div className="min-w-0 flex-1 overflow-hidden">
                            <p className="text-[11px] font-semibold truncate leading-tight">
                              {b.propertyName ?? "Property"}
                            </p>
                            <p className="text-[10px] truncate opacity-90 leading-tight mt-0.5">
                              {guest}
                            </p>
                          </div>
                        </div>

                        {/* Date + status at the bottom of the card */}
                        <div className="flex items-center justify-between gap-1 mt-1">
                          <span className="text-[9px] opacity-80 truncate">
                            {range}
                          </span>
                          <span
                            className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 leading-none"
                            style={{
                              backgroundColor: pill.bg,
                              color: pill.text,
                            }}
                          >
                            {statusLabel(b.status)}
                          </span>
                        </div>
                      </button>
                    );
                  })}

                  {dayBookings.length > 3 && (
                    <span className="text-[10px] text-[#a3a6af] px-1 shrink-0">
                      +{dayBookings.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 px-5 py-3 border-t border-[#e8e6e3] bg-[#fafaf9]">
          <LegendDot color="#17191c" label="Today" />
          <LegendDot color="#1a56ff" label="Selected day" />
          <LegendDot color="#22C55E" label="Booked" />
          <LegendDot color="#FACC15" label="Ongoing" />
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-2.5 h-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-[#777b86]">{label}</span>
    </div>
  );
}