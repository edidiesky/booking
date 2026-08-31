import { useState } from "react";
import { motion } from "framer-motion";
import { useListAuditEventsQuery } from "@/redux/services/auditEventApi";
import AuditLogTable from "./AuditLogTable";
import AuditLogDetailModal from "./AuditLogDetailModal";
import AuditLogFilters from "./AuditLogFilters";
import type { AuditEvent, AuditEventFilters } from "./types";

export default function DashboardAudit() {
  const [filters, setFilters] = useState<AuditEventFilters>({ page: 1, limit: 50 });
  const [selected, setSelected] = useState<AuditEvent | null>(null);
  const { data: events = [], isLoading } = useListAuditEventsQuery(filters);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full p-6 lg:p-10 flex flex-col gap-6"
    >
      <div>
        <h1 className="text-lg font-semibold">Audit log</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Every action taken on this tenant, who did it, what changed, and whether it was allowed.
        </p>
      </div>

      <AuditLogFilters filters={filters} onChange={setFilters} />

      <div className="border rounded-lg overflow-hidden">
        <AuditLogTable events={events} isLoading={isLoading} onSelect={setSelected} />
      </div>

      <AuditLogDetailModal event={selected} onClose={() => setSelected(null)} />
    </motion.div>
  );
}