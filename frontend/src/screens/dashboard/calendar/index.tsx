import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import BookingDrawer from "@/screens/dashboard/Bookings/BookingDrawer";
import { useGetTenantBookingsQuery } from "@/redux/services/bookingApi";
import type { Booking } from "@/types/api";
import BookingGantt from "@/components/dashboard/common/gant/BookingGantt";
import Title from "@/components/dashboard/common/Title";
import BookingCalendarMonth from "./BookingCalendarMonth";

export default function DashboardCalendar() {
  const { data } = useGetTenantBookingsQuery({
    page: 1,
    limit: 100,
  });
  const bookings = data?.data ?? [];
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [view, setView] = useState<"month" | "gantt">("month");
  return (
    <div className="w-full p-4 py-8 lg:p-12 flex flex-col gap-8">
      <div className="w-full">
        <div className="flex items-start justify-between gap-4">
          <Title
            title={`Reservation Calendar`}
            description="View all reserved rooms across your property bookings."
          />
          <div className="flex gap-1 p-1 rounded-full bg-[#f2f0ed] w-fit">
            <button
              type="button"
              onClick={() => setView("month")}
              className={"flex p-3 text-sm rounded-full border bg-gray-300"}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setView("gantt")}
              className={"flex p-3 text-sm rounded-full border bg-dark"}
            >
              Timeline
            </button>
          </div>
        </div>
      </div>

      {view === "month" ? (
        <BookingCalendarMonth
          bookings={bookings}
          onSelectBooking={setSelectedBooking}
        />
      ) : (
        <BookingGantt
          onSelectBooking={(bookingId) => {
            const booking = bookings.find((b) => b.bookingId === bookingId);
            if (booking) setSelectedBooking(booking);
          }}
        />
      )}

      <AnimatePresence>
        {selectedBooking && (
          <BookingDrawer
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
