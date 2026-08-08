import StatusBadge        from "@/components/common/StatusBadge";
import { formatDate }     from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";
import { Eye, FileText }  from "lucide-react";
import RowActionsMenu     from "@/components/common/RowActionsMenu";
import type { PaymentSummary }   from "@/types/api";

interface Props {
  payment:        PaymentSummary;
  onViewDetails:  (payment: PaymentSummary) => void;
}

export default function PaymentTableRow({ payment, onViewDetails }: Props) {
  return (
    <tr
      onClick={() => onViewDetails(payment)}
      className="border-b last:border-0 hover:bg-[#fafaf9] transition-colors cursor-pointer"
      style={{ borderColor: "#f2f0ed" }}
    >
      <td className="px-5 py-3 text-xs lg:text-[13px]whitespace-nowrap" style={{ color: "var(--color-hint-of-grey)" }}>{payment.id?.slice(0, 10)}...</td>
      <td className="px-5 py-3 text-xs lg:text-[13px]whitespace-nowrap" style={{ color: "var(--color-muted-stone)" }}>{payment.booking_id?.slice(0, 10)}...</td>
      <td className="px-5 py-3 bold whitespace-nowrap" style={{ color: "var(--color-ink)" }}>{formatCurrency(Number(payment.amount_ngn))}</td>
      <td className="px-5 py-3 capitalize text-xs" style={{ color: "var(--color-muted-stone)" }}>{payment.gateway}</td>
      <td className="px-5 py-3"><StatusBadge status={payment.status} /></td>
      <td className="px-5 py-3 text-xs lg:text-[13px]whitespace-nowrap" style={{ color: "var(--color-muted-stone)" }}>{formatDate(payment.created_at)}</td>
      <td className="px-5 py-3 text-right">
        <RowActionsMenu
          actions={[
            { label: "View payment details", icon: Eye,      onClick: () => onViewDetails(payment) },
            { label: "View receipt",         icon: FileText, onClick: () => window.open(payment.receipt_url!, "_blank", "noopener,noreferrer"), hidden: !payment.receipt_url },
          ]}
        />
      </td>
    </tr>
  );
}