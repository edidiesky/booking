import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  useGetTenantPaymentsQuery,
  useGetTenantPaymentStatsQuery,
} from "@/redux/services/paymentApi";
import { ChartSelect } from "@/components/common/charts/Chartselect";
import { useClampPage, usePagination } from "@/hooks/usePagination";
import type {
  PaymentStatus,
  PaymentGateway,
  PaymentSummary,
} from "@/types/api";
import Title from "@/components/dashboard/common/Title";
import PaymentTableRow from "./PaymentTableRow";
import PaymentDetailsModal from "./PaymentDetailsModal";
import StatsOverview from "@/components/dashboard/common/StatsOverview";
import { formatCurrency } from "@/utils/formatCurrency";
import { EmptyState } from "@/components/common/EmptyState";
import TablePagination from "@/components/common/table/TablePagination";

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
  const [selectedPayment, setSelectedPayment] = useState<PaymentSummary | null>(
    null,
  );
  const { page: currentPage, setPage: setCurrentPage } = usePagination();
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "">("");
  const [gatewayFilter, setGatewayFilter] = useState<PaymentGateway | "">("");

  const { data, isLoading, isFetching } = useGetTenantPaymentsQuery({
    page: currentPage,
    limit: ROWS_PER_PAGE,
    status: statusFilter || undefined,
    gateway: gatewayFilter || undefined,
  });
  const { data: statsData, isLoading: isStatsLoading } =
    useGetTenantPaymentStatsQuery();

  const payments: PaymentSummary[] = data?.data ?? [];
  useClampPage(data?.meta, currentPage, setCurrentPage);

  const statusTotal =
    (statsData?.data.successCount ?? 0) +
      (statsData?.data.failedCount ?? 0) +
      (statsData?.data.pendingCount ?? 0) || 1;
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

          <span className="text-xs lg:text-[13px]     text-[#a3a6af] mt-2">
            {data?.meta.total ?? 0} total
          </span>
        </div>

        <StatsOverview
          isLoading={isStatsLoading}
          growthPct={statsData?.data.volumeGrowthPct}
          growthTooltip="Successful payment volume this calendar month vs. last calendar month"
          cards={[
            {
              label: "Success",
              value: String(statsData?.data.successCount ?? 0),
              color: "#166534",
              bg: "#dcfce7",
              fillPercent:
                ((statsData?.data.successCount ?? 0) / statusTotal) * 100,
            },
            {
              label: "Failed",
              value: String(statsData?.data.failedCount ?? 0),
              color: "#991b1b",
              bg: "#fee2e2",
              fillPercent:
                ((statsData?.data.failedCount ?? 0) / statusTotal) * 100,
            },
            {
              label: "Pending",
              value: String(statsData?.data.pendingCount ?? 0),
              color: "#92400e",
              bg: "#fef3c7",
              fillPercent:
                ((statsData?.data.pendingCount ?? 0) / statusTotal) * 100,
            },
            {
              label: "Volume (Month)",
              value: formatCurrency(statsData?.data.currentMonthVolumeNgn ?? 0),
              color: "#5b21b6",
              bg: "#ede9fe",
              fillPercent:
                ((statsData?.data.currentMonthVolumeNgn ?? 0) / 1000000) * 100,
              // no fillPercent, currency total, nothing to divide it by
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
          <table className="w-full ">
            <thead>
              <tr className="border-b text-xs border-[#e8e6e3]">
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
                    className="px-5 py-3 text-left text-xs lg:text-xs text-[#a3a6af] uppercase whitespace-nowrap"
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
                    className="px-5 py-10 text-center text-xs lg:text-[13px]     text-[#a3a6af]"
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
                    className="px-5 py-10 text-center text-xs lg:text-[13px]     text-[#a3a6af]"
                  >
                    <EmptyState
                      title="Payment"
                      description="No payments found"
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          meta={data?.meta}
          onPageChange={setCurrentPage}
          isFetching={isFetching}
          noun={{ singular: "payment", plural: "payments" }}
        />
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
