import { motion } from "framer-motion";
import { X } from "lucide-react";
import { formatDateTime } from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";
import type { PaymentSummary, PaymentStatus } from "@/types/api";
import LazyImage from "@/components/common/LazyImage";

const STATUS_CFG: Record<PaymentStatus, { label: string; className: string }> =
  {
    pending: { label: "Pending", className: "bg-yellow-50 text-yellow-800" },
    success: { label: "Success", className: "bg-green-50 text-green-700" },
    failed: { label: "Failed", className: "bg-red-50 text-red-700" },
    refunded: { label: "Refunded", className: "bg-purple-50 text-purple-700" },
  };

  const TIMELINE_STEPS = [
  { key: "placed",    label: "Order Placed",      description: "Booking was successfully placed by the guest" },
  { key: "confirmed", label: "Payment Confirmed",  description: "Payment has been successfully processed and verified" },
];


function stepIndex(status: PaymentStatus): number {
  if (status === "success" || status === "refunded") return 1;
  return 0;
}



interface Props {
  payment: PaymentSummary;
  onClose: () => void;
}

export default function PaymentDetailsModal({ payment, onClose }: Props) {
  const cfg   = STATUS_CFG[payment.status];
  const idx   = stepIndex(payment.status);
  const nights = Math.round(
    (new Date(payment.check_out).getTime() - new Date(payment.check_in).getTime()) / 86_400_000
  );

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-base p-4 flex items-center justify-end z-50">
      <motion.div
        initial={{ x: 400 }}
        animate={{ x: 0 }}
        exit={{ x: 400 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white w-full rounded-2xl overflow-hidden relative flex flex-col lg:w-[750px] h-[95vh]"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e6e3]">
          <div>
            <p className="text-lg bold text-[#17191c]">Payment details</p>
            <p className="text-base text-[#777b86] mt-0.5">{payment?.id}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-[#f2f0ed] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 flex w-full overflow-y-auto flex-col gap-2">
          <div className="w-full px-6 py-5 border-b flex flex-col gap-4">
            <p className="text-sm uppercase text-[#a3a6af] bold">Room</p>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#f2f0ed] shrink-0">
                {payment.room_type_images?.[0] ? (
                  <LazyImage src={payment.room_type_images[0]} alt={payment.room_type_name} />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base lg:text-lg bold text-[#17191c] truncate">{payment.room_type_name}</p>
                <p className="text-sm text-[#777b86]">{nights} night{nights !== 1 ? "s" : ""}</p>
              </div>
              <p className="text-base bold text-[#17191c] whitespace-nowrap">
                {formatCurrency(Number(payment.amount_ngn))}
              </p>
            </div>
          </div>
          <div className="w-full px-6 py-5 border-b flex flex-col gap-6">
            <p className="w-full text-sm text-[#a3a6af] uppercase">
              Payment breakdown
            </p>
            <div className="flex flex-col gap-4 lg:gap-4 lg:w-[75%]">
              {[
                ["Booking ID", payment?.booking_id],
                ["Gateway", payment?.gateway],
                ["Status", cfg.label],

                ["Transaction ID", payment?.transaction_id ?? "—"],
                ["Channel", payment?.gateway ?? "—"],
                ["Initiated", formatDateTime(payment?.created_at)],
                [
                  "Paid at",
                  payment?.paid_at ? formatDateTime(payment?.paid_at) : "—",
                ],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-base text-[#777b86]">{label}</span>
                  <span className="text-base text-[#17191c] bold text-right max-w-[60%] truncate">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="w-full px-6 py-5 border-b flex flex-col gap-4">
            <p className="w-full text-sm text-[#a3a6af] uppercase">
              Customer breakdown
            </p>
            {[
              ["Customer First Name", payment?.guest_first_name],
              ["Customer Last Name", payment?.guest_last_name],
              ["Customer Email", payment?.guest_email],
              ["Customer Type", payment?.guest_user_type],
            ].map(([label, value]) => (
              <div
                key={label}
                className={`w-full flex items-center gap-8 lg:gap-10`}
              >
                <p className="text-base medium text-[#777b86]">{label}</p>
                <p className="text-base text-[#17191c] bold">{value}</p>
              </div>
            ))}
          </div>

           <div className="w-full px-6 py-5 border-b flex flex-col gap-4">
            <p className="w-full text-sm text-[#a3a6af] uppercase">
              
              Timeline</p>
            <div className="flex flex-col gap-4">
              {TIMELINE_STEPS.map((step, i) => (
                <div key={step.key} className="flex items-start gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 border-2 ${
                    i <= idx ? "bg-[#17191c] border-[#17191c]" : "bg-white border-[#e8e6e3]"
                  }`} />
                  <div>
                    <p className={`text-base bold ${i <= idx ? "text-[#17191c]" : "text-[#a3a6af]"}`}>{step.label}</p>
                    <p className="text-sm medium text-[#a3a6af]">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        
        </div>

          <div className="border-t sticky bottom-0 left-0 border-[#e8e6e3] px-6 py-4 flex items-center justify-between">
            <button
              onClick={onClose}
              className="text-sm  text-[#777b86] bold hover:text-[#17191c]"
            >
              Cancel
            </button>
            {payment.receipt_url && (
              <button
                onClick={() =>
                  window.open(
                    payment.receipt_url!,
                    "_blank",
                    "noopener,noreferrer",
                  )
                }
                className="text-sm bold text-[#fff] bg-black rounded-full px-4 py-2"
              >
                View receipt
              </button>
            )}
          </div>
      </motion.div>
    </div>
  );
}
