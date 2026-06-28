import type { BookingStatus, PaymentStatus, EscrowStatus, NotificationStatus } from "@/types/api";

type AnyStatus = BookingStatus | PaymentStatus | EscrowStatus | NotificationStatus;

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  // BookingStatus
  pending_payment: { label: "Pending Payment", color: "#92400e", bg: "#fef3c7" },
  confirmed:       { label: "Confirmed",        color: "#166534", bg: "#dcfce7" },
  checked_in:      { label: "Checked In",       color: "#1e40af", bg: "#dbeafe" },
  checked_out:     { label: "Checked Out",      color: "#374151", bg: "#f3f4f6" },
  cancelled:       { label: "Cancelled",        color: "#991b1b", bg: "#fee2e2" },
  refunded:        { label: "Refunded",         color: "#5b21b6", bg: "#ede9fe" },

  // PaymentStatus
  pending:         { label: "Pending",          color: "#92400e", bg: "#fef3c7" },
  success:         { label: "Success",          color: "#166534", bg: "#dcfce7" },
  failed:          { label: "Failed",           color: "#991b1b", bg: "#fee2e2" },

  // EscrowStatus
  held:                { label: "Held",               color: "#1e40af", bg: "#dbeafe" },
  released:            { label: "Released",           color: "#166534", bg: "#dcfce7" },
  partially_refunded:  { label: "Part. Refunded",     color: "#5b21b6", bg: "#ede9fe" },

  // NotificationStatus
  sent:            { label: "Sent",             color: "#166534", bg: "#dcfce7" },
  skipped:         { label: "Skipped",          color: "#374151", bg: "#f3f4f6" },
};

interface Props {
  status: AnyStatus;
  size?:  "sm" | "md";
}

export default function StatusBadge({ status, size = "sm" }: Props) {
  const config = STATUS_MAP[status] ?? {
    label: status,
    color: "#374151",
    bg:    "#f3f4f6",
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full whitespace-nowrap ${
        size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1"
      }`}
      style={{ color: config.color, backgroundColor: config.bg }}
    >
      {config.label}
    </span>
  );
}