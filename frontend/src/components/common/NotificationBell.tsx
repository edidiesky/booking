import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Bell, MoreVertical, CreditCard, LogIn, LogOut } from "lucide-react";
import {
  useListSellerNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from "@/redux/services/sellerNotificationApi";
import { useSellerNotificationStream } from "@/hooks/useSellerNotificationStream";
import type { SellerNotification, SellerNotificationType } from "@/types/api";
import moment from "moment";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/redux/slices/authSlice";

const TYPE_CONFIG: Record<SellerNotificationType, { icon: typeof CreditCard; color: string; bg: string }> = {
  booking_confirmed:   { icon: CreditCard, color: "#166534", bg: "#dcfce7" },
  booking_checked_in:  { icon: LogIn,      color: "#1e40af", bg: "#dbeafe" },
  booking_checked_out: { icon: LogOut,     color: "#5b21b6", bg: "#ede9fe" },
};

const TABS: { key: SellerNotificationType | "all"; label: string }[] = [
  { key: "all",                  label: "View All" },
  { key: "booking_confirmed",    label: "Payments" },
  { key: "booking_checked_in",   label: "Check-ins" },
  { key: "booking_checked_out",  label: "Check-outs" },
];

export default function NotificationBell() {
  const currentUser = useSelector(selectCurrentUser);
  const isPlatformAdmin = currentUser?.userType === "platform:admin";

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SellerNotificationType | "all">("all");
  const [liveExtras, setLiveExtras] = useState<SellerNotification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  // Tenant-scoped, skip entirely for platform admins, they have no
  // tenantId and this endpoint 400s for exactly that reason, correctly.
  const { data, isLoading } = useListSellerNotificationsQuery(
    { page: 1 },
    { skip: isPlatformAdmin },
  );
  const [markRead]    = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();

  const handleLiveNotification = useCallback((n: SellerNotification) => {
    setLiveExtras((prev) => [n, ...prev.filter((x) => x.id !== n.id)]);
  }, []);
  useSellerNotificationStream(isPlatformAdmin ? undefined : handleLiveNotification);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetched = data?.data.notifications ?? [];
  const allNotifications = [...liveExtras, ...fetched.filter((f) => !liveExtras.some((l) => l.id === f.id))];
  const unreadCount = (data?.data.unreadCount ?? 0) + liveExtras.filter((n) => !n.is_read && !fetched.some((f) => f.id === n.id)).length;

  const visible = useMemo(
    () => (activeTab === "all" ? allNotifications : allNotifications.filter((n) => n.type === activeTab)),
    [allNotifications, activeTab],
  );

  const handleItemClick = async (n: SellerNotification) => {
    if (!n.is_read) {
      setLiveExtras((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      try { await markRead(n.id).unwrap(); } catch { /* errorMiddleware */ }
    }
  };

  const handleMarkAllRead = async () => {
    setLiveExtras((prev) => prev.map((x) => ({ ...x, is_read: true })));
    try { await markAllRead().unwrap(); } catch { /* errorMiddleware */ }
  };

  if (isPlatformAdmin) {
    return (
      <Link
        to="/admin/notifications"
        className="relative w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:opacity-70 outline-none"
        style={{ color: "var(--color-muted-stone)" }}
        title="Notifications"
      >
        <Bell size={16} />
      </Link>
    );
  }


  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:opacity-70 outline-none"
        style={{ color: "var(--color-muted-stone)" }}
        title="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[9px] bold"
            style={{ backgroundColor: "#dc2626", color: "#fff" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute top-full right-0 mt-2 z-30 bg-white border rounded-2xl shadow-xl flex gap-2 flex-col overflow-hidden"
          style={{ borderColor: "#e8e6e3", width: 380, maxHeight: 520 }}
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <p className="text-xs lg:text-[13px]   " style={{ color: "#17191c" }}>Notifications</p>
            <button
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              title="Mark all as read"
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#f2f0ed] disabled:opacity-30 transition-colors"
              style={{ color: "#777b86" }}
            >
              <MoreVertical size={16} />
            </button>
          </div>

          <div className="flex items-center gap-1 px-5 py-2 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className="shrink-0 h-11 px-3 rounded-full text-xs lg:text-[11px] transition-colors"
                style={{
                  backgroundColor: activeTab === t.key ? "#f2f0ed" : "transparent",
                  color: activeTab === t.key ? "#17191c" : "#a3a6af",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-xs" style={{ color: "#a3a6af" }}>Loading...</div>
            ) : visible.length === 0 ? (
              <div className="p-8 text-center text-xs" style={{ color: "#a3a6af" }}>Nothing here yet.</div>
            ) : (
              visible.map((n) => {
                const cfg = TYPE_CONFIG[n.type];
                const Icon = cfg.icon;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className="w-full text-left px-5 py-3.5 border-b last:border-0 flex items-start gap-3 hover:bg-[#fafaf9] transition-colors"
                    style={{ borderColor: "#f2f0ed" }}
                  >
                    <span
                      className="relative w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: cfg.bg }}
                    >
                      <Icon size={16} style={{ color: cfg.color }} />
                      {!n.is_read && (
                        <span
                          className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white"
                          style={{ backgroundColor: "#dc2626" }}
                        />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs lg:text-[13px]   " style={{ color: "#17191c" }}>{n.title}</p>
                      <p className="text-xs lg:text-[13px]   mt-0.5 line-clamp-2" style={{ color: "#666" }}>{n.body}</p>
                      <p className="text-xs lg:text-[13px]   mt-1" style={{ color: "#a3a6af" }}>{moment(n.created_at).format("DD MMM YYYY")}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="border-t px-5 py-3 text-center" style={{ borderColor: "#f2f0ed" }}>
            <Link
              to="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="text-xs lg:text-[13px]   "
              style={{ color: "#3b82f6" }}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}