import { useState } from "react";
import { useListAdminPaymentsQuery } from "@/redux/services/adminApi";
import { formatDate } from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";

export default function AdminTenantPaymentsTab({ tenantId }: { tenantId: string }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useListAdminPaymentsQuery({ page, limit: 20, tenantId });
  const payments = data?.data.payments ?? [];

  return (
    <div className="flex flex-col gap-4">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b text-left" style={{ borderColor: "#e8e6e3", color: "#a3a6af" }}>
            <th className="py-2 font-normal">Booking</th>
            <th className="py-2 font-normal">Gateway</th>
            <th className="py-2 font-normal">Amount</th>
            <th className="py-2 font-normal">Status</th>
            <th className="py-2 font-normal">Date</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={5} className="py-4 text-center" style={{ color: "#a3a6af" }}>Loading...</td></tr>
          ) : payments.length === 0 ? (
            <tr><td colSpan={5} className="py-4 text-center" style={{ color: "#a3a6af" }}>No payments yet.</td></tr>
          ) : (
            payments.map((p) => (
              <tr key={p.id} className="border-b" style={{ borderColor: "#f2f0ed" }}>
                <td className="py-2">{p.booking_ref}</td>
                <td className="py-2 capitalize">{p.gateway}</td>
                <td className="py-2">{formatCurrency(Number(p.amount_ngn))}</td>
                <td className="py-2 capitalize">{p.status}</td>
                <td className="py-2" style={{ color: "#a3a6af" }}>{formatDate(p.created_at)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="flex items-center gap-3">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="text-xs disabled:opacity-40">Previous</button>
        <span className="text-xs" style={{ color: "#a3a6af" }}>Page {page}</span>
        <button onClick={() => setPage((p) => (payments.length < 20 ? p : p + 1))} disabled={isFetching || payments.length < 20} className="text-xs disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}