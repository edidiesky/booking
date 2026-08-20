import { X } from "lucide-react";
import { motion } from "framer-motion";
import { useGetAdminTenantDetailQuery } from "@/redux/services/tenantApi";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateTime } from "@/utils/formatDate";

interface Props {
  tenantId: string;
  onClose: () => void;
}

export default function TenantDetailModal({ tenantId, onClose }: Props) {
  const { data, isLoading } = useGetAdminTenantDetailQuery(tenantId);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm p-4 flex items-center justify-end z-50">
      <motion.div
        initial={{ x: 600 }} animate={{ x: 0 }} exit={{ x: 600 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white w-full rounded-2xl overflow-hidden relative flex flex-col lg:w-[640px] h-full"
      >
        <div className="border-b border-[#e8e6e3] flex items-center justify-between px-8 h-[72px] shrink-0">
          <h4 className="text-xs lg:text-[13px]  text-[#17191c]">{data?.data.tenant.name ?? "Tenant"}</h4>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center hover:bg-[#f2f0ed] transition-colors" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {isLoading || !data ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs" style={{ color: "var(--color-muted-stone)" }}>Loading...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-8">
            <section>
              <p className="text-xs lg:text-[13px]  mb-3" style={{ color: "var(--color-ink)" }}>Profile</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><span style={{ color: "var(--color-hint-of-grey)" }}>Slug</span><p>{data.data.tenant.slug}</p></div>
                <div><span style={{ color: "var(--color-hint-of-grey)" }}>Status</span><p>{data.data.tenant.status}</p></div>
                <div><span style={{ color: "var(--color-hint-of-grey)" }}>Platform fee</span><p>{data.data.tenant.platformFeePct}%</p></div>
                <div><span style={{ color: "var(--color-hint-of-grey)" }}>Currency</span><p>{data.data.tenant.settings?.currency ?? "—"}</p></div>
              </div>
            </section>

            <section>
              <p className="text-xs lg:text-[13px]  mb-3" style={{ color: "var(--color-ink)" }}>At a glance</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="border rounded-xl p-3" style={{ borderColor: "#e8e6e3" }}>
                  <p className="text-xs" style={{ color: "var(--color-hint-of-grey)" }}>Escrow held</p>
                  <p className="text-sm bold">{formatCurrency(data.data.stats.escrow.held.amountNgn)}</p>
                </div>
                <div className="border rounded-xl p-3" style={{ borderColor: "#e8e6e3" }}>
                  <p className="text-xs" style={{ color: "var(--color-hint-of-grey)" }}>Released</p>
                  <p className="text-sm bold">{formatCurrency(data.data.stats.escrow.released.amountNgn)}</p>
                </div>
                <div className="border rounded-xl p-3" style={{ borderColor: "#e8e6e3" }}>
                  <p className="text-xs" style={{ color: "var(--color-hint-of-grey)" }}>Volume growth</p>
                  <p className="text-sm bold">{data.data.stats.escrow.volumeGrowthPct}%</p>
                </div>
              </div>
            </section>

            <section>
              <p className="text-xs lg:text-[13px]  mb-3" style={{ color: "var(--color-ink)" }}>Recent purchases</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left" style={{ borderColor: "#e8e6e3", color: "var(--color-hint-of-grey)" }}>
                    <th className="py-2 font-normal">Booking</th>
                    <th className="py-2 font-normal">Amount</th>
                    <th className="py-2 font-normal">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.recentPurchases.map((p) => (
                    <tr key={p.id} className="border-b" style={{ borderColor: "#f2f0ed" }}>
                      <td className="py-2">{p.booking_ref}</td>
                      <td className="py-2">{formatCurrency(p.amount_ngn)}</td>
                      <td className="py-2" style={{ color: "var(--color-muted-stone)" }}>{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section>
              <p className="text-xs lg:text-[13px]  mb-3" style={{ color: "var(--color-ink)" }}>Recent activity</p>
              <div className="flex flex-col gap-2">
                {data.data.recentActivity.map((a) => (
                  <div key={a.id} className="text-xs lg:text-[13px]  flex items-center justify-between">
                    <span>
                      {[a.actor_first_name, a.actor_last_name].filter(Boolean).join(" ") || "System"} {a.action} {a.resource}
                    </span>
                    <span style={{ color: "var(--color-hint-of-grey)" }}>{formatDateTime(a.created_at)}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </motion.div>
    </div>
  );
}