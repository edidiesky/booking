import { useState }                    from "react";
import type { PaymentGateway, Property, PropertyStatus } from "@/types/api";
import { useProperties } from "./hooks/useProperties";

const ROWS_PER_PAGE = 10;

const statusConfig: Record<PropertyStatus, { label: string; className: string }> = {
  active:  { label: "Pending",  className: "bg-yellow-50 text-yellow-800" },
  success:  { label: "Success",  className: "bg-green-50 text-green-700"   },
  failed:   { label: "Failed",   className: "bg-red-50 text-red-700"       },
  refunded: { label: "Refunded", className: "bg-[#f2f0ed] text-[#4c4c4c]" },
};

const gatewayConfig: Record<PaymentGateway, { label: string; className: string }> = {
  paystack:    { label: "Paystack",    className: "bg-blue-50 text-blue-700"      },
  flutterwave: { label: "Flutterwave", className: "bg-orange-50 text-orange-700"  },
};

const STATUS_OPTIONS  = ["pending", "success", "failed", "refunded"] as PropertyStatus[];
const GATEWAY_OPTIONS = ["paystack", "flutterwave"] as PaymentGateway[];

export default function Properties() {
  const [currentPage,    setCurrentPage]    = useState(1);
  const [statusFilter,   setStatusFilter]   = useState<PropertyStatus | "">("");
  const [gatewayFilter,  setGatewayFilter]  = useState<PaymentGateway | "">("");

  const { properties, isLoading } = useProperties();

  const allPayments: Property[] = properties ?? [];
  const filtered = allPayments
    .filter((p) => !statusFilter  || p.status  === statusFilter)
    .filter((p) => !gatewayFilter || p.gateway === gatewayFilter);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated  = filtered.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  return (
    <div className="w-full p-4 py-8 lg:p-12 mx-auto">
      <div className="w-full flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="text-xl lg:text-2xl font-semibold" style={{ color: "var(--color-ink)" }}>
              Properties
            </h4>
            <p className="text-sm mt-1 max-w-[420px]" style={{ color: "var(--color-muted-stone)" }}>
              View all payment transactions across your properties.
            </p>
          </div>
          <span className="text-xs mt-2" style={{ color: "var(--color-muted-stone)" }}>
            {filtered.length} total
          </span>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as PropertyStatus | ""); setCurrentPage(1); }}
            className="h-9 px-3 text-sm border rounded-lg outline-none"
            style={{ borderColor: "var(--color-fog)", color: "var(--color-ink)" }}
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{statusConfig[s].label}</option>
            ))}
          </select>

          <select
            value={gatewayFilter}
            onChange={(e) => { setGatewayFilter(e.target.value as PaymentGateway | ""); setCurrentPage(1); }}
            className="h-9 px-3 text-sm border rounded-lg outline-none"
            style={{ borderColor: "var(--color-fog)", color: "var(--color-ink)" }}
          >
            <option value="">All gateways</option>
            {GATEWAY_OPTIONS.map((g) => (
              <option key={g} value={g}>{gatewayConfig[g].label}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="border overflow-x-auto rounded-lg" style={{ borderColor: "var(--color-fog)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--color-fog)" }}>
                {["Transaction ID", "Booking ID", "Amount", "Gateway", "Status", "Paid At"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs uppercase whitespace-nowrap"
                      style={{ color: "var(--color-muted-stone)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm"
                      style={{ color: "var(--color-muted-stone)" }}>
                    Loading Properties...
                  </td>
                </tr>
              ) : paginated.length > 0 ? (
                paginated.map((payment) => {
                  const sCfg = statusConfig[payment.status];
                  const gCfg = gatewayConfig[payment.gateway];
                  return (
                    <tr key={payment.id} className="border-b last:border-0 transition-colors"
                        style={{ borderColor: "var(--color-fog)" }}>
                      <td className="px-5 py-3 text-xs whitespace-nowrap font-mono"
                          style={{ color: "var(--color-muted-stone)" }}>
                        {payment.transactionId ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-xs whitespace-nowrap font-mono"
                          style={{ color: "var(--color-muted-stone)" }}>
                        {payment.bookingId}
                      </td>
                      <td className="px-5 py-3 font-semibold whitespace-nowrap"
                          style={{ color: "var(--color-ink)" }}>
                        ₦{payment.amountNgn.toLocaleString("en-NG")}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${gCfg.className}`}>
                          {gCfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${sCfg.className}`}>
                          {sCfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap"
                          style={{ color: "var(--color-muted-stone)" }}>
                        {payment.paidAt
                          ? new Date(payment.paidAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm"
                      style={{ color: "var(--color-muted-stone)" }}>
                    No Properties found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: "var(--color-muted-stone)" }}>
            Page {currentPage} of {totalPages} — {filtered.length} Properties
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 px-3 text-sm border rounded disabled:opacity-40"
              style={{ borderColor: "var(--color-fog)", color: "var(--color-ink)" }}
            >
              Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className="h-8 w-8 text-xs border rounded"
                style={{
                  borderColor:     currentPage === page ? "var(--color-ink)" : "var(--color-fog)",
                  backgroundColor: currentPage === page ? "var(--color-ink)" : "transparent",
                  color:           currentPage === page ? "var(--color-canvas)" : "var(--color-ink)",
                }}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 px-3 text-xs border rounded disabled:opacity-40"
              style={{ borderColor: "var(--color-fog)", color: "var(--color-ink)" }}
            >
              Next
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}