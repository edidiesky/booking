import { useState } from "react";
import { useListAdminBookingsQuery } from "@/redux/services/adminApi";
import { formatDate } from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";

export default function AdminTenantBookingsTab({ tenantId }: { tenantId: string }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useListAdminBookingsQuery({ page, limit: 20, tenantId });
  const bookings = data?.data.bookings ?? [];

  return (
    <div className="flex flex-col gap-4">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b text-left" style={{ borderColor: "#e8e6e3", color: "#a3a6af" }}>
            <th className="py-2 font-normal">Reference</th>
            <th className="py-2 font-normal">Guest</th>
            <th className="py-2 font-normal">Dates</th>
            <th className="py-2 font-normal">Amount</th>
            <th className="py-2 font-normal">Status</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={5} className="py-4 text-center" style={{ color: "#a3a6af" }}>Loading...</td></tr>
          ) : bookings.length === 0 ? (
            <tr><td colSpan={5} className="py-4 text-center" style={{ color: "#a3a6af" }}>No bookings yet.</td></tr>
          ) : (
            bookings.map((b) => (
              <tr key={b.bookingId} className="border-b" style={{ borderColor: "#f2f0ed" }}>
                <td className="py-2">{b.bookingRef}</td>
                <td className="py-2">{b.guestFirstName} {b.guestLastName}</td>
                <td className="py-2" style={{ color: "#a3a6af" }}>{formatDate(b.checkIn)} – {formatDate(b.checkOut)}</td>
                <td className="py-2">{formatCurrency(b.totalAmountNgn)}</td>
                <td className="py-2 capitalize">{b.status}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="flex items-center gap-3">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="text-xs disabled:opacity-40">Previous</button>
        <span className="text-xs" style={{ color: "#a3a6af" }}>Page {page}</span>
        <button onClick={() => setPage((p) => (bookings.length < 20 ? p : p + 1))} disabled={isFetching || bookings.length < 20} className="text-xs disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}