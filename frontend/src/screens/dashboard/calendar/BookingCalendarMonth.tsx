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

/** Soft pastel chips — similar to the reference cards */
const CARD_PALETTE = [
  {
    bg: "#FFEDD5",
    border: "#FDBA74",
    text: "#9A3412",
    pillBg: "#F97316",
    pillText: "#FFFFFF",
    iconBg: "#FED7AA",
  }, // orange
  {
    bg: "#FEF9C3",
    border: "#FDE047",
    text: "#854D0E",
    pillBg: "#EAB308",
    pillText: "#FFFFFF",
    iconBg: "#FEF08A",
  }, // yellow
  {
    bg: "#F3E8FF",
    border: "#D8B4FE",
    text: "#6B21A8",
    pillBg: "#A855F7",
    pillText: "#FFFFFF",
    iconBg: "#E9D5FF",
  }, // purple
  {
    bg: "#E0E7FF",
    border: "#A5B4FC",
    text: "#3730A3",
    pillBg: "#6366F1",
    pillText: "#FFFFFF",
    iconBg: "#C7D2FE",
  }, // indigo
  {
    bg: "#DCFCE7",
    border: "#86EFAC",
    text: "#166534",
    pillBg: "#22C55E",
    pillText: "#FFFFFF",
    iconBg: "#BBF7D0",
  }, // green
  {
    bg: "#E0F2FE",
    border: "#7DD3FC",
    text: "#075985",
    pillBg: "#0EA5E9",
    pillText: "#FFFFFF",
    iconBg: "#BAE6FD",
  }, // sky
  {
    bg: "#FCE7F3",
    border: "#F9A8D4",
    text: "#9D174D",
    pillBg: "#EC4899",
    pillText: "#FFFFFF",
    iconBg: "#FBCFE8",
  }, // pink
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

  // Full weeks including days outside the current month (default calendar grid)
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
                className="pl-8 h-9 text-xs"
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

        {/* Day grid */}
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
                  "min-h-[9.5rem] border-b border-r border-[#f2f0ed] p-1.5 flex flex-col gap-1 overflow-hidden last:border-r-0 transition-colors",
                  !inMonth ? "bg-[#f7f6f4] text-[#c4c2be]" : "",
                  inMonth && weekend ? "bg-[#fcfbfa]" : "",
                  inMonth && !weekend ? "bg-white" : "",
                  today ? "ring-2 ring-inset ring-[#17191c]/15" : "",
                  selected ? "bg-[#f0f7ff]" : "",
                  "hover:bg-[#f5f8ff]",
                ].join(" ")}
              >
                {/* Day number highlight */}
                <div className="flex items-center justify-between px-0.5">
                  <span
                    className={[
                      "text-xs w-7 h-7 flex items-center justify-center rounded-full",
                      today
                        ? "bg-[#17191c] text-white font-semibold"
                        : selected
                          ? "bg-[#1a56ff] text-white font-medium"
                          : inMonth
                            ? "text-[#52525b] font-medium"
                            : "text-[#c4c2be]",
                    ].join(" ")}
                  >
                    {format(day, "d")}
                  </span>
                  {dayBookings.length > 0 && inMonth && (
                    <span className="text-[10px] text-[#a3a6af]">
                      {dayBookings.length}
                    </span>
                  )}
                </div>

                {/* Booking cards */}
                <div className="flex flex-col gap-1 flex-1 min-h-0">
                  {dayBookings.slice(0, 2).map((b) => {
                    const palette = cardStyleFor(b.bookingId ?? b.bookingRef);
                    const guest =
                      [b.guestFirstName, b.guestLastName]
                        .filter(Boolean)
                        .join(" ") || b.bookingRef;
                    const range = `${format(parseDay(b.checkIn), "d MMM")} – ${format(
                      parseDay(b.checkOut),
                      "d MMM",
                    )}`;

                    return (
                      <button
                        key={`${b.bookingId}-${key}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectBooking?.(b);
                        }}
                        className="w-full text-left rounded-xl px-1.5 py-1.5 border transition-shadow hover:shadow-sm"
                        style={{
                          backgroundColor: palette.bg,
                          borderColor: palette.border,
                          color: palette.text,
                        }}
                      >
                        <div className="flex items-start gap-1.5">
                          <span
                            className="w-4 h-4 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                            style={{ backgroundColor: palette.iconBg }}
                          >
                            <Building2
                              size={9}
                              style={{ color: palette.text }}
                            />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-semibold truncate leading-tight">
                              {b.propertyName ?? "Property"}
                            </p>
                            <p className="text-[10px] truncate opacity-90 leading-tight">
                              {guest}
                            </p>
                            <div className="flex items-center justify-between gap-1 mt-1">
                              <span className="text-[9px] opacity-80 truncate">
                                {range}
                              </span>
                              <span
                                className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                                style={{
                                  backgroundColor: palette.pillBg,
                                  color: palette.pillText,
                                }}
                              >
                                {statusLabel(b.status)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {dayBookings.length > 2 && (
                    <span className="text-[10px] text-[#a3a6af] px-1">
                      +{dayBookings.length - 2} more
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
          <LegendDot color="#86EFAC" label="Booked / confirmed" />
          <LegendDot color="#FDBA74" label="Ongoing (checked in)" />
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
