import StatusBadge from "@/components/common/StatusBadge";
import { formatDate } from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";
import { EscrowStatus } from "@/types/api";

interface AdminEscrowRecord {
  id: string;
  amountNgn: number;
  platformFeeNgn: number;
  hostPayoutNgn: number;
  bookingRef: string;
  checkIn: string;
  checkOut: string;
  createdAt: string;
  tenantName: string;
   status: EscrowStatus;
}

interface Props {
  escrow: AdminEscrowRecord;
}

export default function AdminEscrowTableRow({ escrow }: Props) {
  return (
    <tr className="border-b last:border-0 hover:bg-[#fafaf9] transition-colors" style={{ borderColor: "#f2f0ed" }}>
      <td className="px-5 py-3 text-xs lg:text-[13px]  whitespace-nowrap" style={{ color: "var(--color-hint-of-grey)" }}>
        {escrow.bookingRef}
      </td>
      <td className="px-5 py-3 text-xs lg:text-[13px]   whitespace-nowrap" style={{ color: "var(--color-muted-stone)" }}>
        {escrow.tenantName}
      </td>
      <td className="px-5 py-3 text-xs lg:text-[13px]  whitespace-nowrap" style={{ color: "var(--color-muted-stone)" }}>
        {formatDate(escrow.checkIn)} – {formatDate(escrow.checkOut)}
      </td>
      <td className="px-5 py-3 bold text-xs lg:text-[13px]   whitespace-nowrap" style={{ color: "var(--color-ink)" }}>
        {formatCurrency(escrow.amountNgn)}
      </td>
      <td className="px-5 py-3 whitespace-nowrap text-xs lg:text-[13px]" style={{ color: "var(--color-muted-stone)" }}>
        {formatCurrency(escrow.platformFeeNgn)}
      </td>
      <td className="px-5 py-3 whitespace-nowrap text-xs lg:text-[13px]  " style={{ color: "var(--color-ink)" }}>
        {formatCurrency(escrow.hostPayoutNgn)}
      </td>
      <td className="px-5 py-3 text-xs lg:text-[13px]  ">
        <StatusBadge status={escrow.status} />
      </td>
      <td className="px-5 py-3 text-xs lg:text-[13px]  whitespace-nowrap" style={{ color: "var(--color-muted-stone)" }}>
        {formatDate(escrow.createdAt)}
      </td>
    </tr>
  );
}