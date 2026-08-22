import { useState, useMemo, useRef, useEffect } from "react";
import { CalendarX2, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, isSameDay } from "date-fns";
import { VIEW_CONFIG, type GanttView, ROOM_COL_WIDTH, MIN_ROOM_ROW_HEIGHT, LANE_HEIGHT } from "@/constants";
import { useGanttLayout } from "@/hooks/useGanttLayout";
import { useIncrementalBookingWindow } from "@/hooks/useIncrementalBookingWindow";
import BookingBar from "./BookingBar";
import MultiSelectDropdown from "./MultiSelectDropdown";

interface Props {
  onSelectBooking: (bookingId: string) => void;
}
export default function BookingGantt({ onSelectBooking }: Props) {
  const [view, setView] = useState<GanttView>("month");
  const [windowStart, setWindowStart] = useState(() => new Date());
  const [maxVisibleRooms, setMaxVisibleRooms] = useState(8);
  const [roomTypeFilter, setRoomTypeFilter] = useState<Set<string> | null>(null);

  const config = VIEW_CONFIG[view];
  const { bookings, loadedDays, loadingMore, reachedCap, loadMore } = useIncrementalBookingWindow({
    windowStart, chunkSizeDays: config.chunkSizeDays, capDays: config.capDays,
  });

  const isHour = config.granularity === "hour";
  const unitWidth = isHour ? config.dayColWidth / 24 : config.dayColWidth;
  const totalUnits = isHour ? loadedDays * 24 : loadedDays;

  const rows = useGanttLayout({
    bookings, windowStart, totalUnits,
    granularity: config.granularity,
    roomTypeFilter, statusFilter: null,
  });

  // Filter options derived directly from the fetched bookings (every
  // booking already carries roomTypeName via the real toDto() mapping),
  // not a separate per-property room-types fetch, avoids an N+1 fetch
  // across every property just to populate a dropdown. Tradeoff worth
  // knowing: a room type with zero bookings anywhere in the currently
  // loaded window won't appear as a filterable option, that's an
  // acceptable gap for a filter (nothing to filter to anyway), not
  // acceptable for something that needs to be exhaustive.
  const roomTypeOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const b of bookings) {
      if (!seen.has(b.roomTypeId)) seen.set(b.roomTypeId, b.roomTypeName ?? "Room type");
    }
    return Array.from(seen.entries()).map(([value, label]) => ({ value, label }));
  }, [bookings]);

  const totalWidth = totalUnits * unitWidth;
  const rowHeight = (laneCount: number) => Math.max(MIN_ROOM_ROW_HEIGHT, laneCount * (LANE_HEIGHT + 4) + 12);
  const listMaxHeight = maxVisibleRooms * MIN_ROOM_ROW_HEIGHT;
  const needsRoomScroll = rows.length > maxVisibleRooms;

  // Three independently-scrollable regions kept in sync manually
  // (ADR: gantt-scroll-and-sort, decision 1), not CSS sticky, so the
  // room column can have its own scroll boundary separate from the
  // date-axis body.
  const headerRef = useRef<HTMLDivElement>(null);
  const roomColRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const handleBodyScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (headerRef.current) headerRef.current.scrollLeft = el.scrollLeft;
    if (roomColRef.current) roomColRef.current.scrollTop = el.scrollTop;
    if (!loadingMore && !reachedCap && el.scrollLeft + el.clientWidth >= el.scrollWidth - 200) {
      loadMore();
    }
  };

  useEffect(() => {
    if (headerRef.current) headerRef.current.scrollLeft = 0;
    if (bodyRef.current) bodyRef.current.scrollLeft = 0;
  }, [windowStart, view]);

  const days = useMemo(() => Array.from({ length: loadedDays }, (_, i) => addDays(windowStart, i)), [windowStart, loadedDays]);
  // const hourTicks = HOURS.filter((h) => h % 3 === 0);

  const goPrevious = () => setWindowStart((d) => addDays(d, view === "month" ? -30 : view === "week" ? -7 : -1));
  const goNext     = () => setWindowStart((d) => addDays(d, view === "month" ? 30  : view === "week" ? 7  : 1));
  const goToday    = () => setWindowStart(new Date());

  return (
    <div className="w-full border rounded-xl overflow-hidden" style={{ borderColor: "#e8e6e3" }}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-b" style={{ borderColor: "#e8e6e3" }}>
        <div className="flex items-center gap-1 rounded-full border p-0.5" style={{ borderColor: "#e8e6e3" }}>
          {(["day", "week", "month"] as GanttView[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-3 h-7 text-xs lg:text-[13px]     rounded-full capitalize transition-colors"
              style={{ backgroundColor: view === v ? "#17191c" : "transparent", color: view === v ? "#fff" : "#777b86" }}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <MultiSelectDropdown
            label="Room type"
            options={roomTypeOptions}
            selected={roomTypeFilter ?? new Set(roomTypeOptions.map((r) => r.value))}
            onToggle={(value) => {
              setRoomTypeFilter((prev) => {
                const next = new Set(prev ?? roomTypeOptions.map((r) => r.value));
                if (next.has(value)) next.delete(value); else next.add(value);
                return next;
              });
            }}
            searchable
          />
          <label className="flex items-center gap-1.5 text-xs lg:text-[13px]   px-2" style={{ color: "#777b86" }}>
            Max rows
            <input
              type="number"
              min={1}
              max={50}
              value={maxVisibleRooms}
              onChange={(e) => setMaxVisibleRooms(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
              className="w-12 h-7 border rounded-full px-2 text-xs lg:text-[13px]   outline-none"
              style={{ borderColor: "#e8e6e3" }}
            />
          </label>
          <div className="flex items-center gap-1">
            <button onClick={goPrevious} className="w-7 h-7 flex items-center justify-center rounded-full border hover:bg-[#f2f0ed]" style={{ borderColor: "#e8e6e3" }}>
              <ChevronLeft size={14} />
            </button>
            <button onClick={goToday} className="h-7 px-3 text-xs lg:text-[13px]   rounded-full border hover:bg-[#f2f0ed]" style={{ borderColor: "#e8e6e3", color: "#17191c" }}>
              Today
            </button>
            <button onClick={goNext} className="w-7 h-7 flex items-center justify-center rounded-full border hover:bg-[#f2f0ed]" style={{ borderColor: "#e8e6e3" }}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Frozen room column, own independent scroll, capped at listMaxHeight */}
        <div className="shrink-0 border-r" style={{ width: ROOM_COL_WIDTH, borderColor: "#e8e6e3" }}>
          <div className="h-9 border-b flex items-center px-3 text-xs lg:text-[13px]   " style={{ borderColor: "#e8e6e3", color: "#a3a6af" }}>
            Room
          </div>
          <div ref={roomColRef} className="overflow-hidden" style={needsRoomScroll ? { maxHeight: listMaxHeight } : undefined}>
            {rows.map((row) => (
              <div
                key={row.roomTypeId}
                className="px-3 border-b flex items-center gap-2"
                style={{ height: rowHeight(row.laneCount), borderColor: "#f2f0ed" }}
              >
                {row.roomImage ? (
                  <img src={row.roomImage} alt="" className="w-12 h-12 rounded object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded shrink-0" style={{ backgroundColor: "#f2f0ed" }} />
                )}
                <div className="min-w-0">
                  <p className="text-xs lg:text-[13px]     truncate" style={{ color: "#17191c" }}>{row.roomTypeName}</p>
                  {row.quantity !== undefined && row.laneCount > row.quantity && (
                    <p className="text-[10px]" style={{ color: "#dc2626" }}>⚠ {row.laneCount} over capacity</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Date-axis header + body */}
        <div className="flex-1 min-w-0">
          <div ref={headerRef} className="overflow-hidden">
            <div className="flex border-b" style={{ width: totalWidth, borderColor: "#e8e6e3" }}>
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className="shrink-0 h-9 flex items-center justify-center border-r text-xs"
                  style={{ width: isHour ? unitWidth * 24 : unitWidth, borderColor: "#f2f0ed", color: isSameDay(day, new Date()) ? "#17191c" : "#a3a6af" }}
                >
                  {isHour ? format(day, "EEE d") : format(day, view === "month" ? "d" : "EEE d")}
                </div>
              ))}
            </div>
          </div>

          <div
            ref={bodyRef}
            onScroll={handleBodyScroll}
            className={`overflow-x-auto ${needsRoomScroll ? "overflow-y-auto" : "overflow-y-hidden"}`}
            style={needsRoomScroll ? { maxHeight: listMaxHeight } : undefined}
          >
            {rows.length === 0 ? (
              bookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 p-16 text-center" style={{ width: totalWidth }}>
                  <CalendarX2 size={22} style={{ color: "#d1d1d1" }} />
                  <p className="text-xs lg:text-[13px]   " style={{ color: "#17191c" }}>No bookings yet</p>
                  <p className="text-xs lg:text-[13px]   max-w-xs" style={{ color: "#a3a6af" }}>
                    Bookings will show up here on this timeline once guests start reserving your rooms.
                  </p>
                </div>
              ) : (
                <div className="p-10 text-center text-xs" style={{ color: "#a3a6af", width: totalWidth }}>
                  No bookings match the current filters.
                </div>
              )
            ) : (
              <div style={{ width: totalWidth }}>
                {rows.map((row) => (
                  <div
                    key={row.roomTypeId}
                    className="relative border-b"
                    style={{ height: rowHeight(row.laneCount), borderColor: "#f2f0ed" }}
                  >
                    {/* Day-boundary gridlines, same width math as the
                        header (isHour ? unitWidth*24 : unitWidth), drawn
                        behind the bars, not a separate set of numbers
                        that can drift out of sync with the header. */}
                    <div className="absolute inset-0 pointer-events-none flex">
                      {days.map((day) => (
                        <div
                          key={day.toISOString()}
                          className="shrink-0 border-r"
                          style={{ width: isHour ? unitWidth * 24 : unitWidth, borderColor: "#f2f0ed" }}
                        />
                      ))}
                    </div>

                    {row.bars.map((bar) => (
                      <BookingBar
                        key={bar.booking.bookingId}
                        bar={bar}
                        unitWidth={unitWidth}
                        totalUnits={totalUnits}
                        roomImage={row.roomImage}
                        onClick={() => onSelectBooking(bar.booking.bookingId)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {(loadingMore || reachedCap) && (
            <div className="px-3 py-1.5 text-xs" style={{ color: "#a3a6af" }}>
              {loadingMore ? "Loading more..." : `Reached the maximum ${config.capLabel}, use Previous/Next to move further out.`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}