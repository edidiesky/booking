import { motion }          from "framer-motion";
import Title               from "@/components/dashboard/common/Title";
import EscrowTableRow      from "./EscrowTableRow";
import { useTenantEscrow } from "./hooks/useTenantEscrow";
import { formatCurrency }  from "@/utils/formatCurrency";

const HEADERS = ["Booking ID", "Total Amount", "Platform Fee", "Host Payout", "Status", "Date"];

export default function DashboardEscrow() {
  const { escrows, isLoading, held, released } = useTenantEscrow();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full p-6 lg:p-10 flex flex-col gap-8"
    >
      <Title title="Escrow" description="Monitor held funds. Funds are released automatically on guest checkout." />

      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Currently Held",  value: formatCurrency(held),     color: "#1e40af", bg: "#dbeafe" },
          { label: "Total Released",  value: formatCurrency(released),  color: "#166534", bg: "#dcfce7" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="p-5 rounded-xl border flex flex-col gap-1"
               style={{ borderColor: "#e8e6e3", backgroundColor: bg }}>
            <p className="text-xs font-semibold uppercase tracking-widest"
               style={{ color }}>{label}</p>
            <p className="text-2xl font-semibold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="border rounded-xl overflow-x-auto" style={{ borderColor: "#e8e6e3" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: "#e8e6e3" }}>
              {HEADERS.map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs uppercase whitespace-nowrap"
                    style={{ color: "var(--color-hint-of-grey)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b" style={{ borderColor: "#f2f0ed" }}>
                  {HEADERS.map((h) => (
                    <td key={h} className="px-5 py-4">
                      <div className="h-4 rounded animate-pulse" style={{ backgroundColor: "#f2f0ed", width: "70%" }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : escrows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm"
                    style={{ color: "var(--color-hint-of-grey)" }}>
                  No escrow records found.
                </td>
              </tr>
            ) : escrows.map((e) => <EscrowTableRow key={e.id} escrow={e} />)}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}