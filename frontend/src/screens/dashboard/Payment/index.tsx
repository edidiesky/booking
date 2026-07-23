import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGetTenantPaymentsQuery, useGetTenantPaymentStatsQuery } from "@/redux/services/paymentApi";
import { ChartSelect } from "@/components/common/charts/Chartselect";
import type {PaymentStatus, PaymentGateway, PaymentSummary } from "@/types/api";
import Title from "@/components/dashboard/common/Title";
import PaymentTableRow from "./PaymentTableRow";
import PaymentDetailsModal from "./PaymentDetailsModal";
import StatsOverview from "@/components/dashboard/common/StatsOverview";
import { formatCurrency } from "@/utils/formatCurrency";

const ROWS_PER_PAGE = 10;

const STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; className: string }
> = {
  pending: { label: "Pending", className: "bg-yellow-50 text-yellow-800" },
  success: { label: "Success", className: "bg-green-50 text-green-700" },
  failed: { label: "Failed", className: "bg-red-50 text-red-700" },
  refunded: { label: "Refunded", className: "bg-[#f2f0ed] text-[#4c4c4c]" },
};

const GATEWAY_CONFIG: Record<
  PaymentGateway,
  { label: string; className: string }
> = {
  paystack: { label: "Paystack", className: "bg-blue-50 text-blue-700" },
  flutterwave: {
    label: "Flutterwave",
    className: "bg-orange-50 text-orange-700",
  },
};

const STATUS_OPTIONS: PaymentStatus[] = [
  "pending",
  "success",
  "failed",
  "refunded",
];
const GATEWAY_OPTIONS: PaymentGateway[] = ["paystack", "flutterwave"];

export default function DashboardPayments() {
  const [selectedPayment, setSelectedPayment] = useState<PaymentSummary | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "">("");
  const [gatewayFilter, setGatewayFilter] = useState<PaymentGateway | "">("");

  const { data, isLoading } = useGetTenantPaymentsQuery({
    page: currentPage,
    limit: ROWS_PER_PAGE,
  });
  const { data: statsData, isLoading: isStatsLoading } = useGetTenantPaymentStatsQuery();

  const allPayments: PaymentSummary[] = data?.data ?? [];

  const payments = allPayments.filter((p) => {
    const matchStatus = !statusFilter || p?.status === statusFilter;
    const matchGateway = !gatewayFilter || p?.gateway === gatewayFilter;
    return matchStatus && matchGateway;
  });

  const totalPages = Math.max(1, Math.ceil(payments.length / ROWS_PER_PAGE));

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full p-4 py-8 lg:p-12 flex flex-col gap-8"
      >
        <div className="flex items-start justify-between gap-4">
          <Title
            title={`Payments`}
            description="View all payment transactions across your property bookings."
          />

          <span className="text-xs text-[#a3a6af] mt-2">
            {allPayments.length} total
          </span>
        </div>

        <StatsOverview
          isLoading={isStatsLoading}
          growthPct={statsData?.data.volumeGrowthPct}
          growthTooltip="Successful payment volume this calendar month vs. last calendar month"
          cards={[
            { label: "Success",  value: String(statsData?.data.successCount ?? 0),  color: "#166534", bg: "#dcfce7" },
            { label: "Failed",   value: String(statsData?.data.failedCount ?? 0),   color: "#991b1b", bg: "#fee2e2" },
            { label: "Pending",  value: String(statsData?.data.pendingCount ?? 0),  color: "#92400e", bg: "#fef3c7" },
            {
              label: "Volume (Month)",
              value: formatCurrency(statsData?.data.currentMonthVolumeNgn ?? 0),
              color: "#5b21b6", bg: "#ede9fe",
            },
          ]}
        />

        <div className="flex items-center gap-3 flex-wrap">
          <ChartSelect
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as PaymentStatus | "");
              setCurrentPage(1);
            }}
            options={[
              { label: "All statuses", value: "" },
              ...STATUS_OPTIONS.map((s) => ({
                label: STATUS_CONFIG[s].label,
                value: s,
              })),
            ]}
          />
          <ChartSelect
            value={gatewayFilter}
            onValueChange={(v) => {
              setGatewayFilter(v as PaymentGateway | "");
              setCurrentPage(1);
            }}
            options={[
              { label: "All gateways", value: "" },
              ...GATEWAY_OPTIONS.map((g) => ({
                label: GATEWAY_CONFIG[g].label,
                value: g,
              })),
            ]}
          />
        </div>

        <div className="border border-[#e8e6e3] overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#e8e6e3]">
                {[
                  "Payment ID",
                  "Booking ID",
                  "Amount",
                  "Gateway",
                  "Status",
                  "Date",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs text-[#a3a6af] uppercase whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-xs text-[#a3a6af]"
                  >
                    Loading payments...
                  </td>
                </tr>
              ) : payments.length > 0 ? (
                payments.map((payment) => (
                  <PaymentTableRow
                    key={payment.id}
                    payment={payment}
                    onViewDetails={setSelectedPayment}
                  />
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-xs text-[#a3a6af]"
                  >
                    No payments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-[#a3a6af]">
            Page {currentPage} of {totalPages} - {allPayments.length} payments
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 px-3 text-xs border border-[#e8e6e3] text-[#4c4c4c] disabled:opacity-40 hover:bg-[#f2f0ed]"
            >
              Prev
            </button>
            {Array.from(
              { length: Math.min(totalPages, 7) },
              (_, i) => i + 1,
            ).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`h-8 w-8 rounded-xl text-xs border ${currentPage === page ? "bg-[#17191c] text-white border-[#17191c]" : "border-[#e8e6e3] text-[#4c4c4c] hover:bg-[#f2f0ed]"}`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 px-3 text-xs border border-[#e8e6e3] text-[#4c4c4c] disabled:opacity-40 hover:bg-[#f2f0ed]"
            >
              Next
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedPayment && (
          <PaymentDetailsModal
            payment={selectedPayment}
            onClose={() => setSelectedPayment(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}