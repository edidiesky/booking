import { motion }           from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import { Link }             from "react-router-dom";
import Header               from "@/components/common/Header";
import Footer                from "@/components/common/Footer";
import BookingCard           from "./BookingCard";
import CancelBookingModal    from "./CancelBookingModal";
import { useMyBookings }     from "./hooks/useMyBookings";
import { selectModal, closeModal } from "@/redux/slices/modalSlice";
import { Input } from "@/components/ui/input";

function CardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl animate-pulse bg-[#f2f0ed]" style={{ aspectRatio: "4/5" }} />
      <div className="h-4 w-3/4 rounded animate-pulse bg-[#f2f0ed]" />
      <div className="h-3 w-1/2 rounded animate-pulse bg-[#f2f0ed]" />
    </div>
  );
}

export default function MyBookings() {
  const dispatch    = useDispatch();
  const cancelModal = useSelector(selectModal("cancelBooking"));

  const {
    bookings, isLoading, cancelling,
    search, setSearch,
    selected, handleCancelOpen, handleCancel,
  } = useMyBookings();

  const hasBookings = bookings.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col min-h-screen"
    >
      <Header />

      <main className="flex-1 py-20 pb-12">
        <div className="max-w-screen-xl mx-auto flex flex-col gap-12">

          {hasBookings && (
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-3xl flex-1 md:text-3xl bold text-[#17191c]">
                My Reservations
                <span className="block pt-3 font-normal text-xs md:text-sm text-[#4c4c4c]">
                  Here is your list of booked stays.
                </span>
              </h3>
              <div className=" flex items-end justify-end">
                <Input
                type="text"
                placeholder="Search by reference..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-[400px] h-9 px-3 text-xs border border-[#e8e6e3] outline-none rounded-lg"
              />
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="w-full gap-8 grid md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : !hasBookings ? (
            <div className="w-full flex flex-col gap-4 justify-center items-center py-12">
              <div className="w-[120px] h-[120px] rounded-full bg-[#f2f0ed] flex items-center justify-center">
                <span className="text-4xl">📭</span>
              </div>
              <div className="flex flex-col w-full gap-3 justify-center items-center">
                <h1 className="text-[#17191c] leading-tight text-xl md:text-xl text-center ">
                  You have no reserved stays yet
                </h1>
                <Link
                  to="/properties"
                  className="text-xs md:text-xs font-normal pb-1 pt-3 w-fit border-b border-[#17191c] uppercase tracking-wider text-[#17191c]"
                >
                  Visit our properties collection
                </Link>
              </div>
            </div>
          ) : (
            <div className="w-full gap-8 grid md:grid-cols-2 lg:grid-cols-3">
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
          isOpen={cancelModal.open}
          onConfirm={handleCancel}
          onClose={() => dispatch(closeModal("cancelBooking"))}
        />
      )}

      <Footer />
    </motion.div>
  );
}