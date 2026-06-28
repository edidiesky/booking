import { motion }           from "framer-motion";
import { ArrowLeft }        from "lucide-react";
import Header               from "@/components/common/Header";
import Footer               from "@/components/common/Footer";
import BookingDetailCard    from "./BookingDetailCard";
import PaymentSection       from "./PaymentSection";
import { useBookingDetail } from "./hooks/useBookingDetail";

export default function BookingDetail() {
  const { booking, payment, isLoading, paying, handlePay, goBack } = useBookingDetail();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col min-h-screen"
    >
      <Header />
      <main className="flex-1">
        <div className="mx-auto px-6 lg:px-8 py-10" style={{ maxWidth: "760px" }}>
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-sm mb-6 transition-opacity hover:opacity-60"
            style={{ color: "var(--color-muted-stone)" }}
          >
            <ArrowLeft size={16} /> My Trips
          </button>

          {isLoading || !booking ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-52 rounded-2xl animate-pulse"
                     style={{ backgroundColor: "#f2f0ed" }} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <BookingDetailCard booking={booking} />
              <PaymentSection
                booking={booking}
                payment={payment}
                onPay={handlePay}
                isPaying={paying}
              />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </motion.div>
  );
}