import { useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { CalendarDays, GanttChartSquare } from "lucide-react";
import BookingCalendarMonth from "./BookingCalendarMonth";
import BookingDrawer from "@/screens/dashboard/Bookings/BookingDrawer";
import { useGetTenantBookingsQuery } from "@/redux/services/bookingApi";
import { useGetMyPropertiesQuery } from "@/redux/services/propertyApi";
import type { Booking } from "@/types/api";
import BookingGantt from "@/components/dashboard/common/gant/BookingGantt";

type View = "month" | "timeline";

export default function DashboardCalendar() {
  const { data, isLoading } = useGetTenantBookingsQuery({ page: 1, limit: 100 });
  const bookings = data?.data ?? [];
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [view, setView] = useState<View>("month");

  // Timeline view now needs one specific property (gantt_max_visible_rooms
  // and room_sort_mode are per-property settings), the old Gantt showed
  // all of a tenant's room types in one flat view regardless of property,
  // that's no longer possible once those settings are property-scoped.
  const { data: propertiesData } = useGetMyPropertiesQuery({ page: 1, limit: 50 });
  const properties = propertiesData?.data ?? [];
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const selectedProperty = useMemo(
    () => properties.find((p) => p.id === selectedPropertyId) ?? properties[0],
    [properties, selectedPropertyId],
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("month")}
            className="flex items-center gap-1.5 h-8 px-3 rounded-full text-xs bold transition-colors"
            style={{
              backgroundColor: view === "month" ? "var(--color-ink)" : "transparent",
              color: view === "month" ? "var(--color-canvas)" : "var(--color-muted-stone)",
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
              backgroundColor: view === "timeline" ? "var(--color-ink)" : "transparent",
              color: view === "timeline" ? "var(--color-canvas)" : "var(--color-muted-stone)",
              border: view === "timeline" ? "none" : "1px solid #e8e6e3",
            }}
          >
            <GanttChartSquare size={13} />
            Timeline
          </button>
        </div>

        {view === "timeline" && properties.length > 0 && (
          <select
            value={selectedProperty?.id ?? ""}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="h-8 px-3 text-xs border rounded-full outline-none"
            style={{ borderColor: "#e8e6e3", color: "#17191c" }}
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
      </div>

      {isLoading ? (
        <div className="h-96 rounded-xl animate-pulse bg-[#f2f0ed]" />
      ) : view === "month" ? (
        <BookingCalendarMonth
          bookings={bookings}
          onSelectBooking={setSelectedBooking}
        />
      ) : selectedProperty ? (
        <BookingGantt
          property={selectedProperty}
          onSelectBooking={(bookingId) => {
            const booking = bookings.find((b) => b.bookingId === bookingId);
            if (booking) setSelectedBooking(booking);
          }}
        />
      ) : (
        <div className="h-96 rounded-xl flex items-center justify-center text-xs" style={{ backgroundColor: "#f2f0ed", color: "#a3a6af" }}>
          Add a property to see its timeline.
        </div>
      )}

      <AnimatePresence>
        {selectedBooking && (
          <BookingDrawer booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
        )}
      </AnimatePresence>
    </>
  );
}