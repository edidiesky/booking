import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import BookingCalendarMonth from "./BookingCalendarMonth";
import BookingDrawer from "@/screens/dashboard/Bookings/BookingDrawer";
import { useGetTenantBookingsQuery } from "@/redux/services/bookingApi";
import type { Booking } from "@/types/api";

export default function DashboardCalendar() {
  const { data, isLoading } = useGetTenantBookingsQuery({ page: 1, limit: 100 });
  const bookings = data?.data ?? [];
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  return (
    <>
      {isLoading ? (
        <div className="h-96 rounded-xl animate-pulse bg-[#f2f0ed]" />
      ) : (
        <BookingCalendarMonth
          bookings={bookings}
          onSelectBooking={setSelectedBooking}
        />
      )}

      <AnimatePresence>
        {selectedBooking && (
          <BookingDrawer booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
        )}
      </AnimatePresence>
    </>
  );
}