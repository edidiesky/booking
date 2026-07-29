export const VIEW_DAYS: Record<GanttView, number> = {
  day: 3,
  week: 7,
  month: 30,
};

 
export const ROW_HEIGHT_PX = 50;
export const LANE_GAP_PX = 4;
export const LABEL_COLUMN_PX = 180;
 
export function statusStyle(status: BookingStatus): { label: string; color: string; bg: string } {
  const style = STATUS_MAP[status] ?? { label: status, color: "#374151", bg: "#f3f4f6" };
  return { label: style.label, color: style.color, bg: style.bg };
}
import { STATUS_MAP } from "@/components/common/StatusBadge";
import type { BookingStatus } from "@/types/api";

export type GanttView = "day" | "week" | "month";

// Day is now genuinely hour-granular (ADR: gantt-continuous-axis), not
// just a narrower window of the same day-boxes, week/month stay
// day-granular but at different column widths. chunkSizeDays/capDays
// drive the incremental lateral-loading behavior (ADR:
// gantt-scroll-and-sort), not a fixed page.
export const VIEW_CONFIG: Record<GanttView, {
  granularity: "hour" | "day";
  dayColWidth: number;
  chunkSizeDays: number;
  capDays: number;
  capLabel: string;
}> = {
  day:   { granularity: "hour", dayColWidth: 720, chunkSizeDays: 5,  capDays: 30,  capLabel: "one month of days" },
  week:  { granularity: "day",  dayColWidth: 130, chunkSizeDays: 7,  capDays: 35,  capLabel: "one month of weeks" },
  month: { granularity: "day",  dayColWidth: 30,  chunkSizeDays: 35, capDays: 366, capLabel: "one year" },
};

export const HOURS = Array.from({ length: 24 }, (_, i) => i);
export const LANE_HEIGHT = 40;
export const MIN_ROOM_ROW_HEIGHT = 40;
export const ROOM_COL_WIDTH = 206;
export const DEFAULT_MAX_VISIBLE_ROOMS = 8;



export const MAX_CSV_BYTES = 20 * 1024 * 1024;
export const MAX_ROWS      = 5_000;

export const ROOM_TYPE_CSV_TEMPLATE = [
  "name", "description", "max_occupancy", "base_price_ngn", "quantity", "amenities", "images",
] as const;