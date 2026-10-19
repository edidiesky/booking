import { motion } from "framer-motion";
import Title from "@/components/dashboard/common/Title";
import EscrowTableRow from "./EscrowTableRow";
import { useTenantEscrow } from "./hooks/useTenantEscrow";
import { formatCurrency } from "@/utils/formatCurrency";
import { EmptyState } from "@/components/common/EmptyState";
import TablePagination from "@/components/common/table/TablePagination";
import { StatCardGrid } from "@/components/common/widgets/StatCardGrid";

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
  const {
    escrows,
    meta,
    isLoading,
    isFetching,
    setPage,
    stats,
    isStatsLoading,
  } = useTenantEscrow();
  const held = stats?.held?.amountNgn ?? 0;
  const released = stats?.released?.amountNgn ?? 0;
  const refunded = stats?.refunded?.amountNgn ?? 0;
  const whole = held + released + refunded || 1;
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

      <StatCardGrid
        isLoading={isStatsLoading}
        cards={[
          {
            label: "Held",
            value: formatCurrency(held),
            total: `of ${formatCurrency(whole)}`,
            progress: held / whole,
            tone: "warning",
            footnote: "In escrow now",
          },
          {
            label: "Released",
            value: formatCurrency(released),
            total: `of ${formatCurrency(whole)}`,
            progress: released / whole,
            tone: "success",
            footnote: "Paid out to host",
          },
          {
            label: "Refunded",
            value: formatCurrency(refunded),
            total: `of ${formatCurrency(whole)}`,
            progress: refunded / whole,
            tone: "danger",
            footnote: "Returned to guests",
          },
          {
            label: "Volume (month)",
            value: formatCurrency(stats?.currentMonthVolumeNgn ?? 0),
            total: "This calendar month",
            progress: 0,
            tone: "info",
            footnote: "Escrow activity",
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
                  className="px-5 py-3 text-left text-xs lg:text-xsuppercase whitespace-nowrap"
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
                  <EmptyState
                    title="Escrow"
                    description="No escrow records found."
                  />
                </td>
              </tr>
            ) : (
              escrows.map((e) => <EscrowTableRow key={e.id} escrow={e} />)
            )}
          </tbody>
        </table>
      </div>
      <TablePagination
        meta={meta}
        onPageChange={setPage}
        isFetching={isFetching}
        noun={{ singular: "escrow record", plural: "escrow records" }}
      />
    </motion.div>
  );
}
