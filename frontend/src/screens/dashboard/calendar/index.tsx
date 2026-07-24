import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { CalendarDays, GanttChartSquare } from "lucide-react";
import BookingDrawer from "@/screens/dashboard/Bookings/BookingDrawer";
import { useGetTenantBookingsQuery } from "@/redux/services/bookingApi";
import type { Booking } from "@/types/api";
import BookingGantt from "@/components/dashboard/common/gant/BookingGantt";
import Title from "@/components/dashboard/common/Title";

type View = "month" | "timeline";

export default function DashboardCalendar() {
  const { data, isLoading } = useGetTenantBookingsQuery({
    page: 1,
    limit: 100,
  });
  const bookings = data?.data ?? [];
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [view, setView] = useState<View>("timeline");

  return (
    <div className="w-full p-4 py-8 lg:p-12 flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <Title
          title={`Reservation Calendar`}
          description="View all reserved rooms across your property bookings."
        />
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setView("month")}
            className="flex items-center gap-1.5 h-8 px-3 rounded-full text-xs bold transition-colors"
            style={{
              backgroundColor:
                view === "month" ? "var(--color-ink)" : "transparent",
              color:
                view === "month"
                  ? "var(--color-canvas)"
                  : "var(--color-muted-stone)",
              border: view === "month" ? "none" : "1px solid #e8e6e3",
            }}
          >
            <CalendarDays size={13} />
            Month
          </button>
          <button
            onClick={() => setView("timeline")}
            className="flex items-center gap-1.5 h-8 px-3 rounded-full text-xs bold transition-colors"
            style={{
              backgroundColor:
                view === "timeline" ? "var(--color-ink)" : "transparent",
              color:
                view === "timeline"
                  ? "var(--color-canvas)"
                  : "var(--color-muted-stone)",
              border: view === "timeline" ? "none" : "1px solid #e8e6e3",
            }}
          >
            <GanttChartSquare size={13} />
            Timeline
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-96 rounded-xl animate-pulse bg-[#f2f0ed]" />
      ) : <BookingGantt
          bookings={bookings}
          onSelectBooking={setSelectedBooking}
        />}

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
