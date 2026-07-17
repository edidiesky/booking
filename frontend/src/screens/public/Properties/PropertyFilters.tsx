import { Search } from "lucide-react";
import type { PropertyType } from "@/types/api";

const TYPES: { label: string; value: PropertyType | "" }[] = [
  { label: "All",        value: ""           },
  { label: "Shortlet",   value: "shortlet"   },
  { label: "Hotel",      value: "hotel"      },
  { label: "Guesthouse", value: "guesthouse" },
];

interface Props {
  search:         string;
  onSearch:       (v: string) => void;
  typeFilter:     PropertyType | "";
  onTypeFilter:   (v: PropertyType | "") => void;
}

export default function PropertyFilters({ search, onSearch, typeFilter, onTypeFilter }: Props) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
      <div className="flex gap-2 flex-wrap">
        {TYPES.map(({ label, value }) => (
          <button
            key={label}
            onClick={() => onTypeFilter(value)}
            className="px-4 py-1.5 text-xs rounded-full border transition-colors"
            style={{
              backgroundColor: typeFilter === value ? "var(--color-ink)"    : "transparent",
              color:           typeFilter === value ? "var(--color-canvas)"  : "var(--color-muted-stone)",
              borderColor:     typeFilter === value ? "var(--color-ink)"    : "#e8e6e3",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        className="flex items-center gap-2 border px-3 h-9 transition-colors min-w-[200px]"
        style={{ borderColor: "#e8e6e3" }}
      >
        <Search size={13} style={{ color: "var(--color-hint-of-grey)" }} className="shrink-0" />
        <input
          type="text"
          placeholder="Search by name or city..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="flex-1 text-xs outline-none bg-transparent"
          style={{ color: "var(--color-ink)" }}
        />
      </div>
    </div>
  );
}