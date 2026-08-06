import { useState } from "react";
import { useListGuestsQuery } from "@/redux/services/adminApi";
import { formatDate } from "@/utils/formatDate";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from "@/components/ui/pagination";

export default function AdminCustomers() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useListGuestsQuery({ page });
  const guests = data?.data.guests ?? [];
  const totalPages = data?.data.totalPages ?? 1;

  return (
    <div>
      <h1 className="text-2xl bold mb-6" style={{ color: "var(--color-ink)" }}>Customers / Guests</h1>

      <table className="w-full text-xs">
        <thead>
          <tr className="border-b text-left" style={{ borderColor: "#e8e6e3", color: "var(--color-hint-of-grey)" }}>
            <th className="py-3 font-normal">Name</th>
            <th className="py-3 font-normal">Email</th>
            <th className="py-3 font-normal">Status</th>
            <th className="py-3 font-normal">Joined</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={4} className="py-6 text-center" style={{ color: "var(--color-muted-stone)" }}>Loading...</td></tr>
          ) : guests.length === 0 ? (
            <tr><td colSpan={4} className="py-6 text-center" style={{ color: "var(--color-muted-stone)" }}>No guests yet.</td></tr>
          ) : (
            guests.map((g) => (
              <tr key={g.id} className="border-b" style={{ borderColor: "#f2f0ed" }}>
                <td className="py-3">{g.firstName} {g.lastName}</td>
                <td className="py-3" style={{ color: "var(--color-muted-stone)" }}>{g.email}</td>
                <td className="py-3 capitalize">{g.status}</td>
                <td className="py-3" style={{ color: "var(--color-hint-of-grey)" }}>{formatDate(g.createdAt)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); if (page > 1) setPage(page - 1); }} className={page === 1 ? "pointer-events-none opacity-40" : ""} /></PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}><PaginationLink href="#" isActive={p === page} onClick={(e) => { e.preventDefault(); setPage(p); }}>{p}</PaginationLink></PaginationItem>
            ))}
            <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); if (page < totalPages) setPage(page + 1); }} className={page === totalPages || isFetching ? "pointer-events-none opacity-40" : ""} /></PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}