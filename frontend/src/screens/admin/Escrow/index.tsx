import { motion } from "framer-motion";
import Title from "@/components/dashboard/common/Title";
import StatsOverview from "@/components/dashboard/common/StatsOverview";
import AdminEscrowTableRow from "./AdminEscrowTableRow";
import { useAdminEscrow } from "./hooks/useAdminEscrow";
import { formatCurrency } from "@/utils/formatCurrency";

const HEADERS = ["Booking Ref", "Seller", "Stay", "Total Amount", "Platform Fee", "Host Payout", "Status", "Date"];

export default function AdminEscrow() {
  const { escrows, isLoading, isFetching, page, setPage, stats, isStatsLoading } = useAdminEscrow();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full flex flex-col gap-8"
    >
      <Title
        title="Escrow"
        description="Funds held across every seller, released automatically on guest checkout."
      />

      <StatsOverview
        isLoading={isStatsLoading}
        growthPct={stats?.volumeGrowthPct}
        growthTooltip="Escrow volume this calendar month vs. last calendar month, platform-wide"
        cards={[
          { label: "Held",     value: formatCurrency(stats?.held.amountNgn ?? 0),     sub: `${stats?.held.count ?? 0} bookings`,     color: "#92400e", bg: "#fef3c7" },
          { label: "Released", value: formatCurrency(stats?.released.amountNgn ?? 0), sub: `${stats?.released.count ?? 0} bookings`, color: "#166534", bg: "#dcfce7" },
          { label: "Refunded", value: formatCurrency(stats?.refunded.amountNgn ?? 0), sub: `${stats?.refunded.count ?? 0} bookings`, color: "#991b1b", bg: "#fee2e2" },
        ]}
      />

      <div className="border border-[#e8e6e3] rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#e8e6e3]">
              {HEADERS.map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs lg:text-xs text-[#a3a6af] uppercase whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-[#f2f0ed]">
                  {HEADERS.map((h) => (
                    <td key={h} className="px-5 py-4">
                      <div className="h-4 rounded animate-pulse bg-[#f2f0ed] w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : escrows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-xs lg:text-sm text-[#a3a6af]">
                  No escrow records yet.
                </td>
              </tr>
            ) : (
              escrows.map((escrow) => <AdminEscrowTableRow key={escrow.id} escrow={escrow} />)
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="text-xs disabled:opacity-40">Previous</button>
        <span className="text-xs" style={{ color: "var(--color-muted-stone)" }}>Page {page}</span>
        <button onClick={() => setPage((p) => (escrows.length < 10 ? p : p + 1))} disabled={isFetching || escrows.length < 10} className="text-xs disabled:opacity-40">Next</button>
      </div>
    </motion.div>
  );
}