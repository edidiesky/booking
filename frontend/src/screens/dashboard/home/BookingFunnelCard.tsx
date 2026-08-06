import { PaymentSummary } from "@/types/api";

interface Props {
  recentTransactions: PaymentSummary[];
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

// Initials now come from the actual payer's name, not the booking
// reference code, an avatar representing a person should be initials
// of that person, "MS" from a booking ref reads as meaningless letters
// next to a real name in the row beside it.
function initialsFromName(first?: string, last?: string, ref?: string): string {
  const a = first?.[0] ?? "";
  const b = last?.[0] ?? "";
  const fromName = (a + b).toUpperCase();
  if (fromName) return fromName;
  if (!ref) return "--";
  return ref.replace(/^BK-/, "").slice(0, 2).toUpperCase();
}

const STATUS_STYLES: Record<PaymentSummary["status"], { label: string; color: string }> = {
  success:  { label: "Paid",     color: "#166534" },
  pending:  { label: "Pending",  color: "#92400e" },
  failed:   { label: "Failed",   color: "#991b1b" },
  refunded: { label: "Refunded", color: "#4c4c4c" },
};

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
          {recent.map(({ id, booking_ref, amount_ngn, gateway, transaction_id, status, guest_first_name, guest_last_name }) => {
            const statusMeta = STATUS_STYLES[status] ?? { label: status, color: "var(--color-muted-stone)" };
            const name = payerName(guest_first_name, guest_last_name);
            return (
              // TODO: wrap with your router's Link to the payment/booking detail view
              <div key={id} className="flex cursor-pointer hover:bg-[#f2f0ed58] transition-all items-center gap-3 px-5 py-3.5">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-xs lg:text-sm"
                  style={{ backgroundColor: "var(--color-fog)", color: "var(--color-ink)" }}
                >
                  {initialsFromName(guest_first_name, guest_last_name, booking_ref)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs lg:text-sm truncate" style={{ color: "var(--color-ink)" }}>
                    {name} &middot; {fmtNaira(amount_ngn)} via <span className="capitalize">{gateway}</span>
                  </p>
                  <p className="text-xs lg:text-sm medium mt-0.5 truncate" style={{ color: "var(--color-muted-stone)" }}>
                    {transaction_id ?? booking_ref}
                  </p>
                </div>
                <span className="text-xs lg:text-sm medium shrink-0" style={{ color: statusMeta.color }}>
                  {statusMeta.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}