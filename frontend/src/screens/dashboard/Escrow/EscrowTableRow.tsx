import StatusBadge    from "@/components/common/StatusBadge";
import { formatDate } from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";
import type { Escrow }    from "@/types/api";

interface Props { escrow: Escrow; }

export default function EscrowTableRow({ escrow }: Props) {
  return (
    <tr className="border-b last:border-0 hover:bg-[#fafaf9] transition-colors"
        style={{ borderColor: "#f2f0ed" }}>
      <td className="px-5 py-3 text-xs lg:text-smwhitespace-nowrap"
          style={{ color: "var(--color-hint-of-grey)" }}>
        {escrow.bookingRef}
      </td>
      <td className="px-5 py-3 text-xs lg:text-smwhitespace-nowrap"
          style={{ color: "var(--color-muted-stone)" }}>
        {formatDate(escrow.checkIn)} – {formatDate(escrow.checkOut)}
      </td>
      <td className="px-5 py-3 bold whitespace-nowrap"
          style={{ color: "var(--color-ink)" }}>
        {formatCurrency(escrow.amountNgn)}
      </td>
      <td className="px-5 py-3 whitespace-nowrap"
          style={{ color: "var(--color-muted-stone)" }}>
        {formatCurrency(escrow.platformFeeNgn)}
      </td>
      <td className="px-5 py-3 whitespace-nowrap"
          style={{ color: "var(--color-ink)" }}>
        {formatCurrency(escrow.hostPayoutNgn)}
      </td>
      <td className="px-5 py-3">
        <StatusBadge status={escrow.status} />
      </td>
      <td className="px-5 py-3 text-xs lg:text-smwhitespace-nowrap"
          style={{ color: "var(--color-muted-stone)" }}>
        {formatDate(escrow.createdAt)}
      </td>
    </tr>
  );
}