import StatusBadge from "@/components/common/StatusBadge";
import { formatDate } from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";
import { Eye, FileText } from "lucide-react";
import RowActionsMenu from "@/components/common/RowActionsMenu";
import type { AdminPaymentSummary } from "@/types/api";

interface Props {
  payment: AdminPaymentSummary;
  onViewDetails: (payment: AdminPaymentSummary) => void;
}

export default function PaymentTableRow({ payment, onViewDetails }: Props) {
  return (
    <tr
      onClick={() => onViewDetails(payment)}
      className="border-b last:border-0 text-[13px] hover:bg-[#fafaf9] transition-colors cursor-pointer"
      style={{ borderColor: "#f2f0ed" }}
    >
      <td className="px-5 py-3 bold whitespace-nowrap" style={{ color: "var(--color-ink)" }}>
        {payment.bookingRef}
      </td>
      <td className="px-5 py-3 whitespace-nowrap" style={{ color: "var(--color-muted-stone)" }}>
        {payment.guestFirstName} {payment.guestLastName}
      </td>
      <td className="px-5 py-3 whitespace-nowrap" style={{ color: "var(--color-hint-of-grey)" }}>
        {payment.tenantName}
      </td>
      <td className="px-5 py-3 bold whitespace-nowrap" style={{ color: "var(--color-ink)" }}>
        {formatCurrency(Number(payment.amountNgn))}
      </td>
      <td className="px-5 py-3 capitalize" style={{ color: "var(--color-muted-stone)" }}>
        {payment.gateway}
      </td>
      <td className="px-5 py-3">
        <StatusBadge status={payment.status} />
      </td>
      <td className="px-5 py-3 whitespace-nowrap" style={{ color: "var(--color-muted-stone)" }}>
        {formatDate(payment.createdAt)}
      </td>
      <td className="px-5 py-3 text-right">
        <RowActionsMenu
          actions={[
            { label: "View payment details", icon: Eye, onClick: () => onViewDetails(payment) },
            {
              label: "View receipt",
              icon: FileText,
              onClick: () => window.open(payment.receiptUrl!, "_blank", "noopener,noreferrer"),
              hidden: !payment.receiptUrl,
            },
          ]}
        />
      </td>
    </tr>
  );
}