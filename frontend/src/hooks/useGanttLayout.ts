// import { useMemo } from "react";
// import type { Booking } from "@/types/api";
// import { statusStyle } from "../constants";

// export interface ContinuousBar {
//   booking:  Booking;
//   offset:   number; // units (hours or days) from windowStart
//   end:      number;
//   lane:     number;
//   bg:       string;
//   color:    string;
//   label:    string;
// }

// export interface RoomTypeRow {
//   roomTypeId:   string;
//   roomTypeName: string;
//   roomImage:    string | null;
//   quantity?:    number;
//   bars:         ContinuousBar[];
//   laneCount:    number;
// }

// interface Params {
//   bookings:       Booking[];
//   windowStart:    Date;
//   totalUnits:     number;         // total hours or days currently loaded
//   granularity:    "hour" | "day";
//   propertyId?:    string;         // optional now, omit to show every property together
//   roomTypeFilter: Set<string> | null;
//   statusFilter:   Set<string> | null;
// }

// // Greedy interval partitioning on a CONTINUOUS axis (ADR:
// // gantt-continuous-axis), a booking only gets a new lane when it
// // genuinely overlaps another, on real offset/end values, not on
// // whichever calendar-day box it happens to be drawn inside. This is
// // what makes a booking crossing midnight render as one unbroken bar,
// // the previous day-bucketed version had no way to represent that
// // correctly.
// function layoutLanes(bars: Omit<ContinuousBar, "lane">[]): { placed: ContinuousBar[]; laneCount: number } {
//   const sorted = [...bars].sort((a, b) => a.offset - b.offset);
//   const laneEnds: number[] = [];
//   const placed = sorted.map((bar) => {
//     let lane = laneEnds.findIndex((end) => end <= bar.offset);
//     if (lane === -1) {
//       lane = laneEnds.length;
//       laneEnds.push(bar.end);
//     } else {
//       laneEnds[lane] = bar.end;
//     }
//     return { ...bar, lane };
//   });
//   return { placed, laneCount: Math.max(laneEnds.length, 1) };
// }

// export function useGanttLayout({ bookings, windowStart, totalUnits, granularity, propertyId, roomTypeFilter, statusFilter }: Params): RoomTypeRow[] {
//   return useMemo(() => {
//     const isHour = granularity === "hour";
//     const msPerUnit = isHour ? 3_600_000 : 86_400_000;
//     const windowStartMs = windowStart.getTime();

//     const byRoomType = new Map<string, Booking[]>();
//     for (const b of bookings) {
//       if (propertyId && b.propertyId !== propertyId) continue;
//       if (roomTypeFilter && !roomTypeFilter.has(b.roomTypeId)) continue;
//       if (statusFilter && !statusFilter.has(b.status)) continue;
//       if (!byRoomType.has(b.roomTypeId)) byRoomType.set(b.roomTypeId, []);
//       byRoomType.get(b.roomTypeId)!.push(b);
//     }

//     const rows: RoomTypeRow[] = [];
//     for (const [roomTypeId, roomBookings] of byRoomType) {
//       const bars = roomBookings
//         .map((b) => {
//           const checkInMs  = new Date(b.checkIn).getTime();
//           const checkOutMs = new Date(b.checkOut).getTime();
//           const bufferedEndMs = checkOutMs + 3 * 3_600_000;
//           const offset = (checkInMs - windowStartMs) / msPerUnit;
//           const end    = (bufferedEndMs - windowStartMs) / msPerUnit;
//           const style = statusStyle(b.status);
//           return {
//             booking: b, offset, end,
//             bg: style.bg, color: style.color,
//             label: `${b.checkIn} – ${b.checkOut}`,
//           };
//         })
//         .filter((bar) => bar.end > 0 && bar.offset < totalUnits);

//       const { placed, laneCount } = layoutLanes(bars);
//       const first = roomBookings[0];

//       rows.push({
//         roomTypeId,
//         roomTypeName: first.roomTypeName ?? "Untitled room type",
//         roomImage:    first.roomTypeImage ?? first.room_type_images?.[0] ?? null,
//         quantity:     first.roomTypeQuantity,
//         bars: placed,
//         laneCount,
//       });
//     }

//     return rows;
//   }, [bookings, windowStart, totalUnits, granularity, propertyId, roomTypeFilter, statusFilter]);
// }

import { useMemo } from "react";
import type { Booking } from "@/types/api";
import { statusStyle } from "../constants";

export interface ContinuousBar {
  booking:  Booking;
  offset:   number; // units (hours or days) from windowStart
  end:      number;
  lane:     number;
  bg:       string;
  color:    string;
  label:    string;
}

export interface RoomTypeRow {
  roomTypeId:   string;
  roomTypeName: string;
  roomImage:    string | null;
  quantity?:    number;
  bars:         ContinuousBar[];
  laneCount:    number;
}

interface Params {
  bookings:       Booking[];
  windowStart:    Date;
  totalUnits:     number;         // total hours or days currently loaded
  granularity:    "hour" | "day";
  propertyId?:    string;         // optional now, omit to show every property together
  roomTypeFilter: Set<string> | null;
  statusFilter:   Set<string> | null;
}


function layoutLanes(bars: Omit<ContinuousBar, "lane">[]): { placed: ContinuousBar[]; laneCount: number } {
  const sorted = [...bars].sort((a, b) => a.offset - b.offset);
  const laneEnds: number[] = [];
  const placed = sorted.map((bar) => {
    let lane = laneEnds.findIndex((end) => end <= bar.offset);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(bar.end);
    } else {
      laneEnds[lane] = bar.end;
    }
    return { ...bar, lane };
  });
  return { placed, laneCount: Math.max(laneEnds.length, 1) };
}

export function useGanttLayout({ bookings, windowStart, totalUnits, granularity, propertyId, roomTypeFilter, statusFilter }: Params): RoomTypeRow[] {
  return useMemo(() => {
    const isHour = granularity === "hour";
    const msPerUnit = isHour ? 3_600_000 : 86_400_000;
    const windowStartMs = windowStart.getTime();

    const byRoomType = new Map<string, Booking[]>();
    for (const b of bookings) {
      if (propertyId && b.propertyId !== propertyId) continue;
      if (roomTypeFilter && !roomTypeFilter.has(b.roomTypeId)) continue;
      if (statusFilter && !statusFilter.has(b.status)) continue;
      if (!byRoomType.has(b.roomTypeId)) byRoomType.set(b.roomTypeId, []);
      byRoomType.get(b.roomTypeId)!.push(b);
    }

    const rows: RoomTypeRow[] = [];
    for (const [roomTypeId, roomBookings] of byRoomType) {
      const bars = roomBookings
        .map((b) => {
          const checkInMs  = new Date(b.checkIn).getTime();
          const checkOutMs = new Date(b.checkOut).getTime();
          const offset = (checkInMs - windowStartMs) / msPerUnit;
          const end    = (checkOutMs - windowStartMs) / msPerUnit;
          const style = statusStyle(b.status);
          return {
            booking: b, offset, end,
            bg: style.bg, color: style.color,
            label: `${b.checkIn} – ${b.checkOut}`,
          };
        })
        .filter((bar) => bar.end > 0 && bar.offset < totalUnits);

      const { placed, laneCount } = layoutLanes(bars);
      const first = roomBookings[0];

      rows.push({
        roomTypeId,
        roomTypeName: first.roomTypeName ?? "Untitled room type",
        roomImage:    first.roomTypeImage ?? first.room_type_images?.[0] ?? null,
        quantity:     first.roomTypeQuantity,
        bars: placed,
        laneCount,
      });
    }

    return rows;
  }, [bookings, windowStart, totalUnits, granularity, propertyId, roomTypeFilter, statusFilter]);
}