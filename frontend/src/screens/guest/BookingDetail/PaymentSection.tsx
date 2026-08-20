import StatusBadge    from "@/components/common/StatusBadge";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate }     from "@/utils/formatDate";
import type { Booking, Payment } from "@/types/api";
import { FileText, Loader2 } from "lucide-react";
import { useLazyGetGuestInvoiceQuery } from "@/redux/services/invoiceApi";
import { showToast } from "@/components/common/Toast";

interface Props {
  booking:  Booking;
  payment:  Payment | null | undefined;
  onPay:    (gateway: "paystack" | "flutterwave") => void;
  isPaying: boolean;
}

export default function PaymentSection({ booking, payment, onPay, isPaying }: Props) {
  const [fetchInvoice, { isFetching: isGeneratingInvoice }] = useLazyGetGuestInvoiceQuery();

  const handleDownloadInvoice = async () => {
    try {
      const result = await fetchInvoice(booking.bookingId).unwrap();
      if (result.data.pdf_url) {
        window.open(result.data.pdf_url, "_blank", "noopener,noreferrer");
      }
    } catch {
      showToast("Couldn't generate the invoice, try again in a moment.", "error");
    }
  };

  if (booking.status !== "pending_payment" && !payment) return null;

  return (
    <div className="flex flex-col gap-4 p-6 border rounded-2xl"
         style={{ borderColor: "#e8e6e3" }}>
      <p className="text-xs lg:text-[13px]" style={{ color: "var(--color-ink)" }}>
        Payment
      </p>

      {payment && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: "var(--color-muted-stone)" }}>Status</span>
            <StatusBadge status={payment.status} />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: "var(--color-muted-stone)" }}>Amount</span>
            <span style={{ color: "var(--color-ink)" }}>{formatCurrency(payment.amountNgn)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: "var(--color-muted-stone)" }}>Gateway</span>
            <span className="capitalize" style={{ color: "var(--color-ink)" }}>{payment.gateway}</span>
          </div>
          {payment.paidAt && (
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: "var(--color-muted-stone)" }}>Paid at</span>
              <span style={{ color: "var(--color-ink)" }}>{formatDate(payment.paidAt)}</span>
            </div>
          )}
          {payment.status === "success" && (
            <button
              onClick={handleDownloadInvoice}
              disabled={isGeneratingInvoice}
              className="flex items-center justify-center gap-1.5 h-9 mt-1 rounded-full text-xs lg:text-[13px]  border transition-colors hover:bg-[#f2f0ed] disabled:opacity-50"
              style={{ borderColor: "#e8e6e3", color: "var(--color-ink)" }}
            >
              {isGeneratingInvoice ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Generating invoice...
                </>
              ) : (
                <>
                  <FileText size={13} />
                  Download invoice
                </>
              )}
            </button>
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
                className="flex-1 h-11 rounded-full text-xs lg:text-[13px]capitalize transition-opacity hover:opacity-80 disabled:opacity-50"
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