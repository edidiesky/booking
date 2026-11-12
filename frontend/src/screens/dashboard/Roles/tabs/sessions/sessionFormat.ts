import {
  Monitor,
  Smartphone,
  Tablet,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import type { UserSession } from "@/redux/services/sessionApi";

export const DEVICE_ICONS: Record<UserSession["deviceType"], LucideIcon> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
  unknown: HelpCircle,
};

const RECENT_WINDOW_MS = 5 * 60 * 1000;

export function formatLastActive(iso: string, isCurrent: boolean): string {
  if (isCurrent) return "Active now";
  const diffMs = Date.now() - new Date(iso).getTime();
  if (diffMs < RECENT_WINDOW_MS) return "Just now";
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "Unknown" : dateTimeFormatter.format(date);
}

export function describeClient(session: UserSession): string {
  const parts = [session.browser, session.os].filter(Boolean);
  return parts.length > 0 ? parts.join(" on ") : "Unknown";
}

export function describeLocation(session: UserSession): string {
  const parts = [session.city, session.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Unknown";
}

// _buildTokens falls back to "0.0.0.0" when no IP was captured, and
// Postgres INET can return IPv4-mapped IPv6 addresses.
export function describeIp(ip: string): string {
  if (!ip || ip === "0.0.0.0") return "Unknown";
  return ip.startsWith("::ffff:") ? ip.slice(7) : ip;
}

export function formatDuration(fromIso: string, toMs: number = Date.now()): string {
  const diffMs = toMs - new Date(fromIso).getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return "Unknown";
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Less than a minute";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"}`;
}

export function deviceTypeLabel(type: UserSession["deviceType"]): string {
  switch (type) {
    case "desktop":
      return "Desktop";
    case "mobile":
      return "Mobile";
    case "tablet":
      return "Tablet";
    default:
      return "Unknown";
  }
}