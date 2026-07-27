import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, LogIn, LogOut, RefreshCcw, FileDown, CreditCard } from "lucide-react";
import Title from "@/components/dashboard/common/Title";
import { formatDate } from "@/utils/formatDate";
import { useListTenantActivityQuery } from "@/redux/services/auditApi";
import type { AuditLogEntry } from "@/redux/services/auditApi";

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

function actorName(entry: AuditLogEntry): string {
  const name = [entry.actor_first_name, entry.actor_last_name].filter(Boolean).join(" ");
  return name || "System";
}

function resourceLabel(resource: string): string {
  return resource.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function DashboardActivity() {
  const { data, isLoading } = useListTenantActivityQuery({ page: 1 });
  const entries = data?.data ?? [];

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

      <div className="border rounded-xl overflow-hidden" style={{ borderColor: "#e8e6e3" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: "#e8e6e3", backgroundColor: "#fafaf9" }}>
              <th className="text-left px-4 py-3 text-xs bold" style={{ color: "#777b86" }}>Action</th>
              <th className="text-left px-4 py-3 text-xs bold" style={{ color: "#777b86" }}>Resource</th>
              <th className="text-left px-4 py-3 text-xs bold" style={{ color: "#777b86" }}>By</th>
              <th className="text-left px-4 py-3 text-xs bold" style={{ color: "#777b86" }}>IP address</th>
              <th className="text-left px-4 py-3 text-xs bold" style={{ color: "#777b86" }}>When</th>
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
                  No activity recorded yet.
                </td>
              </tr>
            ) : (
              entries.map((entry) => {
                const cfg = ACTION_CONFIG[entry.action] ?? { icon: Pencil, color: "#4c4c4c", bg: "#f2f0ed", label: entry.action };
                const Icon = cfg.icon;
                return (
                  <tr key={entry.id} className="border-b last:border-0 hover:bg-[#fafaf9] transition-colors" style={{ borderColor: "#f2f0ed" }}>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs bold px-2 py-1 rounded-full" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                        <Icon size={11} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#17191c" }}>{resourceLabel(entry.resource)}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#17191c" }}>{actorName(entry)}</td>
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