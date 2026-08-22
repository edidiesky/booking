import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Search, Bell, Building2 } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { Input } from "@/components/ui/input";
import type { Booking } from "@/types/api";
import { STATUS_MAP } from "@/components/common/StatusBadge";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

  const safeBookings = bookings ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return safeBookings;
    const q = search.toLowerCase();
    return safeBookings.filter(
      (b) =>
        b.bookingRef.toLowerCase().includes(q) ||
        b.propertyName?.toLowerCase().includes(q),
    );
  }, [safeBookings, search]);

  const days = useMemo(() => {
    const start = startOfMonth(monthCursor);
    return eachDayOfInterval({ start, end: endOfMonth(monthCursor) });
  }, [monthCursor]);

  const leadingBlanks = days[0].getDay();

  const bookingsByDay = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of filtered) {
      const cursor = new Date(b.checkIn);
      const end = new Date(b.checkOut);
      while (cursor < end) {
        const key = format(cursor, "yyyy-MM-dd");
        (map.get(key) ?? map.set(key, []).get(key)!).push(b);
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    return map;
  }, [filtered]);

  return (
    <div className="p-4">
      <div className="border border-[#e8e6e3] rounded-xl overflow-hidden bg-white">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e6e3]">
          <div>
            <h4 className="text-xl font-semibold text-[#17191c]">Calendar</h4>
            <p className="text-xs lg:text-[13px]    text-[#a3a6af] mt-0.5">
              {format(startOfMonth(monthCursor), "MMM d")} –{" "}
              {format(endOfMonth(monthCursor), "MMM d, yyyy")}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a3a6af] pointer-events-none"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search bookings..."
                className="w-56"
              />
            </div>
            <button className="w-9 h-9 flex items-center justify-center border border-[#e8e6e3] rounded-full hover:bg-[#f2f0ed] transition-colors">
              <Bell size={14} />
            </button>
            <button
              onClick={onAddBooking}
              className="flex items-center gap-1.5 h-9 px-4 bg-[#17191c] text-white text-xs lg:text-[13px]   rounded-full hover:opacity-90 transition-opacity"
            >
              Add booking
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-b border-[#e8e6e3]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMonthCursor((d) => subMonths(d, 1))}
              className="p-1.5 hover:bg-[#f2f0ed] rounded-full transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setMonthCursor((d) => addMonths(d, 1))}
              className="p-1.5 hover:bg-[#f2f0ed] rounded-full transition-colors"
            >
              <ChevronRight size={16} />
            </button>
            <p className="text-xs lg:text-[13px]   font-semibold text-[#17191c] ml-1">
              {format(monthCursor, "MMMM yyyy")}
            </p>
          </div>
          <button
            onClick={() => setMonthCursor(new Date())}
            className="h-8 px-4 border border-[#e8e6e3] rounded-full text-xs lg:text-[13px]    text-[#17191c] hover:bg-[#f2f0ed] transition-colors"
          >
            Today
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-[#f2f0ed]">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="text-center text-xs lg:text-[13px]    text-[#a3a6af] uppercase py-2 border-r border-[#f2f0ed] last:border-r-0"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div
              key={`blank-${i}`}
              className="h-36 border-b border-r border-[#f2f0ed]"
            />
          ))}
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayBookings = bookingsByDay.get(key) ?? [];
            const inMonth = isSameMonth(day, monthCursor);
            const today = isToday(day);

            return (
              <div
                key={key}
                className={`h-36 border-b border-r border-[#f2f0ed] p-1.5 flex flex-col gap-1.5 overflow-hidden last:border-r-0 ${!inMonth ? "bg-[#fafaf9]" : ""}`}
              >
                <span
                  className={`text-xs lg:text-[13px]   px-1 w-fit rounded-full ${today ? "bg-[#17191c] text-white font-semibold" : "text-[#777b86]"}`}
                >
                  {format(day, "d")}
                </span>
                <div className="flex flex-col gap-1 overflow-hidden">
                  {dayBookings.slice(0, 2).map((b) => {
                    const status = STATUS_MAP[b.status] ?? {
                      label: b.status,
                      color: "#374151",
                      bg: "#f3f4f6",
                    };
                    const guestName =
                      [b.guestFirstName, b.guestLastName]
                        .filter(Boolean)
                        .join(" ") || "Guest";

                    return (
                      <button
                        key={b.bookingId}
                        onClick={() => onSelectBooking?.(b)}
                        className="text-left rounded-lg pl-2 pr-1.5 py-1.5 flex flex-col gap-0.5"
                        style={{
                          backgroundColor: status.bg,
                          borderLeft: `3px solid ${status.color}`,
                        }}
                        title={`${b.propertyName ?? b.bookingRef} · ${guestName} · ${status.label}`}
                      >
                        <div className="flex items-center gap-1 min-w-0">
                          <Building2 size={10} style={{ color: status.color }} className="shrink-0" />
                          <p
                            className="text-[11px] font-semibold truncate"
                            style={{ color: status.color }}
                          >
                            {guestName}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 justify-between">
                          <p className="text-[10px] truncate" style={{ color: status.color, opacity: 0.75 }}>
                            {format(new Date(b.checkIn), "d")}–{format(new Date(b.checkOut), "d MMM")}
                          </p>
                          <span
                            className="text-[9px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                            style={{ backgroundColor: "white", color: status.color }}
                          >
                            {status.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                  {dayBookings.length > 2 && (
                    <span className="text-[10px] text-[#a3a6af] px-1.5">
                      +{dayBookings.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-4 px-5 py-3 border-t border-[#e8e6e3] bg-white">
          {Object.entries(STATUS_MAP).map(([status, style]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: style.color }}
              />
              <span className="text-xs lg:text-[13px]    text-[#777b86]">{style.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}