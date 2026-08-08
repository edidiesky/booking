import { useState } from "react";
import { useListAdminNotificationsQuery } from "@/redux/services/adminApi";
import {
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from "@/redux/services/sellerNotificationApi";
export function useAdminNotifications() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useListAdminNotificationsQuery({ page, limit: 30 });
  const [markRead]    = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();
  const unreadCount   = data?.data.unreadCount ?? 0;
  const totalPages    = data?.data.totalPages ?? 1;
  return {
    notifications: data?.data.notifications ?? [],
    isLoading, isFetching,
    page, setPage,totalPages, unreadCount, markRead, markAllRead
  };
}