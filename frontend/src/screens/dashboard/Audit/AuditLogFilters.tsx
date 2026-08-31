import { useState } from "react";
import type { AuditEventFilters, ActorType, Outcome } from "./types";

interface Props {
  filters: AuditEventFilters;
  onChange: (filters: AuditEventFilters) => void;
}

const ACTOR_TYPES: ActorType[] = ["user", "api_key", "system", "impersonation"];
const OUTCOMES: Outcome[] = ["allowed", "denied"];

export default function AuditLogFilters({ filters, onChange }: Props) {
  const [expanded, setExpanded] = useState(false);

  function set<K extends keyof AuditEventFilters>(key: K, value: AuditEventFilters[K]) {
    onChange({ ...filters, [key]: value || undefined, page: 1 });
  }

  const activeCount = Object.entries(filters).filter(
    ([k, v]) => k !== "page" && k !== "limit" && v !== undefined && v !== "",
  ).length;

  return (
    <div className="border rounded-lg p-4 flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <input
          placeholder="Actor (email or id)"
          className="border rounded px-3 py-2 text-xs flex-1 min-w-[160px]"
          value={filters.actor ?? ""}
          onChange={(e) => set("actor", e.target.value)}
        />
        <input
          placeholder="Action (e.g. member.role_updated or member.*)"
          className="border rounded px-3 py-2 text-xs flex-1 min-w-[220px]"
          value={filters.action ?? ""}
          onChange={(e) => set("action", e.target.value)}
        />
        <select
          className="border rounded px-3 py-2 text-xs"
          value={filters.outcome ?? ""}
          onChange={(e) => set("outcome", (e.target.value || undefined) as Outcome | undefined)}
        >
          <option value="">Any outcome</option>
          {OUTCOMES.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-muted-foreground underline underline-offset-2"
        >
          {expanded ? "Fewer filters" : `More filters${activeCount > 0 ? ` (${activeCount} active)` : ""}`}
        </button>
      </div>

      {expanded && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <select
            className="border rounded px-3 py-2 text-xs"
            value={filters.actorType ?? ""}
            onChange={(e) => set("actorType", (e.target.value || undefined) as ActorType | undefined)}
          >
            <option value="">Any actor type</option>
            {ACTOR_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            placeholder="Affected user (email or id)"
            className="border rounded px-3 py-2 text-xs flex-1 min-w-[160px]"
            value={filters.affectedUser ?? ""}
            onChange={(e) => set("affectedUser", e.target.value)}
          />
          <input
            placeholder="Target type (e.g. booking, tenant, role)"
            className="border rounded px-3 py-2 text-xs flex-1 min-w-[160px]"
            value={filters.targetType ?? ""}
            onChange={(e) => set("targetType", e.target.value)}
          />
          <input
            placeholder="Target id"
            className="border rounded px-3 py-2 text-xs flex-1 min-w-[160px]"
            value={filters.targetId ?? ""}
            onChange={(e) => set("targetId", e.target.value)}
          />
          <input
            placeholder="Changed field (e.g. role)"
            className="border rounded px-3 py-2 text-xs flex-1 min-w-[140px]"
            value={filters.changedField ?? ""}
            onChange={(e) => set("changedField", e.target.value)}
          />
          <input
            placeholder="Request id, groups one gesture"
            className="border rounded px-3 py-2 text-xs flex-1 min-w-[160px]"
            value={filters.requestId ?? ""}
            onChange={(e) => set("requestId", e.target.value)}
          />
          <input
            type="date"
            className="border rounded px-3 py-2 text-xs"
            value={filters.occurredAfter?.slice(0, 10) ?? ""}
            onChange={(e) => set("occurredAfter", e.target.value ? new Date(e.target.value).toISOString() : undefined)}
          />
          <span className="text-xs text-muted-foreground self-center">to</span>
          <input
            type="date"
            className="border rounded px-3 py-2 text-xs"
            value={filters.occurredBefore?.slice(0, 10) ?? ""}
            onChange={(e) => set("occurredBefore", e.target.value ? new Date(e.target.value).toISOString() : undefined)}
          />
        </div>
      )}

      {activeCount > 0 && (
        <button
          type="button"
          onClick={() => onChange({ page: 1, limit: filters.limit })}
          className="text-xs text-red-600 self-start"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}