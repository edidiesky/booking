import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, LogIn, LogOut, RefreshCcw, FileDown, CreditCard } from "lucide-react";
import Title from "@/components/dashboard/common/Title";
import { formatDate } from "@/utils/formatDate";
import { useListTenantActivityQuery } from "@/redux/services/auditApi";
import type { AuditLogEntry } from "@/redux/services/auditApi";
import { FilterBar, FilterSearchInput } from "@/components/common/filters/FilterBar";
import DateRangeDropdown, { type DateRange } from "@/components/common/filters/DateRangeDropdown";
import MultiSelectDropdown from "@/components/dashboard/common/gant/MultiSelectDropdown";

const ACTION_CONFIG: Record<string, { icon: typeof Plus; color: string; bg: string; label: string }> = {
  created:        { icon: Plus,        color: "#166534", bg: "#dcfce7", label: "Created" },
  updated:        { icon: Pencil,      color: "#1e40af", bg: "#dbeafe", label: "Updated" },
  deleted:        { icon: Trash2,      color: "#991b1b", bg: "#fee2e2", label: "Deleted" },
  status_changed: { icon: RefreshCcw,  color: "#92400e", bg: "#fef3c7", label: "Status changed" },
  payment:        { icon: CreditCard,  color: "#166534", bg: "#dcfce7", label: "Payment" },
  login:          { icon: LogIn,       color: "#4c4c4c", bg: "#f2f0ed", label: "Signed in" },
  logout:         { icon: LogOut,      color: "#4c4c4c", bg: "#f2f0ed", label: "Signed out" },
  exported:       { icon: FileDown,    color: "#5b21b6", bg: "#ede9fe", label: "Exported" },
};

const ACTION_OPTIONS = Object.entries(ACTION_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label }));

function actorName(entry: AuditLogEntry): string {
  const name = [entry.actor_first_name, entry.actor_last_name].filter(Boolean).join(" ");
  return name || "System";
}

function resourceLabel(resource: string): string {
  return resource.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function DashboardActivity() {
  const [search, setSearch] = useState("");
  const [selectedActions, setSelectedActions] = useState<Set<string> | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null });

  const { data, isLoading } = useListTenantActivityQuery({
    page: 1,
    search: search || undefined,
    actions: selectedActions ? Array.from(selectedActions) : undefined,
    dateFrom: dateRange.start?.toISOString(),
    dateTo: dateRange.end?.toISOString(),
  });
  const entries = data?.data ?? [];

  const toggleAction = (value: string) => {
    setSelectedActions((prev) => {
      const next = new Set(prev ?? ACTION_OPTIONS.map((o) => o.value));
      if (next.has(value)) next.delete(value); else next.add(value);
      return next;
    });
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedActions(null);
    setDateRange({ start: null, end: null });
  };

  const hasActiveFilters = Boolean(search) || selectedActions !== null || dateRange.start !== null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full p-6 lg:p-10 flex flex-col gap-6"
    >
      <Title
        title="Activity"
        description="Every significant action taken across your account and team, who did what and when."
      />

      <FilterBar>
        <FilterSearchInput value={search} onChange={setSearch} placeholder="Search resource or team member..." />
        <MultiSelectDropdown
          label="Action"
          options={ACTION_OPTIONS}
          selected={selectedActions ?? new Set(ACTION_OPTIONS.map((o) => o.value))}
          onToggle={toggleAction}
        />
        <DateRangeDropdown value={dateRange} onApply={setDateRange} placeholder="Date range" />
        {hasActiveFilters && (
          <button onClick={resetFilters} className="text-xs lg:text-sm underline" style={{ color: "#777b86" }}>
            Reset
          </button>
        )}
      </FilterBar>

      <div className="border rounded-xl overflow-hidden" style={{ borderColor: "#e8e6e3" }}>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b" style={{ borderColor: "#e8e6e3", backgroundColor: "#fafaf9" }}>
              <th className="text-left px-4 py-3 text-xs lg:text-sm" style={{ color: "#777b86" }}>id</th>
              <th className="text-left px-4 py-3 text-xs lg:text-sm" style={{ color: "#777b86" }}>Resource</th>
              <th className="text-left px-4 py-3 text-xs lg:text-sm" style={{ color: "#777b86" }}>By</th>
              <th className="text-left px-4 py-3 text-xs lg:text-sm" style={{ color: "#777b86" }}>Action</th>
              <th className="text-left px-4 py-3 text-xs lg:text-sm" style={{ color: "#777b86" }}>IP address</th>
              <th className="text-left px-4 py-3 text-xs lg:text-sm" style={{ color: "#777b86" }}>When</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b" style={{ borderColor: "#f2f0ed" }}>
                  <td colSpan={5} className="px-4 py-4">
                    <div className="h-4 rounded animate-pulse" style={{ backgroundColor: "#f2f0ed" }} />
                  </td>
                </tr>
              ))
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-xs" style={{ color: "#a3a6af" }}>
                  {hasActiveFilters ? "No activity matches the current filters." : "No activity recorded yet."}
                </td>
              </tr>
            ) : (
              entries.map((entry) => {
                const cfg = ACTION_CONFIG[entry.action] ?? { icon: Pencil, color: "#4c4c4c", bg: "#f2f0ed", label: entry.action };
                const Icon = cfg.icon;
                return (
                  <tr key={entry.id} className="border-b last:border-0 hover:bg-[#fafaf9] transition-colors" style={{ borderColor: "#f2f0ed" }}>
                    <td className="px-4 py-3 text-xs" style={{ color: "#17191c" }}>{(entry.id)}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#17191c" }}>{resourceLabel(entry.resource)}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#17191c" }}>{actorName(entry)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs lg:text-sm px-2 py-1 rounded-full" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                        <Icon size={11} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#a3a6af" }}>{entry.ip_address ?? "—"}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#a3a6af" }}>{formatDate(entry.created_at)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}