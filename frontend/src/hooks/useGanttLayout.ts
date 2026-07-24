import { useMemo } from "react";
import { differenceInCalendarDays, startOfDay } from "date-fns";
import type { Booking } from "@/types/api";
import { statusStyle } from "../constants";

export interface PositionedBar {
  booking:  Booking;
  lane:     number;
  leftPct:  number;
  widthPct: number;
  label:    string;
  color:    string;
  bg:       string;
}

export interface RoomTypeRow {
  roomTypeId:   string;
  roomTypeName: string;
  propertyName: string;
  laneCount:    number;
  bars:         PositionedBar[];
}

interface Options {
  bookings:        Booking[];
  windowStart:     Date;
  visibleDays:      number;
  roomTypeFilter:  Set<string> | null; // null = no filter, show all
  statusFilter:    Set<string> | null;
}

// Packs bookings that overlap in date range into separate lanes (rows within
// a row), same algorithm calendar apps use for overlapping events: sort by
// start date, place each item in the first lane whose last item ends before
// this one starts, otherwise open a new lane. This is what actually makes
// overlapping bookings for the same room type (multiple physical units
// under one room type, or a double-booking bug) visually obvious, instead
// of bars silently stacking on top of each other.
function packLanes(bookings: Booking[]): { lanes: Booking[][]; laneOf: Map<string, number> } {
  const sorted = [...bookings].sort(
    (a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime(),
  );
  const lanes: Booking[][] = [];
  const laneOf = new Map<string, number>();

  for (const booking of sorted) {
    const checkIn = new Date(booking.checkIn);
    let placed = false;
    for (let i = 0; i < lanes.length; i++) {
      const lastInLane = lanes[i][lanes[i].length - 1];
      if (new Date(lastInLane.checkOut) <= checkIn) {
        lanes[i].push(booking);
        laneOf.set(booking.bookingId, i);
        placed = true;
        break;
      }
    }
    if (!placed) {
      lanes.push([booking]);
      laneOf.set(booking.bookingId, lanes.length - 1);
    }
  }

  return { lanes, laneOf };
}

export function useGanttLayout({ bookings, windowStart, visibleDays, roomTypeFilter, statusFilter }: Options): RoomTypeRow[] {
  return useMemo(() => {
    const filtered = bookings.filter((b) => {
      if (roomTypeFilter && !roomTypeFilter.has(b.roomTypeId)) return false;
      if (statusFilter && !statusFilter.has(b.status)) return false;
      return true;
    });

    const byRoomType = new Map<string, Booking[]>();
    for (const b of filtered) {
      const list = byRoomType.get(b.roomTypeId) ?? [];
      list.push(b);
      byRoomType.set(b.roomTypeId, list);
    }

    const start = startOfDay(windowStart);
    const dayPct = 100 / visibleDays;

    return Array.from(byRoomType.entries()).map(([roomTypeId, roomBookings]) => {
      const { lanes, laneOf } = packLanes(roomBookings);
      const first = roomBookings[0];

      const bars: PositionedBar[] = roomBookings
        .filter((b) => {
          const checkIn = startOfDay(new Date(b.checkIn));
          const checkOut = startOfDay(new Date(b.checkOut));
          const windowEnd = new Date(start);
          windowEnd.setDate(windowEnd.getDate() + visibleDays);
          return checkOut > start && checkIn < windowEnd;
        })
        .map((b) => {
          const checkIn  = startOfDay(new Date(b.checkIn));
          const checkOut = startOfDay(new Date(b.checkOut));
          const startOffsetDays = Math.max(0, differenceInCalendarDays(checkIn, start));
          const endOffsetDays   = Math.min(visibleDays, differenceInCalendarDays(checkOut, start));
          const nights = Math.max(1, endOffsetDays - startOffsetDays);
          const { label, color, bg } = statusStyle(b.status);

          return {
            booking: b,
            lane: laneOf.get(b.bookingId) ?? 0,
            leftPct: startOffsetDays * dayPct,
            widthPct: nights * dayPct,
            label,
            color,
            bg,
          };
        });

      return {
        roomTypeId,
        roomTypeName: first.roomTypeName ?? "Untitled room type",
        propertyName: first.propertyName ?? "",
        laneCount: Math.max(1, lanes.length),
        bars,
      };
    });
  }, [bookings, windowStart, visibleDays, roomTypeFilter, statusFilter]);
}