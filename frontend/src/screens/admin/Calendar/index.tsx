import { AnimatePresence } from "framer-motion";
import BookingTimeline from "../Bookings/BookingTimeline";
import AdminBookingDrawer from "../Bookings/AdminBookingDrawer";
import { useAdminCalendar } from "./hooks/useAdminCalendar";
import Title from "@/components/dashboard/common/Title";

export default function AdminCalendar() {
  const { bookings, isLoading, selectedBooking, setSelectedBooking } =
    useAdminCalendar();

  return (
    <div className="flex flex-col gap-6">
      <Title
        title={`Calendar`}
        description="Platform-wide activity across every seller, every property, every booking."
      />
      <BookingTimeline
        bookings={bookings}
        isLoading={isLoading}
        onSelectBooking={setSelectedBooking}
      />
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
