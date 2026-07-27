import { useMemo, useState, useCallback } from "react";
import "@bitnoi.se/react-scheduler/dist/style.css";
import { Scheduler } from "@bitnoi.se/react-scheduler";
import type { SchedulerData } from "@bitnoi.se/react-scheduler";
import { isWithinInterval, isBefore, isAfter } from "date-fns";
import type { Booking } from "@/types/api";
import { STATUS_MAP } from "@/components/common/StatusBadge";

interface Props {
  bookings: Booking[];
  isLoading: boolean;
  onSelectBooking: (booking: Booking) => void;
}

interface DateRange {
  startDate: Date;
  endDate: Date;
}

// Groups bookings by room type into Scheduler's row/tile shape. Each row
// is a room type (matches this being a Gantt-style resource timeline, not
// a month grid, rows = resources, tiles = bookings across time), not a
// per-day cell like BookingCalendarMonth.
function toSchedulerData(bookings: Booking[], range: DateRange): SchedulerData {
  const byRoomType = new Map<string, Booking[]>();
  for (const b of bookings) {
    const list = byRoomType.get(b.roomTypeId) ?? [];
    list.push(b);
    byRoomType.set(b.roomTypeId, list);
  }

  return Array.from(byRoomType.entries()).map(([roomTypeId, roomBookings]) => {
    const first = roomBookings[0];
    return {
      id: roomTypeId,
      label: {
        icon: first.roomTypeImage ?? "",
        title: first.roomTypeName ?? "Room type",
        subtitle: first.propertyName ?? "",
      },
      data: roomBookings
        .filter((b) => {
          const checkIn = new Date(b.checkIn);
          const checkOut = new Date(b.checkOut);
          // Only include bookings that overlap the currently visible range,
          // the scheduler calls onRangeChange as the user navigates, this
          // keeps the payload bounded instead of pushing every booking to
          // the canvas at once (their own README flags canvas perf with
          // large datasets, especially on Firefox).
          return (
            isWithinInterval(checkIn, { start: range.startDate, end: range.endDate }) ||
            isWithinInterval(checkOut, { start: range.startDate, end: range.endDate }) ||
            (isBefore(checkIn, range.startDate) && isAfter(checkOut, range.endDate))
          );
        })
        .map((b) => {
          const checkIn = new Date(b.checkIn);
          const checkOut = new Date(b.checkOut);
          const guestName = [b.guestFirstName, b.guestLastName].filter(Boolean).join(" ") || "Guest";
          const statusStyle = STATUS_MAP[b.status] ?? { label: b.status, color: "#374151" };

          return {
            id: b.bookingId,
            startDate: checkIn,
            endDate: checkOut,
            // Documented as seconds, not the row count/hours the library's
            // own example snippet mistakenly passes.
            occupancy: Math.round((checkOut.getTime() - checkIn.getTime()) / 1000),
            title: b.bookingRef,
            subtitle: `${guestName} · ${statusStyle.label}`,
            bgColor: statusStyle.color,
          };
        }),
    };
  });
}

export default function BookingTimeline({ bookings, isLoading, onSelectBooking }: Props) {
  const [filterButtonState, setFilterButtonState] = useState(0);
  const [range, setRange] = useState<DateRange>(() => {
    const now = new Date();
    return { startDate: now, endDate: new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()) };
  });

  const schedulerData = useMemo(() => toSchedulerData(bookings, range), [bookings, range]);

  const handleTileClick = useCallback(
    (tile: { id: string }) => {
      const booking = bookings.find((b) => b.bookingId === tile.id);
      if (booking) onSelectBooking(booking);
    },
    [bookings, onSelectBooking],
  );

  return (
    <div className="relative w-full" style={{ height: "70vh" }}>
      <Scheduler
        data={schedulerData}
        isLoading={isLoading}
        onRangeChange={(r) => setRange(r)}
        onTileClick={handleTileClick}
        onFilterData={() => setFilterButtonState(1)}
        onClearFilterData={() => setFilterButtonState(0)}
        config={{
          zoom: 0,
          filterButtonState,
          maxRecordsPerPage: 20,
        }}
      />
    </div>
  );
}