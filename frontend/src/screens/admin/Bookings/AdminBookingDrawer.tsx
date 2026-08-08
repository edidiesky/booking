import { formatDate, formatDateTime } from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";
import type { AdminBookingSummary, BookingStatus } from "@/types/api";
import Drawer from "@/components/common/Drawer";
import DrawerField from "@/components/common/DrawerField";
import DrawerSection from "@/components/common/DrawerSection";
import LazyImage from "@/components/common/LazyImage";

const STATUS_CFG: Record<BookingStatus, { label: string; className: string }> = {
  pending_payment: { label: "Pending Payment", className: "bg-yellow-50 text-yellow-800" },
  confirmed:       { label: "Confirmed",       className: "bg-blue-50 text-blue-700" },
  checked_in:      { label: "Checked In",      className: "bg-green-50 text-green-700" },
  checked_out:     { label: "Checked Out",     className: "bg-[#f2f0ed] text-[#4c4c4c]" },
  cancelled:       { label: "Cancelled",       className: "bg-red-50 text-red-700" },
  refunded:        { label: "Refunded",        className: "bg-purple-50 text-purple-700" },
};

const TIMELINE_STEPS = [
  { key: "placed",      label: "Booking placed",  description: "Guest reserved the room type" },
  { key: "confirmed",   label: "Payment confirmed", description: "Payment verified, room secured" },
  { key: "checked_in",  label: "Checked in",      description: "Guest arrived and checked in" },
  { key: "checked_out", label: "Checked out",     description: "Stay completed, escrow released" },
];

function stepIndex(status: BookingStatus): number {
  if (status === "checked_out") return 3;
  if (status === "checked_in")  return 2;
  if (status === "confirmed")   return 1;
  return 0;
}

interface Props {
  booking: AdminBookingSummary;
  onClose: () => void;
}

export default function AdminBookingDrawer({ booking, onClose }: Props) {
  const cfg = STATUS_CFG[booking.status];
  const idx = stepIndex(booking.status);
  const isTerminal = booking.status === "cancelled" || booking.status === "refunded";
  const nights = Math.round(
    (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / 86_400_000,
  );

  return (
    <Drawer title="Booking details" subtitle={booking.bookingRef} onClose={onClose}>
      <DrawerSection label="Room">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#f2f0ed] shrink-0">
            {booking.roomTypeImage ? (
              <LazyImage src={booking.roomTypeImage} alt={booking.roomTypeName} />
            ) : null}
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <p className="text-sm lg:text-sm bold text-[#17191c] truncate">{booking.propertyName}</p>
            <p className="text-xs lg:text-[13px] text-[#777b86] truncate">{booking.roomTypeName}</p>
            <p className="text-xs lg:text-[13px] text-[#777b86]">
              {nights} night{nights !== 1 ? "s" : ""}
            </p>
          </div>
          <p className="text-xs lg:text-[13px] text-[#17191c] whitespace-nowrap">
            {formatCurrency(Number(booking.totalAmountNgn))}
          </p>
        </div>
      </DrawerSection>

<DrawerSection label="Details">
  <DrawerField label="Created at" value={formatDateTime(booking.createdAt)} />
  <DrawerField label="Check-in"   value={formatDate(booking.checkIn)} />
  <DrawerField label="Status"     value={cfg.label} />
  <DrawerField label="Check-out"  value={formatDate(booking.checkOut)} />
  <DrawerField label="Nights"     value={String(booking.nights)} />
  <DrawerField label="Rooms"      value={String(booking.roomsCount)} />
  <DrawerField label="Guests"     value={String(booking.guestCount)} />
</DrawerSection>

<DrawerSection label="Seller / Tenant">
  <DrawerField label="Name"          value={booking.tenantName} />
  <DrawerField label="Tenant ID"     value={booking.tenantId} />
  <DrawerField label="Contact Email" value={booking.tenantEmail} />
</DrawerSection>

<DrawerSection label="Customer breakdown">
  <DrawerField label="Customer First Name" value={booking.guestFirstName} />
  <DrawerField label="Customer Last Name"  value={booking.guestLastName} />
  <DrawerField label="Customer Email"      value={booking.guestEmail} />
  <DrawerField label="Customer Id"         value={booking.guestUserId} />
</DrawerSection>

      <DrawerSection label="Payment breakdown">
        <DrawerField label="Total amount"  value={formatCurrency(booking.totalAmountNgn)} />
        <DrawerField label="Platform fee"  value={formatCurrency(booking.platformFeeNgn)} />
        <DrawerField label="Host payout"   value={formatCurrency(booking.hostPayoutNgn)} />
      </DrawerSection>

      {!isTerminal && (
        <DrawerSection label="Timeline">
          <div className="flex flex-col gap-4">
            {TIMELINE_STEPS.map((step, i) => (
              <div key={step.key} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${i <= idx ? "bg-[#17191c]" : "bg-[#e8e6e3]"}`} />
                <div>
                  <p className={`text-xs lg:text-[13px] ${i <= idx ? "text-[#17191c]" : "text-[#a3a6af]"}`}>
                    {step.label}
                  </p>
                  <p className="text-xs lg:text-[13px] text-[#a3a6af]">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </DrawerSection>
      )}

      <div className="border-t border-[#e8e6e3] bg-white px-6 py-4 flex items-center justify-between mt-auto">
        <button
          onClick={onClose}
          className="text-xs lg:text-[13px] text-[#777b86] bold hover:text-[#17191c]"
        >
          Close
        </button>
        {booking.receiptUrl && (
          <button
            onClick={() => window.open(booking.receiptUrl!, "_blank", "noopener,noreferrer")}
            className="text-xs lg:text-[13px] text-[#fff] bg-black rounded-full px-4 py-2"
          >
            View receipt
          </button>
        )}
      </div>
    </Drawer>
  );
}