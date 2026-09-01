import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListAuditEventsQuery } from "@/redux/services/auditEventApi";
import AuditLogTable from "./AuditLogTable";
import AuditLogDetailModal from "./AuditLogDetailModal";
import AuditLogFilters from "./AuditLogFilters";
import type { AuditEvent, AuditEventFilters } from "./types";
import Title from "@/components/dashboard/common/Title";

export default function DashboardAudit() {
  const [filters, setFilters] = useState<AuditEventFilters>({
    page: 1,
    limit: 50,
  });
  const [selected, setSelected] = useState<AuditEvent | null>(null);
  const { data: events = [], isLoading } = useListAuditEventsQuery(filters);

  return (
    <>
      <AnimatePresence>
        {selected && (
          <AuditLogDetailModal
            event={selected}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full p-4 py-8 lg:p-12 flex flex-col gap-8"
      >
        <Title
          title={`Audit log`}
          description="Every action taken on this tenant, who did it, what changed, and whether it was allowed."
        />

        <AuditLogFilters filters={filters} onChange={setFilters} />

        <AuditLogTable
          events={events}
          isLoading={isLoading}
          search={filters.action ?? ""}
          onSelect={setSelected}
        />
      </motion.div>
    </>
  );
}
