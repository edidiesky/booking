import { FilterBar, FilterSearchInput } from "@/components/common/filters/FilterBar";
import MultiSelectDropdown from "@/components/dashboard/common/gant/MultiSelectDropdown";
import DateRangeDropdown, { type DateRange } from "@/components/common/filters/DateRangeDropdown";
import type { AuditEventFilters, ActorType, Outcome } from "./types";

interface Props {
  filters: AuditEventFilters;
  onChange: (filters: AuditEventFilters) => void;
}

const ACTOR_TYPE_OPTIONS = [
  { value: "user", label: "User" },
  { value: "api_key", label: "API key" },
  { value: "system", label: "System" },
  { value: "impersonation", label: "Impersonation" },
];

const OUTCOME_OPTIONS = [
  { value: "allowed", label: "Allowed" },
  { value: "denied", label: "Denied" },
];

export default function AuditLogFilters({ filters, onChange }: Props) {
  function set<K extends keyof AuditEventFilters>(key: K, value: AuditEventFilters[K]) {
    onChange({ ...filters, [key]: value || undefined, page: 1 });
  }

  const outcomeSet = new Set(filters.outcome ? [filters.outcome] : []);
  const actorTypeSet = new Set(filters.actorType ? [filters.actorType] : []);

  const dateRange: DateRange = {
    start: filters.occurredAfter ? new Date(filters.occurredAfter) : null,
    end: filters.occurredBefore ? new Date(filters.occurredBefore) : null,
  };

  const hasActiveFilters = Object.entries(filters).some(
    ([k, v]) => k !== "page" && k !== "limit" && v !== undefined && v !== "",
  );

  return (
    <FilterBar>
      <FilterSearchInput value={filters.actor ?? ""} onChange={(v) => set("actor", v)} placeholder="Actor (email or id)" />
      <FilterSearchInput value={filters.action ?? ""} onChange={(v) => set("action", v)} placeholder="Action (e.g. member.role_updated or member.*)" />
      <MultiSelectDropdown
        label="Outcome"
        options={OUTCOME_OPTIONS}
        selected={outcomeSet}
        onToggle={(v) => set("outcome", (outcomeSet.has(v) ? undefined : v) as Outcome | undefined)}
      />
      <MultiSelectDropdown
        label="Actor type"
        options={ACTOR_TYPE_OPTIONS}
        selected={actorTypeSet}
        onToggle={(v) => set("actorType", (actorTypeSet.has(v) ? undefined : v) as ActorType | undefined)}
      />
      <FilterSearchInput value={filters.affectedUser ?? ""} onChange={(v) => set("affectedUser", v)} placeholder="Affected user" />
      <FilterSearchInput value={filters.targetType ?? ""} onChange={(v) => set("targetType", v)} placeholder="Target type" />
      <FilterSearchInput value={filters.targetId ?? ""} onChange={(v) => set("targetId", v)} placeholder="Target id" />
      <FilterSearchInput value={filters.changedField ?? ""} onChange={(v) => set("changedField", v)} placeholder="Changed field" />
      <FilterSearchInput value={filters.requestId ?? ""} onChange={(v) => set("requestId", v)} placeholder="Request id" />
      <DateRangeDropdown
        value={dateRange}
        onApply={(range) =>
          onChange({ ...filters, occurredAfter: range.start?.toISOString(), occurredBefore: range.end?.toISOString(), page: 1 })
        }
        placeholder="Occurred date range"
      />
      {hasActiveFilters && (
        <button onClick={() => onChange({ page: 1, limit: filters.limit })} className="text-xs lg:text-[13px] underline" style={{ color: "#777b86" }}>
          Reset
        </button>
      )}
    </FilterBar>
  );
}