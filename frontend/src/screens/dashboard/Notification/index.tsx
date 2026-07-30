import { motion } from "framer-motion";
import { CreditCard, LogIn, LogOut, CheckCheck } from "lucide-react";
import Title from "@/components/dashboard/common/Title";
import { formatDate } from "@/utils/formatDate";
import {
  useListSellerNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from "@/redux/services/sellerNotificationApi";
import type { SellerNotificationType } from "@/types/api";

const TYPE_CONFIG: Record<SellerNotificationType, { icon: typeof CreditCard; color: string; bg: string; label: string }> = {
  booking_confirmed:   { icon: CreditCard, color: "#166534", bg: "#dcfce7", label: "Payment" },
  booking_checked_in:  { icon: LogIn,      color: "#1e40af", bg: "#dbeafe", label: "Check-in" },
  booking_checked_out: { icon: LogOut,     color: "#5b21b6", bg: "#ede9fe", label: "Check-out" },
};

export default function DashboardNotifications() {
  const { data, isLoading } = useListSellerNotificationsQuery({ page: 1 });
  const [markRead]    = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();

  const notifications = data?.data.notifications ?? [];
  const unreadCount = data?.data.unreadCount ?? 0;

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
              className="flex items-center gap-1.5 h-9 px-4 rounded-full text-xs border transition-colors hover:bg-[#f2f0ed]"
              style={{ borderColor: "#e8e6e3", color: "#17191c" }}
            >
              <CheckCheck size={13} />
              Mark all read
            </button>
          ) : undefined
        }
      />

      <div className="border rounded-xl overflow-hidden" style={{ borderColor: "#e8e6e3" }}>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 border-b last:border-0 animate-pulse" style={{ borderColor: "#f2f0ed", backgroundColor: "#fafaf9" }} />
          ))
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-xs" style={{ color: "#a3a6af" }}>
            Nothing here yet.
          </div>
        ) : (
          notifications.map((n) => {
            const cfg = TYPE_CONFIG[n.type];
            const Icon = cfg.icon;
            return (
              <button
                key={n.id}
                onClick={() => !n.is_read && markRead(n.id)}
                className="w-full text-left px-5 py-4 border-b last:border-0 flex items-start gap-3 hover:bg-[#fafaf9] transition-colors"
                style={{ borderColor: "#f2f0ed", backgroundColor: n.is_read ? "transparent" : "#f8f7ff" }}
              >
                <span className="relative w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: cfg.bg }}>
                  <Icon size={16} style={{ color: cfg.color }} />
                  {!n.is_read && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ backgroundColor: "#dc2626" }} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs bold" style={{ color: "#17191c" }}>{n.title}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "#666" }}>{n.body}</p>
                  <p className="text-xs mt-1" style={{ color: "#a3a6af" }}>{formatDate(n.created_at)}</p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </motion.div>
  );
}