import { useState } from "react";
import { useGetTenantActivityQuery } from "@/redux/services/adminApi";
import { formatDateTime } from "@/utils/formatDate";

export default function AdminTenantActivityTab({ tenantId }: { tenantId: string }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useGetTenantActivityQuery({ tenantId, page, limit: 20 });
  const logs = data?.data.logs ?? [];

  return (
    <div className="flex flex-col gap-2">
      {isLoading ? (
        <p className="text-xs" style={{ color: "#a3a6af" }}>Loading...</p>
      ) : logs.length === 0 ? (
        <p className="text-xs" style={{ color: "#a3a6af" }}>No activity recorded yet.</p>
      ) : (
        logs.map((log) => (
          <div key={log.id} className="flex items-center justify-between py-2 border-b text-xs" style={{ borderColor: "#f2f0ed" }}>
            <span>
              {[log.actorFirstName, log.actorLastName].filter(Boolean).join(" ") || "System"}{" "}
              <span style={{ color: "#a3a6af" }}>{log.action}</span> {log.resource}
            </span>
            <span style={{ color: "#a3a6af" }}>{formatDateTime(log.createdAt)}</span>
          </div>
        ))
      )}
      <div className="flex items-center gap-3 mt-2">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="text-xs disabled:opacity-40">Previous</button>
        <span className="text-xs" style={{ color: "#a3a6af" }}>Page {page}</span>
        <button onClick={() => setPage((p) => (logs.length < 20 ? p : p + 1))} disabled={isFetching || logs.length < 20} className="text-xs disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}