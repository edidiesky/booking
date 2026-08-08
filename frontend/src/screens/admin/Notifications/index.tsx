import { useAdminNotifications } from "./hooks/useAdminNotifications";

import Title from "@/components/dashboard/common/Title";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { formatDateTime } from "@/utils/formatDate";

function getPageWindow(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "ellipsis")[] = [1];
  if (current > 3) pages.push("ellipsis");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push("ellipsis");
  pages.push(total);
  return pages;
}

export default function AdminNotifications() {
  const { notifications, isLoading, isFetching, page, setPage, totalPages, markRead } =
    useAdminNotifications();

  return (
    <div className="w-full p-4 py-8 lg:p-12 flex flex-col gap-8">
      <Title
        title={`Notifications`}
        description="Manage your Notifications, room types, and availability calendars."
      />
      <div className="border rounded-xl overflow-hidden" style={{ borderColor: "#e8e6e3" }}>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b" style={{ borderColor: "#e8e6e3" }}>
              <th className="px-5 py-4 text-left font-normal" style={{ color: "#a3a6af" }}>Type</th>
              <th className="px-5 py-4 text-left font-normal" style={{ color: "#a3a6af" }}>Title</th>
              <th className="px-5 py-4 text-left font-normal" style={{ color: "#a3a6af" }}>Details</th>
              <th className="px-5 py-4 text-left font-normal whitespace-nowrap" style={{ color: "#a3a6af" }}>Date</th>
              <th className="px-5 py-4" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b last:border-0" style={{ borderColor: "#f2f0ed" }}>
                  <td colSpan={5} className="px-5 py-4">
                    <div className="h-4 rounded animate-pulse w-3/4" style={{ backgroundColor: "#f2f0ed" }} />
                  </td>
                </tr>
              ))
            ) : notifications.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center" style={{ color: "#a3a6af" }}>
                  Nothing here yet.
                </td>
              </tr>
            ) : (
              notifications.map((n) => {
                return (
                  <tr
                    key={n.id}
                    onClick={() => !n.isRead && markRead(n.id)}
                    className="border-b last:border-0 cursor-pointer transition-colors hover:bg-[#fafaf9]"
                    style={{ borderColor: "#f2f0ed", backgroundColor: n.isRead ? "transparent" : "#f8f7ff" }}
                  >
                   
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="bold" style={{ color: "#17191c" }}>{n.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 max-w-[420px] truncate" style={{ color: "#666" }}>{n.body}</td>
                    <td className="px-5 py-4 whitespace-nowrap" style={{ color: "#a3a6af" }}>{formatDateTime(n.createdAt)}</td>
                    <td className="px-5 py-4" />
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => { e.preventDefault(); if (page > 1) setPage(page - 1); }}
                className={page === 1 ? "pointer-events-none opacity-40" : ""}
              />
            </PaginationItem>

            {getPageWindow(page, totalPages).map((p, i) =>
              p === "ellipsis" ? (
                <PaginationItem key={`e-${i}`}>
                  <span className="px-2 text-xs" style={{ color: "#a3a6af" }}>...</span>
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink href="#" isActive={p === page} onClick={(e) => { e.preventDefault(); setPage(p); }}>
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => { e.preventDefault(); if (page < totalPages) setPage(page + 1); }}
                className={page === totalPages || isFetching ? "pointer-events-none opacity-40" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
