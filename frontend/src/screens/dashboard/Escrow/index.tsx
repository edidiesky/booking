import { motion } from "framer-motion";
import Title from "@/components/dashboard/common/Title";
import EscrowTableRow from "./EscrowTableRow";
import { useTenantEscrow } from "./hooks/useTenantEscrow";
import { formatCurrency } from "@/utils/formatCurrency";
import StatsOverview from "@/components/dashboard/common/StatsOverview";

const HEADERS = [
  "Booking Ref",
  "Stay",
  "Total Amount",
  "Platform Fee",
  "Host Payout",
  "Status",
  "Date",
];

export default function DashboardEscrow() {
  const { escrows, isLoading, stats, isStatsLoading } = useTenantEscrow();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full p-6 lg:p-10 flex flex-col gap-8"
    >
      <div className="flex items-start justify-between gap-4">
        <Title
          title="Escrow"
          description="Monitor held funds. Funds are released automatically on guest checkout."
        />
      </div>

      <StatsOverview
        isLoading={isStatsLoading}
        growthTooltip="Escrow volume this calendar month vs. last calendar month"
        cards={[
          {
            label: "Revenue Held",
            value: formatCurrency(stats?.held?.amountNgn ?? 0),
            color: "#1e40af",
            bg: "#dbeafe",
          },
          {
            label: "Revenue Refuded",
            value: formatCurrency(stats?.refunded?.amountNgn ?? 0),
            color: "#166534",
            bg: "#dcfce7",
          },
          {
            label: "Revenue Released",
            value: formatCurrency(stats?.released?.amountNgn ?? 0),
            color: "#991b1b",
            bg: "#fee2e2",
          },
          {
            label: "Revenue (Month)",
            value: formatCurrency(stats?.currentMonthVolumeNgn ?? 0),
            color: "#5b21b6",
            bg: "#ede9fe",
          },
        ]}
      />

      <div
        className="border rounded-xl overflow-x-auto"
        style={{ borderColor: "#e8e6e3" }}
      >
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b" style={{ borderColor: "#e8e6e3" }}>
              {HEADERS.map((h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-left text-xs lg:text-smuppercase whitespace-nowrap"
                  style={{ color: "var(--color-hint-of-grey)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr
                  key={i}
                  className="border-b"
                  style={{ borderColor: "#f2f0ed" }}
                >
                  {HEADERS.map((h) => (
                    <td key={h} className="px-5 py-4">
                      <div
                        className="h-4 rounded animate-pulse"
                        style={{ backgroundColor: "#f2f0ed", width: "70%" }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : escrows.length === 0 ? (
              <tr>
                <td
                  colSpan={HEADERS.length}
                  className="px-5 py-12 text-center text-xs"
                  style={{ color: "var(--color-hint-of-grey)" }}
                >
                  No escrow records found.
                </td>
              </tr>
            ) : (
              escrows.map((e) => <EscrowTableRow key={e.id} escrow={e} />)
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
