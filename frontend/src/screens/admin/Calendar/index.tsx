import { AnimatePresence } from "framer-motion";
import AdminBookingDrawer from "../Bookings/AdminBookingDrawer";
import { useAdminCalendar } from "./hooks/useAdminCalendar";
import Title from "@/components/dashboard/common/Title";
import AdminBookingGantt from "./AdminBookingGantt";
export default function AdminCalendar() {
  const { bookings, isLoading, selectedBooking, setSelectedBooking } =
    useAdminCalendar();

  return (
    <div className="w-full p-4 py-8 lg:p-12 flex flex-col gap-8">
      <Title
        title={`Calendar`}
        description="Platform-wide activity across every seller, every property, every booking."
      />

      {isLoading ? (
        <div className="h-96 rounded-xl animate-pulse bg-[#f2f0ed]" />
      ) : (
        <AdminBookingGantt
          onSelectBooking={(bookingId) => {
            const booking = bookings.find((b) => b.bookingId === bookingId);
            if (booking) setSelectedBooking(booking);
          }}
        />
      )}
      <AnimatePresence>
        {selectedBooking && (
          <AdminBookingDrawer
            booking={selectedBooking as never}
            onClose={() => setSelectedBooking(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
