import { useState } from "react";
import { useListAdminPropertiesQuery } from "@/redux/services/adminApi";

export default function AdminTenantPropertiesTab({ tenantId }: { tenantId: string }) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useListAdminPropertiesQuery({ page, limit: 20, tenantId });
  const properties = data?.data.properties ?? [];
  const totalPages = data?.data.totalPages ?? 1;

  return (
    <div className="flex flex-col gap-4">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b text-left" style={{ borderColor: "#e8e6e3", color: "#a3a6af" }}>
            <th className="py-2 font-normal">Name</th>
            <th className="py-2 font-normal">Type</th>
            <th className="py-2 font-normal">Status</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={3} className="py-4 text-center" style={{ color: "#a3a6af" }}>Loading...</td></tr>
          ) : properties.length === 0 ? (
            <tr><td colSpan={3} className="py-4 text-center" style={{ color: "#a3a6af" }}>No properties yet.</td></tr>
          ) : (
            properties.map((p) => (
              <tr key={p.id} className="border-b" style={{ borderColor: "#f2f0ed" }}>
                <td className="py-2">{p.name}</td>
                <td className="py-2 capitalize">{p.propertyType}</td>
                <td className="py-2 capitalize">{p.status}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div className="flex items-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="text-xs disabled:opacity-40">Previous</button>
          <span className="text-xs" style={{ color: "#a3a6af" }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="text-xs disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}