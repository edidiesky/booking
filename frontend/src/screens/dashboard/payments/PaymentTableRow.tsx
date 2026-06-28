import StatusBadge    from "@/components/common/StatusBadge";
import { formatDate } from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";
import type { Payment }   from "@/types/api";

interface Props { payment: Payment; }

export default function PaymentTableRow({ payment }: Props) {
  return (
    <tr className="border-b last:border-0 hover:bg-[#fafaf9] transition-colors"
        style={{ borderColor: "#f2f0ed" }}>
      <td className="px-5 py-3 text-xs whitespace-nowrap"
          style={{ color: "var(--color-hint-of-grey)" }}>
        {payment.id}
      </td>
      <td className="px-5 py-3 text-xs whitespace-nowrap"
          style={{ color: "var(--color-muted-stone)" }}>
        {payment.bookingId}
      </td>
      <td className="px-5 py-3 bold whitespace-nowrap"
          style={{ color: "var(--color-ink)" }}>
        {formatCurrency(payment.amountNgn)}
      </td>
      <td className="px-5 py-3 capitalize text-sm"
          style={{ color: "var(--color-muted-stone)" }}>
        {payment.gateway}
      </td>
      <td className="px-5 py-3">
        <StatusBadge status={payment.status} />
      </td>
      <td className="px-5 py-3 text-sm whitespace-nowrap"
          style={{ color: "var(--color-muted-stone)" }}>
        {formatDate(payment.createdAt)}
      </td>
    </tr>
  );
}