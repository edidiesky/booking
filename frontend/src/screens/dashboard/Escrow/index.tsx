import { motion }          from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import Title               from "@/components/dashboard/common/Title";
import EscrowTableRow      from "./EscrowTableRow";
import { useTenantEscrow } from "./hooks/useTenantEscrow";
import { formatCurrency }  from "@/utils/formatCurrency";

const HEADERS = ["Booking Ref", "Stay", "Total Amount", "Platform Fee", "Host Payout", "Status", "Date"];

export default function DashboardEscrow() {
  const { escrows, isLoading, stats, isStatsLoading } = useTenantEscrow();

  const growthPositive = (stats?.volumeGrowthPct ?? 0) >= 0;

  const cards = [
    {
      label: "Currently Held",
      value: formatCurrency(stats?.held.amountNgn ?? 0),
      sub:   `${stats?.held.count ?? 0} bookings`,
      color: "#1e40af",
      bg:    "#dbeafe",
    },
    {
      label: "Total Released",
      value: formatCurrency(stats?.released.amountNgn ?? 0),
      sub:   `${stats?.released.count ?? 0} bookings`,
      color: "#166534",
      bg:    "#dcfce7",
    },
    {
      label: "Refunded",
      value: formatCurrency(stats?.refunded.amountNgn ?? 0),
      sub:   `${stats?.refunded.count ?? 0} bookings`,
      color: "#5b21b6",
      bg:    "#ede9fe",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full p-6 lg:p-10 flex flex-col gap-8"
    >
      <div className="flex items-start justify-between gap-4">
        <Title title="Escrow" description="Monitor held funds. Funds are released automatically on guest checkout." />
        {!isStatsLoading && stats && (
          <div
            className="flex items-center gap-1 text-xs bold px-2.5 py-1 rounded-full mt-2"
            style={{
              color:           growthPositive ? "#166534" : "#991b1b",
              backgroundColor: growthPositive ? "#dcfce7" : "#fee2e2",
            }}
            title="Escrow volume this calendar month vs. last calendar month"
          >
            {growthPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {stats.volumeGrowthPct > 0 ? "+" : ""}{stats.volumeGrowthPct}% this month
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map(({ label, value, sub, color, bg }) => (
          <div key={label} className="p-5 rounded-xl border flex flex-col gap-1"
               style={{ borderColor: "#e8e6e3", backgroundColor: bg }}>
            <p className="text-xs bold uppercase tracking-widest" style={{ color }}>{label}</p>
            {isStatsLoading ? (
              <div className="h-6 w-24 rounded animate-pulse mt-1" style={{ backgroundColor: `${color}22` }} />
            ) : (
              <>
                <p className="text-xl bold" style={{ color }}>{value}</p>
                <p className="text-xs" style={{ color, opacity: 0.75 }}>{sub}</p>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="border rounded-xl overflow-x-auto" style={{ borderColor: "#e8e6e3" }}>
        <table className="w-full text-xs">
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
                <td colSpan={HEADERS.length} className="px-5 py-12 text-center text-xs"
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