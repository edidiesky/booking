import { useState } from "react";
import { useGetAdminCalendarQuery } from "@/redux/services/adminApi";
import type { Booking } from "@/types/api";

export function useAdminCalendar() {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

  const { data, isLoading } = useGetAdminCalendarQuery({ startDate, endDate });

  return {
    bookings: data?.data ?? [],
    isLoading,
    selectedBooking, setSelectedBooking,
  };
}