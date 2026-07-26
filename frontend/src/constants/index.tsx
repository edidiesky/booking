import { STATUS_MAP } from "@/components/common/StatusBadge";
import type { BookingStatus } from "@/types/api";

export type GanttView = "day" | "week" | "month";

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
 