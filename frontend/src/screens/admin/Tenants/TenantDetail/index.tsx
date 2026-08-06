import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useGetAdminTenantDetailQuery } from "@/redux/services/tenantApi";
import TenantInfoPanel from "@/components/common/TenantInfoPanel";
import AdminTenantPropertiesTab from "./AdminTenantPropertiesTab";
import AdminTenantBookingsTab from "./AdminTenantBookingsTab";
import AdminTenantPaymentsTab from "./AdminTenantPaymentsTab";
import AdminTenantActivityTab from "./AdminTenantActivityTab";
import { formatCurrency } from "@/utils/formatCurrency";

const TABS = ["overview", "activity", "properties", "bookings", "payments"] as const;
type Tab = (typeof TABS)[number];

export default function AdminTenantDetail() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState<Tab>("overview");

  const { data, isLoading } = useGetAdminTenantDetailQuery(tenantId!);
  const orderedIds = (location.state as { tenantIds?: string[] } | null)?.tenantIds;
  const currentIndex = orderedIds?.indexOf(tenantId!) ?? -1;
  const prevId = currentIndex > 0 ? orderedIds![currentIndex - 1] : null;
  const nextId = currentIndex >= 0 && currentIndex < (orderedIds?.length ?? 0) - 1 ? orderedIds![currentIndex + 1] : null;

  if (isLoading || !data) {
    return <div className="h-[70vh] rounded-2xl animate-pulse" style={{ backgroundColor: "#f2f0ed" }} />;
  }

  const { tenant, stats, recentPurchases } = data.data;

  return (
    <div className="flex gap-8">
      <aside className="w-[280px] shrink-0 border-r pr-6" style={{ borderColor: "#e8e6e3" }}>
        <button onClick={() => navigate("/admin/tenants")} className="flex items-center gap-1 text-xs mb-6" style={{ color: "#777b86" }}>
          <ArrowLeft size={13} /> Back to Tenants
        </button>
        <TenantInfoPanel tenant={tenant} />
      </aside>

      <div className="flex-1 min-w-0 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl bold" style={{ color: "#17191c" }}>{tenant.name}</h1>
            <p className="text-xs" style={{ color: "#a3a6af" }}>{tenant.slug}</p>
          </div>
          {(prevId || nextId) && (
            <div className="flex items-center gap-2">
              <button
                disabled={!prevId}
                onClick={() => navigate(`/admin/tenants/${prevId}`, { state: { tenantIds: orderedIds } })}
                className="w-8 h-8 rounded-full border flex items-center justify-center disabled:opacity-30"
                style={{ borderColor: "#e8e6e3" }}
              >
                ←
              </button>
              <button
                disabled={!nextId}
                onClick={() => navigate(`/admin/tenants/${nextId}`, { state: { tenantIds: orderedIds } })}
                className="w-8 h-8 rounded-full border flex items-center justify-center disabled:opacity-30"
                style={{ borderColor: "#e8e6e3" }}
              >
                →
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 border-b" style={{ borderColor: "#e8e6e3" }}>
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2.5 text-xs capitalize border-b-2 -mb-px"
              style={{
                borderColor: tab === t ? "#17191c" : "transparent",
                color: tab === t ? "#17191c" : "#a3a6af",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-3 gap-3">
              <div className="border rounded-xl p-3" style={{ borderColor: "#e8e6e3" }}>
                <p className="text-xs" style={{ color: "#a3a6af" }}>Escrow held</p>
                <p className="text-sm bold">{formatCurrency(stats.escrow.held.amountNgn)}</p>
              </div>
              <div className="border rounded-xl p-3" style={{ borderColor: "#e8e6e3" }}>
                <p className="text-xs" style={{ color: "#a3a6af" }}>Released</p>
                <p className="text-sm bold">{formatCurrency(stats.escrow.released.amountNgn)}</p>
              </div>
              <div className="border rounded-xl p-3" style={{ borderColor: "#e8e6e3" }}>
                <p className="text-xs" style={{ color: "#a3a6af" }}>Properties</p>
                <p className="text-sm bold">{stats.properties.count}</p>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase mb-3" style={{ color: "#a3a6af" }}>Recent purchases</p>
              {recentPurchases.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b text-xs" style={{ borderColor: "#f2f0ed" }}>
                  <span>{p.booking_ref}</span>
                  <span>{formatCurrency(p.amount_ngn)}</span>
                  <span style={{ color: "#a3a6af" }}>{p.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "activity"   && <AdminTenantActivityTab tenantId={tenantId!} />}
        {tab === "properties" && <AdminTenantPropertiesTab tenantId={tenantId!} />}
        {tab === "bookings"   && <AdminTenantBookingsTab tenantId={tenantId!} />}
        {tab === "payments"   && <AdminTenantPaymentsTab tenantId={tenantId!} />}
      </div>
    </div>
  );
}