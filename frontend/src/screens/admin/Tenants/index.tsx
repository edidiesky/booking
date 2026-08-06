import { useState } from "react";
import { useListTenantsQuery, useSuspendTenantMutation, useActivateTenantMutation } from "@/redux/services/tenantApi";
import { showToast } from "@/components/common/Toast";
import TenantDetailModal from "./TenantDetailModal";
import type { Tenant } from "@/types/api";

const STATUS_CFG: Record<Tenant["status"], { label: string; className: string }> = {
  draft:     { label: "Draft",     className: "bg-[#f2f0ed] text-[#4c4c4c]" },
  active:    { label: "Active",    className: "bg-green-50 text-green-700" },
  suspended: { label: "Suspended", className: "bg-red-50 text-red-700" },
};

export default function AdminTenants() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useListTenantsQuery({ page, limit: 20 });
  const [suspend] = useSuspendTenantMutation();
  const [activate] = useActivateTenantMutation();
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  const handleToggleStatus = async (tenant: Tenant) => {
    try {
      if (tenant.status === "suspended") {
        await activate(tenant.id).unwrap();
        showToast(`${tenant.name} reactivated.`, "success");
      } else {
        await suspend(tenant.id).unwrap();
        showToast(`${tenant.name} suspended.`, "success");
      }
    } catch {
      /* errorMiddleware */
    }
  };

  return (
    <div>
      <h1 className="text-2xl bold mb-6" style={{ color: "var(--color-ink)" }}>Sellers / Tenants</h1>

      {isLoading ? (
        <p className="text-xs" style={{ color: "var(--color-muted-stone)" }}>Loading...</p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b text-left" style={{ borderColor: "#e8e6e3", color: "var(--color-hint-of-grey)" }}>
              <th className="py-3 font-normal">Name</th>
              <th className="py-3 font-normal">Slug</th>
              <th className="py-3 font-normal">Status</th>
              <th className="py-3 font-normal">Platform fee</th>
              <th className="py-3 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map((tenant) => (
              <tr key={tenant.id} className="border-b" style={{ borderColor: "#f2f0ed" }}>
                <td className="py-3">
                  <button onClick={() => setSelectedTenantId(tenant.id)} className="hover:underline" style={{ color: "var(--color-ink)" }}>
                    {tenant.name}
                  </button>
                </td>
                <td className="py-3" style={{ color: "var(--color-muted-stone)" }}>{tenant.slug}</td>
                <td className="py-3">
                  <span className={`px-2.5 py-1 rounded-full ${STATUS_CFG[tenant.status].className}`}>
                    {STATUS_CFG[tenant.status].label}
                  </span>
                </td>
                <td className="py-3" style={{ color: "var(--color-muted-stone)" }}>{tenant.platformFeePct}%</td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => handleToggleStatus(tenant)}
                    className="text-xs lg:text-sm underline"
                    style={{ color: tenant.status === "suspended" ? "#00a86b" : "#dc2626" }}
                  >
                    {tenant.status === "suspended" ? "Reactivate" : "Suspend"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="flex items-center gap-3 mt-6">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="text-xs lg:text-smdisabled:opacity-40">Previous</button>
        <span className="text-xs" style={{ color: "var(--color-muted-stone)" }}>Page {page}</span>
        <button onClick={() => setPage((p) => p + 1)} className="text-xs">Next</button>
      </div>

      {selectedTenantId && (
        <TenantDetailModal tenantId={selectedTenantId} onClose={() => setSelectedTenantId(null)} />
      )}
    </div>
  );
}