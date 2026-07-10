import { motion } from "framer-motion";
import { X, ExternalLink } from "lucide-react";
import { formatDateTime } from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";
import type { Payment, PaymentStatus } from "@/types/api";

const STATUS_CFG: Record<PaymentStatus, { label: string; className: string }> = {
  pending:  { label: "Pending",  className: "bg-yellow-50 text-yellow-800" },
  success:  { label: "Success",  className: "bg-green-50 text-green-700"  },
  failed:   { label: "Failed",   className: "bg-red-50 text-red-700"      },
  refunded: { label: "Refunded", className: "bg-purple-50 text-purple-700"},
};

interface Props { payment: Payment; onClose: () => void; }

export default function PaymentDetailsModal({ payment, onClose }: Props) {
  const cfg = STATUS_CFG[payment?.status];

  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-base p-4 flex items-center justify-end z-50">
      <motion.div
        initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white w-full rounded-2xl overflow-hidden relative flex flex-col lg:w-[560px] h-[95vh]"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e6e3]">
          <div>
            <p className="text-lg bold text-[#17191c]">Payment details</p>
            <p className="text-base text-[#777b86] mt-0.5">{payment?.id}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-[#f2f0ed] transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
          <span className={`text-sm px-2 py-0.5 w-fit rounded-full bold ${cfg.className}`}>{cfg.label}</span>

          <div className="flex flex-col gap-2">
            {[
              ["Booking ID",     payment?.booking_id],
              ["Gateway",        payment?.gateway],
              ["Transaction ID", payment?.transactionId ?? "—"],
              ["Channel",        payment?.gateway ?? "—"],
              ["Initiated",      formatDateTime(payment?.createdAt)],
              ["Paid at",        payment?.paidAt ? formatDateTime(payment?.paidAt) : "—"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-base text-[#777b86]">{label}</span>
                <span className="text-base text-[#17191c] bold text-right max-w-[60%] truncate">{value}</span>
              </div>
            ))}
          </div>

          <div className="border border-[#e8e6e3] p-4 flex items-center justify-between">
            <p className="text-base text-[#777b86]">Amount</p>
            <p className="text-xl bold text-[#17191c]">{formatCurrency(payment?.amount_ngn)}</p>
          </div>

          {payment?.receiptUrl && (
            <button
              onClick={() => window.open(payment?.receiptUrl, "_blank", "noopener,noreferrer")}
              className="flex items-center gap-2 text-base text-[#17191c] underline underline-offset-4 self-start"
            >
              View receipt <ExternalLink size={12} />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}