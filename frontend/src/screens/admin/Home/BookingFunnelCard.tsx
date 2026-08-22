import StatusBadge from "@/components/common/StatusBadge";
import { AdminPaymentSummary } from "@/types/api";

interface Props {
  recentTransactions: AdminPaymentSummary[];
}

function fmtNaira(amount: number | string): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(n)) return "₦0";
  return new Intl.NumberFormat("en-NG", {
    style:                 "currency",
  currency:              "NGN",
    minimumFractionDigits: 0,
  }).format(n);
}

function payerName(first?: string, last?: string): string {
  const name = [first, last].filter(Boolean).join(" ");
  return name || "Guest";
}

function initialsFromName(first?: string, last?: string, ref?: string): string {
  const a = first?.[0] ?? "";
  const b = last?.[0] ?? "";
  const fromName = (a + b).toUpperCase();
  if (fromName) return fromName;
  if (!ref) return "--";
  return ref.replace(/^BK-/, "").slice(0, 2).toUpperCase();
}

export default function RecentTransactionsCard({ recentTransactions }: Props) {
  const recent = recentTransactions ?? [];

  return (
    <div className="rounded-2xl border border-[var(--color-fog)] bg-[var(--color-canvas)] flex flex-col">
      <div className="px-5 py-4">
        <p className="text-xs font-semibold lg:text-sm">Recent Transactions</p>
      </div>

      {recent.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2 px-5">
          <p className="text-xs" style={{ color: "var(--color-muted-stone)" }}>No recent transactions yet</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-[var(--color-fog)]">
          {recent.map(({ id, gateway, status, guestFirstName, guestLastName, amountNgn, bookingRef }) => {
            const name = payerName(guestFirstName,guestLastName);
            return (
              // TODO: wrap with your router's Link to the payment/booking detail view
              <div key={id} className="flex cursor-pointer hover:bg-[#f2f0ed58] transition-all items-center gap-3 px-5 py-3.5">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-xs lg:text-[13px]   "
                  style={{ backgroundColor: "var(--color-fog)", color: "var(--color-ink)" }}
                >
                  {initialsFromName( guestFirstName,guestLastName, bookingRef)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs lg:text-[13px]     truncate" style={{ color: "var(--color-ink)" }}>
                    {name} &middot; {fmtNaira(amountNgn)} via <span className="capitalize">{gateway}</span>
                  </p>
                  <p className="text-xs lg:text-[13px]     medium mt-0.5 truncate" style={{ color: "var(--color-muted-stone)" }}>
                    { bookingRef}
                  </p>
                </div>
                <span className="text-xs lg:text-[13px]     medium shrink-0">
                  <StatusBadge status={status} />
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}