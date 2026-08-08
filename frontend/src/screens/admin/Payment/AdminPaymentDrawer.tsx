import { formatDateTime } from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";
import type { AdminPaymentSummary, PaymentStatus } from "@/types/api";
import Drawer from "@/components/common/Drawer";
import DrawerField from "@/components/common/DrawerField";
import DrawerSection from "@/components/common/DrawerSection";
import LazyImage from "@/components/common/LazyImage";

const STATUS_CFG: Record<PaymentStatus, { label: string; className: string }> =
  {
    pending: { label: "Pending", className: "bg-yellow-50 text-yellow-800" },
    success: { label: "Success", className: "bg-green-50 text-green-700" },
    failed: { label: "Failed", className: "bg-red-50 text-red-700" },
    refunded: { label: "Refunded", className: "bg-purple-50 text-purple-700" },
  };

const TIMELINE_STEPS = [
  {
    key: "placed",
    label: "Order Placed",
    description: "Booking was successfully placed by the guest",
  },
  {
    key: "confirmed",
    label: "Payment Confirmed",
    description: "Payment has been successfully processed and verified",
  },
];

function stepIndex(status: PaymentStatus): number {
  if (status === "success" || status === "refunded") return 1;
  return 0;
}

interface Props {
  payment: AdminPaymentSummary;
  onClose: () => void;
}

export default function AdminPaymentDrawer({ payment, onClose }: Props) {
  const cfg = STATUS_CFG[payment.status];
  const idx = stepIndex(payment.status);
  const nights = Math.round(
    (new Date(payment.checkOut).getTime() -
      new Date(payment.checkIn).getTime()) /
      86_400_000,
  );

  return (
    <Drawer
      title="Payment details"
      subtitle={payment.bookingRef}
      onClose={onClose}
    >
      <DrawerSection label="Room">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#f2f0ed] shrink-0">
            {payment.roomTypeImages?.[0] ? (
              <LazyImage
                src={payment.roomTypeImages[0]}
                alt={payment.roomTypeName}
              />
            ) : null}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs lg:text-xs bold text-[#17191c] truncate">
              {payment.roomTypeName}
            </p>
            <p className="text-xs text-[#777b86]">
              {nights} night{nights !== 1 ? "s" : ""}
            </p>
          </div>
          <p className="text-xs bold text-[#17191c] whitespace-nowrap">
            {formatCurrency(Number(payment.amountNgn))}
          </p>
        </div>
      </DrawerSection>

      <DrawerSection label="Payment breakdown">
        <DrawerField label="Booking Ref" value={payment.bookingRef} />
        <DrawerField label="Gateway" value={payment.gateway} />
        <DrawerField label="Status" value={cfg.label} />
        <DrawerField
          label="Transaction ID"
          value={payment.transactionId ?? "—"}
        />
        <DrawerField label="Channel" value={payment.channel ?? "—"} />
        <DrawerField
          label="Initiated"
          value={formatDateTime(payment.createdAt)}
        />
        <DrawerField
          label="Paid at"
          value={payment.paidAt ? formatDateTime(payment.paidAt) : "—"}
        />
      </DrawerSection>

      <DrawerSection label="Seller / Tenant">
        <DrawerField label="Name" value={payment.tenantName} />
        <DrawerField label="Tenant ID" value={payment.tenantId} />
        <DrawerField label="Contact Email" value={payment.tenantEmail} />
      </DrawerSection>

      <DrawerSection label="Customer breakdown">
        <DrawerField
          label="Customer First Name"
          value={payment.guestFirstName}
        />
        <DrawerField label="Customer Last Name" value={payment.guestLastName} />
        <DrawerField label="Customer Email" value={payment.guestEmail} />
      </DrawerSection>

      <DrawerSection label="Timeline">
        <div className="flex flex-col gap-4">
          {TIMELINE_STEPS.map((step, i) => (
            <div key={step.key} className="flex items-start gap-3">
              <div
                className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 border-2 ${i <= idx ? "bg-[#17191c] border-[#17191c]" : "bg-white border-[#e8e6e3]"}`}
              />
              <div>
                <p
                  className={`text-xs bold ${i <= idx ? "text-[#17191c]" : "text-[#a3a6af]"}`}
                >
                  {step.label}
                </p>
                <p className="text-xs medium text-[#a3a6af]">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </DrawerSection>

      <div className="border-t sticky bottom-0 left-0 bg-white border-[#e8e6e3] px-6 py-4 flex items-center justify-between">
        <button
          onClick={onClose}
          className="text-xs text-[#777b86] bold hover:text-[#17191c]"
        >
          Close
        </button>
        {payment.receiptUrl && (
          <button
            onClick={() =>
              window.open(payment.receiptUrl!, "_blank", "noopener,noreferrer")
            }
            className="text-xs bold text-[#fff] bg-black rounded-full px-4 py-2"
          >
            View receipt
          </button>
        )}
      </div>
    </Drawer>
  );
}
