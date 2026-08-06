import { useRef }            from "react";
import { motion, useInView } from "framer-motion";
import Header                from "@/components/common/Header";
import Footer                from "@/components/common/Footer";
import BookingSummaryCard    from "./BookingSummaryCard";
import PaymentCTA            from "./PaymentCTA";
import { useBookingPayment } from "./hooks/useBookingPayment";
import { BiCheck } from "react-icons/bi";

const CHECKLIST = [
  "Take advantage of our serene environment to relax in comfort and luxury.",
  "Book with us to get the best rates available. Get immediate confirmation of your booking.",
  "24/7 housekeeping is included with every stay.",
];

export default function BookingPayment() {
  const { booking, isLoading, handlePay, paying } = useBookingPayment();

  const headingRef = useRef(null);
  const inView = useInView(headingRef, { margin: "0px 100px -50px 0px", once: true });

  return (
    <div className="bg-white flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 py-12 lg:py-20">
        <div className="w-[90%] xl:w-[70%] mx-auto max-w-[1100px]">
          <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 lg:gap-16">

            <div className="flex flex-col gap-8 w-full">
              <motion.h2
                ref={headingRef}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4 }}
                className="text-3xl lg:text-5xl bold leading-tight text-[#17191c]"
              >
                Almost there!
              </motion.h2>

              <ul className="flex flex-col gap-4 pb-4 border-b border-[#e8e6e3]">
                <li className="text-xs lg:text-sm lg:text-smtext-[#4c4c4c]">
                  One more step to complete your booking. Our payment platform ensures your payment details are safe and secured.
                </li>
              </ul>

              <div className="flex flex-col gap-4">
                <h3 className="text-xl lg:text-3xl bold text-[#17191c]">
                  Complete your booking seamlessly
                </h3>
                <ul className="flex flex-col gap-4 pb-8 border-b border-[#e8e6e3]">
                  {CHECKLIST.map((item) => (
                    <li key={item} className="text-xs lg:text-smflex items-start gap-2 text-[#4c4c4c]">
                      <BiCheck size={20} className="shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <PaymentCTA
                onPay={handlePay}
                isPaying={paying}
                disabled={!booking || booking.status !== "pending_payment"}
              />
            </div>

            <div className="w-full lg:sticky top-[10%] flex flex-col gap-16">
              <BookingSummaryCard booking={booking} isLoading={isLoading} />
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}