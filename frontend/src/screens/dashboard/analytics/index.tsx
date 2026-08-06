import { useState }                    from "react";
import { motion }                       from "framer-motion";
import Title                            from "@/components/dashboard/common/Title";
import { useGetTenantBookingsQuery }    from "@/redux/services/bookingApi";
import { useGetTenantPaymentsQuery }    from "@/redux/services/paymentApi";
import { useGetTenantEscrowQuery }      from "@/redux/services/escrowApi";
import { formatCurrency }              from "@/utils/formatCurrency";
import { BarChartStacked }             from "@/components/common/charts/BarChartStacked";
import { RadialBarChartCard }          from "@/components/common/charts/ChartRadialStacked";
import type { ChartConfig }            from "@/components/ui/chart";

type Tab = "bookings" | "revenue" | "payments" | "escrow";

const TABS: { key: Tab; label: string }[] = [
  { key: "bookings", label: "Bookings"  },
  { key: "revenue",  label: "Revenue"   },
  { key: "payments", label: "Payments"  },
  { key: "escrow",   label: "Escrow"    },
];

//  Helpers 

function groupByMonth<T extends { createdAt: string }>(items: T[]) {
  const map: Record<string, number> = {};
  items.forEach((item) => {
    const month = new Date(item.createdAt).toLocaleString("en-NG", { month: "short", year: "2-digit" });
    map[month] = (map[month] ?? 0) + 1;
  });
  return Object.entries(map).map(([date, count]) => ({ date, count }));
}

function groupRevenueByMonth(payments: { amount_ngn: string; status: string; created_at: string }[]) {
  const map: Record<string, number> = {};
  payments
    .filter((p) => p.status === "success")
    .forEach((p) => {
      const month = new Date(p.created_at).toLocaleString("en-NG", { month: "short", year: "2-digit" });
      map[month] = (map[month] ?? 0) + Number(p.amount_ngn);
    });
  return Object.entries(map).map(([date, revenue]) => ({ date, revenue }));
}

//  Stat card 

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1 p-5 rounded-xl border"
         style={{ borderColor: "var(--color-fog)" }}>
      <p className="text-xs lg:text-smuppercase tracking-wide" style={{ color: "var(--color-muted-stone)" }}>{label}</p>
      <p className="text-xl " style={{ color: "var(--color-ink)" }}>{value}</p>
      {sub && <p className="text-xs" style={{ color: "var(--color-muted-stone)" }}>{sub}</p>}
    </div>
  );
}

//  Tabs 

function BookingsTab() {
  const { data, isLoading } = useGetTenantBookingsQuery({ limit: 200 });
  const bookings = data?.data ?? [];

  const byStatus = {
    confirmed:    bookings.filter((b) => b.status === "confirmed").length,
    checked_in:   bookings.filter((b) => b.status === "checked_in").length,
    checked_out:  bookings.filter((b) => b.status === "checked_out").length,
    cancelled:    bookings.filter((b) => b.status === "cancelled").length,
  };

  const overTime   = groupByMonth(bookings);
  const chartConfig: ChartConfig = { count: { label: "Bookings", color: "#0f172a" } };

  if (isLoading) return <div className="h-48 animate-pulse rounded-xl" style={{ backgroundColor: "#f2f0ed" }} />;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Confirmed"   value={String(byStatus.confirmed)}   sub="Awaiting arrival"     />
        <StatCard label="Checked In"  value={String(byStatus.checked_in)}  sub="Currently on site"    />
        <StatCard label="Checked Out" value={String(byStatus.checked_out)} sub="Completed stays"      />
        <StatCard label="Cancelled"   value={String(byStatus.cancelled)}   sub="Cancellations to date" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarChartStacked
          title="Bookings over time"
          description="Monthly booking volume across all properties"
          data={overTime}
          chartConfig={chartConfig}
          dataKeys={[{ datakey: "count", color: "#0f172a" }]}
          selectedFilter="all"
          onFilterChange={() => {}}
          isCurrency={false}
        />
        <RadialBarChartCard
          title="Bookings by status"
          description="Current breakdown of all booking statuses"
          data={[byStatus]}
          segments={[
            { datakey: "confirmed",   color: "#3b82f6", label: "Confirmed"   },
            { datakey: "checked_in",  color: "#f59e0b", label: "Checked In"  },
            { datakey: "checked_out", color: "#10b981", label: "Checked Out" },
            { datakey: "cancelled",   color: "#f87171", label: "Cancelled"   },
          ]}
          centerLabel="Bookings"
          trend={{ value: `${bookings.length} total`, positive: true, note: "all time" }}
        />
      </div>
    </div>
  );
}

function RevenueTab() {
  const { data, isLoading } = useGetTenantPaymentsQuery({ limit: 200 });
  const payments = data?.data ?? [];

  const totalRevenue  = payments.filter((p) => p.status === "success").reduce((s, p) => s + Number(p.amount_ngn), 0);
  const totalRefunded = payments.filter((p) => p.status === "refunded").reduce((s, p) => s + Number(p.amount_ngn), 0);
  const overTime      = groupRevenueByMonth(payments);
  const chartConfig: ChartConfig = { revenue: { label: "Revenue (₦)", color: "#0f172a" } };

  if (isLoading) return <div className="h-48 animate-pulse rounded-xl" style={{ backgroundColor: "#f2f0ed" }} />;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Revenue"  value={formatCurrency(totalRevenue)}  sub="From successful payments" />
        <StatCard label="Total Refunded" value={formatCurrency(totalRefunded)} sub="Refunded to guests"       />
        <StatCard label="Net Revenue"    value={formatCurrency(totalRevenue - totalRefunded)} sub="After refunds" />
      </div>

      <BarChartStacked
        title="Revenue over time"
        description="Monthly revenue from successful payments"
        data={overTime}
        chartConfig={chartConfig}
        dataKeys={[{ datakey: "revenue", color: "#0f172a" }]}
        selectedFilter="all"
        onFilterChange={() => {}}
        isCurrency
      />
    </div>
  );
}

function PaymentsTab() {
  const { data, isLoading } = useGetTenantPaymentsQuery({ limit: 200 });
  const payments = data?.data ?? [];

  const byStatus = {
    success:  payments.filter((p) => p.status === "success").length,
    failed:   payments.filter((p) => p.status === "failed").length,
    refunded: payments.filter((p) => p.status === "refunded").length,
    pending:  payments.filter((p) => p.status === "pending").length,
  };
  const byGateway = {
    paystack:    payments.filter((p) => p.gateway === "paystack").length,
    flutterwave: payments.filter((p) => p.gateway === "flutterwave").length,
  };

  if (isLoading) return <div className="h-48 animate-pulse rounded-xl" style={{ backgroundColor: "#f2f0ed" }} />;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Successful" value={String(byStatus.success)}  sub="Payments completed" />
        <StatCard label="Failed"     value={String(byStatus.failed)}   sub="Failed attempts"    />
        <StatCard label="Refunded"   value={String(byStatus.refunded)} sub="Returned to guests" />
        <StatCard label="Pending"    value={String(byStatus.pending)}  sub="Awaiting capture"   />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RadialBarChartCard
          title="Payments by status"
          description="Breakdown of all payment outcomes"
          data={[byStatus]}
          segments={[
            { datakey: "success",  color: "#10b981", label: "Success"  },
            { datakey: "refunded", color: "#f59e0b", label: "Refunded" },
            { datakey: "failed",   color: "#f87171", label: "Failed"   },
            { datakey: "pending",  color: "#94a3b8", label: "Pending"  },
          ]}
          centerLabel="Payments"
          trend={{ value: `${payments.length} total`, positive: true, note: "all time" }}
        />
        <RadialBarChartCard
          title="Payments by gateway"
          description="Volume split between Paystack and Flutterwave"
          data={[byGateway]}
          segments={[
            { datakey: "paystack",    color: "#0f172a", label: "Paystack"    },
            { datakey: "flutterwave", color: "#f59e0b", label: "Flutterwave" },
          ]}
          centerLabel="Payments"
        />
      </div>
    </div>
  );
}

function EscrowTab() {
  const { data, isLoading } = useGetTenantEscrowQuery({ limit: 200 });
  const escrows = data?.data ?? [];

  const held     = escrows.filter((e) => e.status === "held").reduce((s, e) => s + e.amountNgn, 0);
  const released = escrows.filter((e) => e.status === "released").reduce((s, e) => s + e.hostPayoutNgn, 0);
  const refunded = escrows.filter((e) => e.status === "refunded").reduce((s, e) => s + e.amountNgn, 0);

  if (isLoading) return <div className="h-48 animate-pulse rounded-xl" style={{ backgroundColor: "#f2f0ed" }} />;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatCard label="Currently Held"   value={formatCurrency(held)}     sub="Pending checkout"     />
        <StatCard label="Total Released"   value={formatCurrency(released)} sub="Paid to host"         />
        <StatCard label="Total Refunded"   value={formatCurrency(refunded)} sub="Returned to guests"   />
      </div>

      <RadialBarChartCard
        title="Escrow by status"
        description="Current breakdown of all escrow records"
        data={[{
          held:     escrows.filter((e) => e.status === "held").length,
          released: escrows.filter((e) => e.status === "released").length,
          refunded: escrows.filter((e) => e.status === "refunded").length,
        }]}
        segments={[
          { datakey: "held",     color: "#3b82f6", label: "Held"     },
          { datakey: "released", color: "#10b981", label: "Released" },
          { datakey: "refunded", color: "#f87171", label: "Refunded" },
        ]}
        centerLabel="Escrow"
        trend={{ value: `${escrows.length} records`, positive: true, note: "all time" }}
      />
    </div>
  );
}

//  Main 

const TAB_CONTENT: Record<Tab, React.ReactNode> = {
  bookings: <BookingsTab />,
  revenue:  <RevenueTab />,
  payments: <PaymentsTab />,
  escrow:   <EscrowTab  />,
};

export default function DashboardAnalytics() {
  const [activeTab, setActiveTab] = useState<Tab>("bookings");

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full p-6 lg:p-10 flex flex-col gap-8"
    >
      <Title
        title="Analytics"
        description="Track bookings, revenue, payments, and escrow across your properties."
      />

      {/* Tab bar */}
      <div className="flex items-center border-b overflow-x-auto" style={{ borderColor: "var(--color-fog)" }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-5 py-2.5 text-xs lg:text-smtransition-colors border-b-2 -mb-px whitespace-nowrap"
            style={{
              borderBottomColor: activeTab === tab.key ? "var(--color-ink)" : "transparent",
              color:             activeTab === tab.key ? "var(--color-ink)" : "var(--color-muted-stone)",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>{TAB_CONTENT[activeTab]}</div>
    </motion.div>
  );
}