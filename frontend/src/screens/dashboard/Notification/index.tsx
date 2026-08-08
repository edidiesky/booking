import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, LogIn, LogOut, CheckCheck } from "lucide-react";
import Title from "@/components/dashboard/common/Title";
import { formatDateTime } from "@/utils/formatDate";
import {
  useListSellerNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from "@/redux/services/sellerNotificationApi";
import type { SellerNotificationType } from "@/types/api";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";

const TYPE_CONFIG: Record<SellerNotificationType, { icon: typeof CreditCard; color: string; bg: string; label: string }> = {
  booking_confirmed:   { icon: CreditCard, color: "#166534", bg: "#dcfce7", label: "Payment" },
  booking_checked_in:  { icon: LogIn,      color: "#1e40af", bg: "#dbeafe", label: "Check-in" },
  booking_checked_out: { icon: LogOut,     color: "#5b21b6", bg: "#ede9fe", label: "Check-out" },
};


function getPageWindow(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "ellipsis")[] = [1];
  if (current > 3) pages.push("ellipsis");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push("ellipsis");
  pages.push(total);
  return pages;
}

export default function DashboardNotifications() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useListSellerNotificationsQuery({ page });
  const [markRead]    = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();

  const notifications = data?.data.notifications ?? [];
  const unreadCount   = data?.data.unreadCount ?? 0;
  const totalPages    = data?.data.totalPages ?? 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full p-6 lg:p-10 flex flex-col gap-6"
    >
      <Title
        title="Notifications"
        description="Payment confirmations, check-ins, and check-outs across your properties."
        action={
          unreadCount > 0 ? (
            <button
              onClick={() => markAllRead()}
              className="flex items-center gap-1.5 h-9 px-4 rounded-full text-xs lg:text-sm border transition-colors hover:bg-[#f2f0ed]"
              style={{ borderColor: "#e8e6e3", color: "#17191c" }}
            >
              <CheckCheck size={13} />
              Mark all read
            </button>
          ) : undefined
        }
      />

      <div className="border rounded-xl overflow-hidden" style={{ borderColor: "#e8e6e3" }}>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b" style={{ borderColor: "#e8e6e3" }}>
              <th className="px-5 py-3 text-left font-normal" style={{ color: "#a3a6af" }}>Type</th>
              <th className="px-5 py-3 text-left font-normal" style={{ color: "#a3a6af" }}>Title</th>
              <th className="px-5 py-3 text-left font-normal" style={{ color: "#a3a6af" }}>Details</th>
              <th className="px-5 py-3 text-left font-normal whitespace-nowrap" style={{ color: "#a3a6af" }}>Date</th>
              <th className="px-5 py-3" />
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
                const cfg = TYPE_CONFIG[n.type];
                return (
                  <tr
                    key={n.id}
                    onClick={() => !n.is_read && markRead(n.id)}
                    className="border-b last:border-0 cursor-pointer transition-colors hover:bg-[#fafaf9]"
                    style={{ borderColor: "#f2f0ed", backgroundColor: n.is_read ? "transparent" : "#f8f7ff" }}
                  >
                    <td className="px-5 py-3">
                      <span>
                          {cfg.label}
                        </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="bold" style={{ color: "#17191c" }}>{n.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 max-w-[420px] truncate" style={{ color: "#666" }}>{n.body}</td>
                    <td className="px-5 py-3 whitespace-nowrap" style={{ color: "#a3a6af" }}>{formatDateTime(n.created_at)}</td>
                    <td className="px-5 py-3" />
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
    </motion.div>
  );
}