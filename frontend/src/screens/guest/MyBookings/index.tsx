import { motion }           from "framer-motion";
import { useSelector }      from "react-redux";
import { useDispatch }      from "react-redux";
import Header               from "@/components/common/Header";
import Footer               from "@/components/common/Footer";
import BookingCard          from "./BookingCard";
import CancelBookingModal   from "./CancelBookingModal";
import { useMyBookings }    from "./hooks/useMyBookings";
import { selectCurrentUser } from "@/redux/slices/authSlice";
import { selectModal, closeModal } from "@/redux/slices/modalSlice";

export default function MyBookings() {
  const dispatch    = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const cancelModal = useSelector(selectModal("cancelBooking"));

  const {
    bookings, isLoading, cancelling,
    search, setSearch,
    selected, handleCancelOpen, handleCancel,
  } = useMyBookings();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col min-h-screen"
    >
      <Header />

      <main className="flex-1">
        <div className="mx-auto px-6 lg:px-8 py-12" style={{ maxWidth: "900px" }}>
          <div className="flex flex-col gap-2 mb-8">
            <h1 className="text-2xl bold"
                style={{ color: "var(--color-ink)", letterSpacing: "-0.3px" }}>
              My Trips
            </h1>
            <p className="text-sm" style={{ color: "var(--color-light-steel)" }}>
              Welcome back, {currentUser?.firstName}. Here are your bookings.
            </p>
          </div>

          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by booking reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-xs h-9 px-3 text-sm border outline-none"
              style={{ borderColor: "#e8e6e3", color: "var(--color-ink)" }}
            />
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-36 rounded-2xl animate-pulse"
                     style={{ backgroundColor: "#f2f0ed" }} />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <p className="text-sm" style={{ color: "var(--color-hint-of-grey)" }}>
                {search ? `No bookings matching "${search}"` : "You have no bookings yet."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {bookings.map((b) => (
                <BookingCard key={b.bookingId} booking={b} onCancel={handleCancelOpen} />
              ))}
            </div>
          )}
        </div>
      </main>

      {cancelModal.open && selected && (
        <CancelBookingModal
          bookingRef={selected.bookingRef}
          isLoading={cancelling}
          onConfirm={handleCancel}
          onClose={() => dispatch(closeModal("cancelBooking"))}
        />
      )}

      <Footer />
    </motion.div>
  );
}