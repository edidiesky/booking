import type { BookingStatus, PaymentStatus, EscrowStatus, NotificationType } from "./api";

// ── Navigation ────────────────────────────────────────────────────────────────

export interface NavItem {
  icon:  React.ComponentType<{ size?: number; className?: string }>;
  text:  string;
  path:  string;
  tour:  string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

// ── Onboarding step checklist ─────────────────────────────────────────────────

export type StepStatus = "done" | "active" | "pending";

export interface StepItem {
  label:  string;
  status: StepStatus;
}

// ── Dashboard stat block ──────────────────────────────────────────────────────

export interface StatBlock {
  id:            string;
  label:         string;
  value:         string;
  sub:           string;
  progress:      number;
  delta:         string;
  deltaPositive: boolean;
  deltaNote:     string;
}

// ── Table ─────────────────────────────────────────────────────────────────────

export interface TableHeader {
  key:       string;
  label:     string;
  sortable?: boolean;
  width?:    string;
}

// ── Modal registry ────────────────────────────────────────────────────────────

export type ModalName =
  | "createProperty"
  | "createRoomType"
  | "seedCalendar"
  | "blockDates"
  | "cancelBooking"
  | "assignRole"
  | "grantPermission"
  | "confirmAction";

export interface ModalState {
  open:    boolean;
  payload: Record<string, unknown>;
}

// ── Status display maps ───────────────────────────────────────────────────────

export interface StatusDisplay {
  label: string;
  color: string;       // CSS variable or Tailwind class
  bg:    string;
}

export type BookingStatusMap  = Record<BookingStatus,  StatusDisplay>;
export type PaymentStatusMap  = Record<PaymentStatus,  StatusDisplay>;
export type EscrowStatusMap   = Record<EscrowStatus,   StatusDisplay>;

// ── Chart ─────────────────────────────────────────────────────────────────────

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface ChartSeries {
  key:   string;
  label: string;
  color: string;
}

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PaginationState {
  page:  number;
  limit: number;
}

// ── Availability display ──────────────────────────────────────────────────────

export interface CalendarDay {
  date:          string;
  available:     number;
  isBlocked:     boolean;
  isSelected:    boolean;
  isInRange:     boolean;
  isCheckIn:     boolean;
  isCheckOut:    boolean;
}

// ── Toast variants ────────────────────────────────────────────────────────────

export type ToastVariant = "success" | "error" | "info" | "warning";

// ── SSE event ─────────────────────────────────────────────────────────────────

export interface SseEvent<T = Record<string, unknown>> {
  type:    string;
  payload: T;
}

export interface BookingConfirmedSsePayload {
  bookingId:    string;
  bookingRef:   string;
  transactionId: string;
}

export interface BookingCancelledSsePayload {
  bookingId:    string;
  bookingRef:   string;
  refundAmount: number;
}