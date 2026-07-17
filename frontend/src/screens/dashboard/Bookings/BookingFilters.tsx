import type { BookingStatus } from "@/types/api";

const STATUSES: { label: string; value: BookingStatus | "" }[] = [
  { label: "All",             value: ""                },
  { label: "Pending Payment", value: "pending_payment" },
  { label: "Confirmed",       value: "confirmed"       },
  { label: "Checked In",      value: "checked_in"      },
  { label: "Checked Out",     value: "checked_out"     },
  { label: "Cancelled",       value: "cancelled"       },
];

interface Props {
  search:         string;
  onSearch:       (v: string) => void;
  statusFilter:   BookingStatus | "";
  onStatusFilter: (v: BookingStatus | "") => void;
}

export default function BookingFilters({ search, onSearch, statusFilter, onStatusFilter }: Props) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <input
        type="text"
        placeholder="Search by reference..."
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        className="h-9 px-3 text-xs border outline-none w-48"
        style={{ borderColor: "#e8e6e3", color: "var(--color-ink)" }}
      />
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map(({ label, value }) => (
          <button
            key={label}
            onClick={() => onStatusFilter(value)}
            className="px-3 py-1.5 text-xs rounded-full border transition-colors"
            style={{
              backgroundColor: statusFilter === value ? "var(--color-ink)"   : "transparent",
              color:           statusFilter === value ? "var(--color-canvas)" : "var(--color-muted-stone)",
              borderColor:     statusFilter === value ? "var(--color-ink)"   : "#e8e6e3",
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}