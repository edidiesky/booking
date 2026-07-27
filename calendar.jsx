import React, { useState, useMemo, useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// ReservationScheduler
//
// Day, Week, and Month all render through the SAME TimelineView engine:
// a frozen room column on the left, and one continuous hourly grid on the
// right that never shows a seam between days. The only differences between
// the three modes are how many days load per scroll-chunk and the overall
// lookahead cap — the room list, header format, gridlines, and scrolling
// behavior are identical everywhere, by construction.
//
// Bookings are laid out on a single continuous hour axis (not reset per
// calendar day), so a booking that starts at 9pm and ends at 9am the next
// day renders as one uninterrupted box spanning the boundary.
// ---------------------------------------------------------------------------

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const LANE_HEIGHT = 28;
const MIN_ROOM_ROW_HEIGHT = 56; // px — floor so name + session label always fit legibly
const HOUR_COL_WIDTH = 30; // px per hour column
const ROOM_COL_WIDTH = 176; // px, frozen room label column
const DEFAULT_MAX_VISIBLE_ROOMS = 8;

const STATUS_STYLES = {
  booked: "bg-emerald-100 border-emerald-400 text-emerald-800",
  tentative: "bg-amber-100 border-amber-400 text-amber-800",
  maintenance: "bg-gray-100 border-gray-400 text-gray-600",
};
const STATUS_DOT = {
  booked: "bg-emerald-500",
  tentative: "bg-amber-500",
  maintenance: "bg-gray-400",
};

const ROOMS = [
  { id: "skr", name: "Standard King Room", sessionHours: 6, maxUnits: 4, rating: 4.5, addedAt: "2025-01-10" },
  { id: "mtg", name: "Meeting Room 1", sessionHours: 6, maxUnits: 2, rating: 4.2, addedAt: "2025-02-15" },
  { id: "oasis", name: "Oasis", sessionHours: 1, maxUnits: 1, rating: 4.8, addedAt: "2026-05-01" },
  { id: "konale", name: "Konale", sessionHours: 24, maxUnits: 1, rating: 4.0, addedAt: "2024-11-20" },
  { id: "cottage", name: "Family Cottage", sessionHours: 24, maxUnits: 1, rating: 4.6, addedAt: "2025-03-05" },
  { id: "guesthouse", name: "Corporate Guesthouse", sessionHours: 12, maxUnits: 2, rating: 3.9, addedAt: "2025-06-18" },
  { id: "poolside", name: "Poolside Suite", sessionHours: 24, maxUnits: 1, rating: 4.9, addedAt: "2026-06-10" },
  { id: "garden", name: "Garden Villa", sessionHours: 24, maxUnits: 2, rating: 4.3, addedAt: "2025-09-01" },
  { id: "loft", name: "Executive Loft", sessionHours: 6, maxUnits: 1, rating: 4.1, addedAt: "2025-12-01" },
  { id: "skyline", name: "Skyline Studio", sessionHours: 3, maxUnits: 2, rating: 3.7, addedAt: "2026-01-22" },
];

function sessionLabel(room) {
  return room.sessionHours >= 24 ? `${room.sessionHours / 24}d / session` : `${room.sessionHours}h / session`;
}

// ---- date helpers ------------------------------------------------------------
function addDays(date, delta) {
  const d = new Date(date);
  d.setDate(d.getDate() + delta);
  return d;
}
function addMonths(date, delta) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + delta);
  return d;
}
function dateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function parseDateStr(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
function daysBetween(a, b) {
  return Math.round((startOfDay(b) - startOfDay(a)) / 86400000);
}
function isSameDay(a, b) {
  return dateStr(a) === dateStr(b);
}
function formatDayFull(date) {
  return date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", year: "numeric" });
}
function formatDayShort(date) {
  return date.toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
}
function formatMonthYear(date) {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}
function weekStartOf(anchor) {
  const d = new Date(anchor);
  const dow = (d.getDay() + 6) % 7; // 0 = Monday
  return addDays(d, -dow);
}
function formatHour(h) {
  const hh = ((h % 24) + 24) % 24;
  const period = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  const suffix = h >= 24 ? ` (+${Math.floor(h / 24)}d)` : "";
  return `${h12}:00 ${period}${suffix}`;
}

// ---- sample data ---------------------------------------------------------------
function buildSampleBookings(anchor) {
  const today = dateStr(anchor);
  const tomorrow = dateStr(addDays(anchor, 1));
  const dayAfter = dateStr(addDays(anchor, 2));
  const base = [
    { id: "b1", roomId: "skr", date: today, startHour: 0, durationHours: 6, status: "booked", label: "Session 1" },
    { id: "b2", roomId: "skr", date: today, startHour: 6, durationHours: 6, status: "booked", label: "Session 2" },
    { id: "b3", roomId: "skr", date: today, startHour: 12, durationHours: 6, status: "maintenance", label: "Maintenance" },
    { id: "b4", roomId: "skr", date: today, startHour: 18, durationHours: 6, status: "booked", label: "Session 4" },
    { id: "b5", roomId: "mtg", date: today, startHour: 9, durationHours: 6, status: "booked", label: "Unit A" },
    { id: "b6", roomId: "mtg", date: today, startHour: 12, durationHours: 6, status: "booked", label: "Unit B" },
    { id: "b7", roomId: "oasis", date: today, startHour: 9, durationHours: 5, status: "booked", label: "5h booking" },
    { id: "b8", roomId: "oasis", date: today, startHour: 15, durationHours: 1, status: "booked", label: "1h" },
    { id: "b9", roomId: "oasis", date: today, startHour: 17, durationHours: 1, status: "booked", label: "1h" },
    { id: "b10", roomId: "konale", date: today, startHour: 0, durationHours: 24, status: "booked", label: "Full-day booking" },
    { id: "b11", roomId: "skr", date: tomorrow, startHour: 0, durationHours: 6, status: "tentative", label: "Tentative hold" },
    { id: "b12", roomId: "oasis", date: tomorrow, startHour: 10, durationHours: 1, status: "booked", label: "1h" },
    { id: "b13", roomId: "konale", date: dayAfter, startHour: 0, durationHours: 24, status: "booked", label: "Full-day booking" },
    { id: "b14", roomId: "mtg", date: dayAfter, startHour: 8, durationHours: 6, status: "booked", label: "Client review" },
    { id: "b15", roomId: "cottage", date: today, startHour: 0, durationHours: 24, status: "booked", label: "D. Essien" },
    { id: "b16", roomId: "guesthouse", date: today, startHour: 0, durationHours: 12, status: "booked", label: "AM session" },
    { id: "b17", roomId: "guesthouse", date: today, startHour: 12, durationHours: 12, status: "tentative", label: "PM hold" },
    { id: "b18", roomId: "poolside", date: tomorrow, startHour: 0, durationHours: 24, status: "maintenance", label: "Maintenance" },
    { id: "b19", roomId: "garden", date: today, startHour: 0, durationHours: 24, status: "booked", label: "Unit A" },
    { id: "b20", roomId: "garden", date: today, startHour: 0, durationHours: 24, status: "booked", label: "Unit B" },
    { id: "b21", roomId: "loft", date: dayAfter, startHour: 9, durationHours: 6, status: "booked", label: "Client review" },
    { id: "b22", roomId: "skyline", date: today, startHour: 0, durationHours: 3, status: "booked", label: "Slot 1" },
    { id: "b23", roomId: "skyline", date: today, startHour: 3, durationHours: 3, status: "tentative", label: "Slot 2 hold" },
  ];

  // Cross-midnight test pattern, applied to 6 rooms: a 9pm-9am "Night shift
  // session" (12h, tentative/yellow) followed by a longer "Maintenance" block
  // (10am two days later back to 9am, gray) — both span day boundaries, so
  // they exercise the continuous (non-per-day-reset) booking layout.
  const crossMidnightRooms = ["oasis", "cottage", "konale", "skyline", "skr", "garden"];
  const crossMidnight = crossMidnightRooms.flatMap((roomId, i) => [
    { id: `nx${i}a`, roomId, date: today, startHour: 21, durationHours: 12, status: "tentative", label: "Night shift session" },
    { id: `nx${i}b`, roomId, date: tomorrow, startHour: 10, durationHours: 47, status: "maintenance", label: "Maintenance" },
  ]);

  return [...base, ...crossMidnight];
}

// Greedy interval partitioning on a continuous hour axis: a booking only
// gets a new lane when it truly overlaps an existing one. Works the same
// whether the interval sits inside one day or crosses several.
function layoutGlobalBookings(bookingsWithOffsets) {
  const sorted = [...bookingsWithOffsets].sort((a, b) => a.offset - b.offset);
  const laneEnds = [];
  const placed = sorted.map((bk) => {
    let lane = laneEnds.findIndex((end) => end <= bk.offset);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(bk.end);
    } else {
      laneEnds[lane] = bk.end;
    }
    return { ...bk, lane };
  });
  return { placed, laneCount: Math.max(laneEnds.length, 1) };
}

// ---- incremental "load more on lateral scroll" hook -----------------------------
// Simulates paged AJAX fetches: starts with one chunk, appends the next
// chunk when the container nears its right edge, up to `cap` items. Swap the
// setTimeout for a real fetch call when wiring this to a backend.
function useIncrementalList({ resetKey, chunkSize, cap, buildItem }) {
  const [count, setCount] = useState(chunkSize);
  const [loadingMore, setLoadingMore] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setCount(chunkSize);
    if (containerRef.current) containerRef.current.scrollLeft = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const items = useMemo(() => Array.from({ length: count }, (_, i) => buildItem(i)), [count, buildItem]);

  const handleScroll = (e) => {
    const el = e.target;
    if (loadingMore || count >= cap) return;
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 150) {
      setLoadingMore(true);
      setTimeout(() => {
        setCount((c) => Math.min(cap, c + chunkSize));
        setLoadingMore(false);
      }, 350);
    }
  };

  return { items, containerRef, handleScroll, loadingMore, reachedCap: count >= cap };
}

function ScrollFooter({ loadingMore, reachedCap, capLabel }) {
  if (loadingMore) return <div className="shrink-0 w-32 px-2 text-xs text-gray-400">Loading more…</div>;
  if (reachedCap) return <div className="shrink-0 w-40 px-2 text-xs text-gray-400">Reached the maximum {capLabel} — use Next to move further out.</div>;
  return null;
}

// ---- room filter/sort dropdown --------------------------------------------------
function RoomFilterDropdown({ rooms, sortMode, setSortMode, selectedRoomIds, setSelectedRoomIds, maxVisibleRooms, setMaxVisibleRooms }) {
  const [open, setOpen] = useState(false);
  const toggleRoom = (id) =>
    setSelectedRoomIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const SORT_OPTIONS = [
    { key: "alpha", label: "Alphabetical" },
    { key: "topRated", label: "Top rated" },
    { key: "latest", label: "Latest first" },
    { key: "selected", label: "Selected rooms" },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-1"
      >
        Filter rooms <span className="text-xs text-gray-400">▾</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-64 bg-white border border-gray-200 rounded shadow-lg z-30 p-3 text-sm">
          <div className="font-medium text-gray-700 mb-1">Sort by</div>
          {SORT_OPTIONS.map((opt) => (
            <label key={opt.key} className="flex items-center gap-2 py-1 cursor-pointer text-gray-700">
              <input type="radio" name="sortMode" checked={sortMode === opt.key} onChange={() => setSortMode(opt.key)} />
              {opt.label}
            </label>
          ))}
          {sortMode === "selected" && (
            <div className="mt-2 border-t border-gray-100 pt-2 max-h-40 overflow-y-auto">
              {rooms.map((r) => (
                <label key={r.id} className="flex items-center gap-2 py-1 cursor-pointer text-gray-700">
                  <input type="checkbox" checked={selectedRoomIds.includes(r.id)} onChange={() => toggleRoom(r.id)} />
                  {r.name}
                </label>
              ))}
            </div>
          )}
          <div className="mt-3 border-t border-gray-100 pt-2">
            <label className="flex items-center justify-between gap-2 text-xs text-gray-500">
              Max rooms before scroll <span className="text-gray-400">(host setting)</span>
              <input
                type="number"
                min={1}
                max={20}
                value={maxVisibleRooms}
                onChange={(e) => setMaxVisibleRooms(Math.max(1, Number(e.target.value) || 1))}
                className="w-14 border border-gray-300 rounded px-1 py-0.5 text-xs"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

function getDisplayRooms(rooms, sortMode, selectedRoomIds) {
  let list = sortMode === "selected" ? rooms.filter((r) => selectedRoomIds.includes(r.id)) : [...rooms];
  if (sortMode === "alpha" || sortMode === "selected") list.sort((a, b) => a.name.localeCompare(b.name));
  else if (sortMode === "topRated") list.sort((a, b) => b.rating - a.rating);
  else if (sortMode === "latest") list.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
  return list;
}

// View-mode config: only these three values change between Day, Week, and
// Month — everything else (markup, gridlines, scroll behavior) is identical.
const VIEW_CONFIG = {
  day: { chunkSizeDays: 5, capDays: 30, capLabel: "one month of days" },
  week: { chunkSizeDays: 7, capDays: 35, capLabel: "one month of weeks" },
  month: { chunkSizeDays: 30, capDays: 366, capLabel: "one year" },
};

// ---------------------------------------------------------------------------
export default function ReservationScheduler({ rooms = ROOMS, bookings: bookingsProp }) {
  const [viewMode, setViewMode] = useState("day"); // 'day' | 'week' | 'month'
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [sortMode, setSortMode] = useState("alpha");
  const [selectedRoomIds, setSelectedRoomIds] = useState(() => rooms.map((r) => r.id));
  const [maxVisibleRooms, setMaxVisibleRooms] = useState(DEFAULT_MAX_VISIBLE_ROOMS);
  const [selection, setSelection] = useState(null); // { type:'booking', booking } | { type:'room', room }

  const initialAnchor = useMemo(() => new Date(), []);
  const bookings = bookingsProp || useMemo(() => buildSampleBookings(initialAnchor), [initialAnchor]);

  const displayRooms = useMemo(() => getDisplayRooms(rooms, sortMode, selectedRoomIds), [rooms, sortMode, selectedRoomIds]);

  const bookingsForRoom = (roomId) => bookings.filter((b) => b.roomId === roomId);

  const goPrevious = () => {
    if (viewMode === "day") setAnchorDate((d) => addDays(d, -1));
    else if (viewMode === "week") setAnchorDate((d) => addDays(d, -7));
    else setAnchorDate((d) => addMonths(d, -1));
  };
  const goNext = () => {
    if (viewMode === "day") setAnchorDate((d) => addDays(d, 1));
    else if (viewMode === "week") setAnchorDate((d) => addDays(d, 7));
    else setAnchorDate((d) => addMonths(d, 1));
  };
  const goToday = () => setAnchorDate(new Date());

  const headerTitle =
    viewMode === "day"
      ? formatDayFull(anchorDate)
      : viewMode === "week"
      ? `Week of ${formatDayShort(weekStartOf(anchorDate))}`
      : formatMonthYear(anchorDate);

  const openBooking = (bk) => setSelection({ type: "booking", booking: bk });
  const openRoom = (room) => setSelection({ type: "room", room });

  const config = VIEW_CONFIG[viewMode];

  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Reservation Schedule</h2>
          <p className="text-sm text-gray-500">{headerTitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded border border-gray-300 overflow-hidden">
            {["day", "week", "month"].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={["px-3 py-1.5 text-sm capitalize", viewMode === mode ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"].join(" ")}
              >
                {mode}
              </button>
            ))}
          </div>
          <RoomFilterDropdown
            rooms={rooms}
            sortMode={sortMode}
            setSortMode={setSortMode}
            selectedRoomIds={selectedRoomIds}
            setSelectedRoomIds={setSelectedRoomIds}
            maxVisibleRooms={maxVisibleRooms}
            setMaxVisibleRooms={setMaxVisibleRooms}
          />
          <div className="flex gap-2">
            <button onClick={goPrevious} className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50">Previous</button>
            <button onClick={goToday} className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50">Today</button>
            <button onClick={goNext} className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> Booked</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> Tentative</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-gray-400" /> Maintenance</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm border border-gray-300 bg-white" /> Free</span>
      </div>

      {/* Body: calendar + detail panel, stacks on small screens */}
      <div className="flex flex-col md:flex-row">
        <div className="flex-1 min-w-0 p-4">
          <TimelineView
            key={viewMode}
            rooms={displayRooms}
            bookingsForRoom={bookingsForRoom}
            anchorDate={anchorDate}
            onSelectBooking={openBooking}
            onSelectRoom={openRoom}
            maxVisibleRooms={maxVisibleRooms}
            chunkSizeDays={config.chunkSizeDays}
            capDays={config.capDays}
            capLabel={config.capLabel}
          />
        </div>

        {selection && (
          <DetailPanel
            selection={selection}
            rooms={rooms}
            onClose={() => setSelection(null)}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TimelineView — the one engine behind Day, Week, and Month. Frozen room
// column on the left; a continuous hourly grid on the right that loads more
// days as it's scrolled, up to `capDays`. Bookings are placed on a single
// continuous hour axis so they render correctly even when they cross a day
// boundary.
// ---------------------------------------------------------------------------
function TimelineView({ rooms, bookingsForRoom, anchorDate, onSelectBooking, onSelectRoom, maxVisibleRooms, chunkSizeDays, capDays, capLabel }) {
  const buildItem = (i) => addDays(anchorDate, i);
  const { items, containerRef, handleScroll, loadingMore, reachedCap } = useIncrementalList({
    resetKey: `tl-${dateStr(anchorDate)}`,
    chunkSize: chunkSizeDays,
    cap: capDays,
    buildItem,
  });

  const headerRef = useRef(null);
  const leftBodyRef = useRef(null);
  useEffect(() => {
    if (headerRef.current) headerRef.current.scrollLeft = 0;
    if (leftBodyRef.current) leftBodyRef.current.scrollTop = 0;
  }, [dateStr(anchorDate)]);

  const hourLabels = HOURS.filter((h) => h % 3 === 0);
  const dayWidth = 24 * HOUR_COL_WIDTH;
  const totalWidth = items.length * dayWidth;
  const windowHours = items.length * 24;
  const epoch = items[0];

  const roomRows = rooms.map((room) => {
    const withOffsets = bookingsForRoom(room.id)
      .map((bk) => {
        const offset = daysBetween(epoch, parseDateStr(bk.date)) * 24 + bk.startHour;
        return { ...bk, offset, end: offset + bk.durationHours };
      })
      .filter((bk) => bk.end > 0 && bk.offset < windowHours);
    const { placed, laneCount } = layoutGlobalBookings(withOffsets);
    return { room, placed, laneCount, rowHeight: Math.max(MIN_ROOM_ROW_HEIGHT, laneCount * LANE_HEIGHT + 12) };
  });

  const needsRoomScroll = rooms.length > maxVisibleRooms;
  const listMaxHeight = maxVisibleRooms * MIN_ROOM_ROW_HEIGHT;

  const handleBodyScroll = (e) => {
    if (headerRef.current) headerRef.current.scrollLeft = e.target.scrollLeft;
    if (leftBodyRef.current) leftBodyRef.current.scrollTop = e.target.scrollTop;
    handleScroll(e);
  };

  return (
    <div className="flex border border-gray-200 rounded overflow-hidden">
      {/* Frozen room column */}
      <div className="shrink-0" style={{ width: ROOM_COL_WIDTH }}>
        <div className="p-2 text-xs font-medium text-gray-400 bg-gray-50 border-b border-r border-gray-200 flex items-center" style={{ height: 56 }}>
          Room
        </div>
        <div ref={leftBodyRef} className="overflow-hidden" style={needsRoomScroll ? { maxHeight: listMaxHeight } : undefined}>
          {roomRows.map(({ room, rowHeight }) => (
            <button
              key={room.id}
              onClick={() => onSelectRoom(room)}
              style={{ height: rowHeight }}
              className="w-full p-2 border-b border-r border-gray-100 last:border-b-0 flex flex-col justify-center text-left hover:bg-gray-50"
            >
              <span className="text-sm text-gray-800 truncate">{room.name}</span>
              <span className="text-xs text-gray-400">{sessionLabel(room)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Scrolling date/time area */}
      <div className="flex-1 min-w-0">
        <div ref={headerRef} className="overflow-hidden">
          <div style={{ width: totalWidth }}>
            <div className="flex bg-gray-50 border-b border-gray-100" style={{ height: 28 }}>
              {items.map((date, di) => (
                <div
                  key={dateStr(date)}
                  style={{ width: dayWidth }}
                  className={["text-sm font-medium text-gray-700 px-2 flex items-center truncate", di > 0 ? "border-l-2 border-gray-300" : ""].join(" ")}
                >
                  {formatDayFull(date)}
                  {isSameDay(date, new Date()) && <span className="ml-2 text-xs text-indigo-600">Today</span>}
                </div>
              ))}
            </div>
            <div className="flex bg-gray-50 border-b border-gray-200" style={{ height: 28 }}>
              {items.map((date, di) => (
                <div
                  key={dateStr(date)}
                  style={{ width: dayWidth, display: "grid", gridTemplateColumns: `repeat(${hourLabels.length}, 1fr)` }}
                  className={di > 0 ? "border-l-2 border-gray-300" : ""}
                >
                  {hourLabels.map((h) => (
                    <div key={h} className="text-xs text-gray-500 px-1 border-r border-gray-200 last:border-r-0 flex items-center">{formatHour(h)}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          ref={containerRef}
          onScroll={handleBodyScroll}
          className={["overflow-x-auto", needsRoomScroll ? "overflow-y-auto" : "overflow-y-hidden"].join(" ")}
          style={needsRoomScroll ? { maxHeight: listMaxHeight } : undefined}
        >
          <div style={{ width: totalWidth }}>
            {roomRows.map(({ room, placed, laneCount, rowHeight }) => (
              <div key={room.id} className="relative border-b border-gray-100 last:border-b-0" style={{ height: rowHeight, width: totalWidth }}>
                <div className="absolute inset-0 grid pointer-events-none" style={{ gridTemplateColumns: `repeat(${items.length * 24}, 1fr)` }}>
                  {Array.from({ length: items.length * 24 }).map((_, gi) => (
                    <div key={gi} className={gi % 24 === 0 && gi > 0 ? "border-l-2 border-gray-300" : gi % 3 === 0 ? "border-r border-gray-200" : "border-r border-gray-100"} />
                  ))}
                </div>
                <div className="relative grid h-full p-1 gap-0.5" style={{ gridTemplateColumns: `repeat(${windowHours}, 1fr)`, gridTemplateRows: `repeat(${laneCount}, 1fr)` }}>
                  {placed.map((bk) => {
                    const clampedStart = Math.max(0, bk.offset);
                    const clampedEnd = Math.min(windowHours, bk.end);
                    return (
                      <button
                        key={bk.id}
                        onClick={() => onSelectBooking(bk)}
                        style={{ gridColumn: `${clampedStart + 1} / ${clampedEnd + 1}`, gridRow: bk.lane + 1 }}
                        className={`rounded border text-xs px-2 flex items-center truncate hover:opacity-80 ${STATUS_STYLES[bk.status]}`}
                      >
                        {bk.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex mt-1">
          <ScrollFooter loadingMore={loadingMore} reachedCap={reachedCap} capLabel={capLabel} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail panel — appears on the right only when something is selected, so
// the calendar gets the full width the rest of the time.
// ---------------------------------------------------------------------------
function DetailPanel({ selection, rooms, onClose }) {
  const roomName = (id) => rooms.find((r) => r.id === id)?.name || id;
  return (
    <div className="w-full md:w-72 shrink-0 border-t md:border-t-0 md:border-l border-gray-100 p-4">
      {selection?.type === "room" && (
        <div>
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-semibold text-gray-900">{selection.room.name}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
          </div>
          <div className="mt-3 space-y-2 text-sm text-gray-600">
            <div className="flex justify-between"><span className="text-gray-400">Session length</span><span>{sessionLabel(selection.room)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Max concurrent units</span><span>{selection.room.maxUnits}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Rating</span><span>{selection.room.rating.toFixed(1)} ★</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Added</span><span>{selection.room.addedAt}</span></div>
          </div>
        </div>
      )}
      {selection?.type === "booking" && (
        <div>
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-semibold text-gray-900">{selection.booking.label}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
          </div>
          <div className="mt-3 space-y-2 text-sm text-gray-600">
            <div className="flex justify-between"><span className="text-gray-400">Room</span><span>{roomName(selection.booking.roomId)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Start date</span><span>{selection.booking.date}</span></div>
            <div className="flex justify-between">
              <span className="text-gray-400">Time</span>
              <span>{formatHour(selection.booking.startHour)} – {formatHour(selection.booking.startHour + selection.booking.durationHours)}</span>
            </div>
            <div className="flex justify-between"><span className="text-gray-400">Duration</span><span>{selection.booking.durationHours}h</span></div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Status</span>
              <span className="flex items-center gap-1.5 capitalize">
                <span className={`w-2 h-2 rounded-full ${STATUS_DOT[selection.booking.status]}`} />
                {selection.booking.status}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
