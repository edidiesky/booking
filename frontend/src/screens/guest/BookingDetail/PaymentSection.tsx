import StatusBadge    from "@/components/common/StatusBadge";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate }     from "@/utils/formatDate";
import type { Booking, Payment } from "@/types/api";

interface Props {
  booking:  Booking;
  payment:  Payment | null | undefined;
  onPay:    (gateway: "paystack" | "flutterwave") => void;
  isPaying: boolean;
}

export default function PaymentSection({ booking, payment, onPay, isPaying }: Props) {
  if (booking.status !== "pending_payment" && !payment) return null;

  return (
    <div className="flex flex-col gap-4 p-6 border rounded-2xl"
         style={{ borderColor: "#e8e6e3" }}>
      <p className="text-sm font-semibold" style={{ color: "var(--color-ink)" }}>
        Payment
      </p>

      {payment && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: "var(--color-muted-stone)" }}>Status</span>
            <StatusBadge status={payment.status} />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: "var(--color-muted-stone)" }}>Amount</span>
            <span style={{ color: "var(--color-ink)" }}>{formatCurrency(payment.amountNgn)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: "var(--color-muted-stone)" }}>Gateway</span>
            <span className="capitalize" style={{ color: "var(--color-ink)" }}>{payment.gateway}</span>
          </div>
          {payment.paidAt && (
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: "var(--color-muted-stone)" }}>Paid at</span>
              <span style={{ color: "var(--color-ink)" }}>{formatDate(payment.paidAt)}</span>
            </div>
          )}
        </div>
      )}

      {booking.status === "pending_payment" && (
        <div className="flex flex-col gap-3 pt-3 border-t" style={{ borderColor: "#f2f0ed" }}>
          <p className="text-xs" style={{ color: "var(--color-muted-stone)" }}>
            Complete payment to confirm your booking.
          </p>
          <div className="flex gap-3">
            {(["paystack", "flutterwave"] as const).map((gateway) => (
              <button
                key={gateway}
                onClick={() => onPay(gateway)}
                disabled={isPaying}
                className="flex-1 h-11 rounded-full text-sm capitalize transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}
              >
                {isPaying ? "Redirecting..." : `Pay with ${gateway}`}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}