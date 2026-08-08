import StatusBadge     from "@/components/common/StatusBadge";
import { formatDateTime }  from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";
import type { AdminBookingSummary, Booking } from "@/types/api";
import RowActionsMenu  from "@/components/common/RowActionsMenu";
import { Download, Eye, LogIn, LogOut, XCircle } from "lucide-react";

interface Props {
booking: AdminBookingSummary;
  onViewDetails: (booking: AdminBookingSummary) => void;
  onCancel:       (booking: Booking) => void;
  onCheckIn?:     (id: string) => void;
  onCheckOut?:    (id: string) => void;
  setSelectedOrder:    () => void;
}


function downloadReceipt(url: string, bookingRef: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.download = `receipt-${bookingRef}.pdf`;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


export default function BookingTableRow({
  booking,
  onViewDetails,
  onCancel,
  onCheckIn,
  onCheckOut,
  setSelectedOrder
}: Props) {
  return (
    <tr onClick={() => setSelectedOrder()} className="border-b cursor-pointer last:border-0 hover:bg-[#fafaf9] transition-colors" style={{ borderColor: "#f2f0ed" }}>
      <td className="px-5 py-3 bold text-xs lg:text-[13px]whitespace-nowrap" style={{ color: "var(--color-ink)" }}>
        {booking.bookingRef}
      </td>
      <td className="px-5 py-3 text-xs lg:text-[13px]whitespace-nowrap" style={{ color: "var(--color-muted-stone)" }}>
        {(booking.propertyName)}
      </td>
      <td className="px-5 py-3 text-xs lg:text-[13px]whitespace-nowrap" style={{ color: "var(--color-muted-stone)" }}>
        {formatDateTime(booking.checkOut)}
      </td>
      <td className="px-5 py-3 text-xs lg:text-[13px]whitespace-nowrap" style={{ color: "var(--color-ink)" }}>
        {formatCurrency(booking.totalAmountNgn)}
      </td>
      <td className="px-5 py-3">
        <StatusBadge status={booking.status} />
      </td>
      <td className="px-5 py-3 text-right">
        <RowActionsMenu
          actions={[
            { label: "View details", icon: Eye,      onClick: () => onViewDetails(booking) },
            { label: "Download receipt", icon: Download, onClick: () => downloadReceipt(booking.receiptUrl!, booking.bookingRef), hidden: !booking.receiptUrl },
            { label: "Check in",     icon: LogIn,    onClick: () => onCheckIn?.(booking.bookingId),  hidden: booking.status !== "confirmed"  || !onCheckIn,  separator: true },
            { label: "Check out",    icon: LogOut,   onClick: () => onCheckOut?.(booking.bookingId), hidden: booking.status !== "checked_in" || !onCheckOut },
            { label: "Cancel booking", icon: XCircle, onClick: () => onCancel(booking), variant: "danger", hidden: !["pending_payment", "confirmed"].includes(booking.status), separator: true },
          ]}
        />
      </td>
    </tr>
  );
}