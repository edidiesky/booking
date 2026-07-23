import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {  ChevronRight } from "lucide-react";
import { useGetBookingByIdQuery } from "@/redux/services/bookingApi";
import { formatDate } from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";
import LazyImage from "@/components/common/LazyImage";

const STEPS = [
  { key: "created",   label: "Booked" },
  { key: "confirmed", label: "Paid" },
  { key: "checked_in", label: "Check-in" },
] as const;

function currentStepIndex(status: string): number {
  if (status === "checked_in" || status === "checked_out") return 2;
  if (status === "confirmed") return 1;
  return 0;
}

export default function BookingSuccess() {
  const navigate = useNavigate();
  const { bookingId: routeId } = useParams<{ bookingId?: string }>();
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (routeId) { setBookingId(routeId); return; }
    const stored = sessionStorage.getItem("pending_booking_id");
    if (stored) setBookingId(stored);
  }, [routeId]);

  const { data, isLoading } = useGetBookingByIdQuery(bookingId ?? "", { skip: !bookingId });
  const booking = data?.data;
  const stepIdx = booking ? currentStepIndex(booking.status) : 0;

  return (
    <div className="min-h-screen bg-[#f7f7f8] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="max-w-screen-md w-full bg-white border border-[#e8e6e3] rounded-2xl p-8 flex flex-col gap-6"
      >
        <div className="flex flex-col items-center text-center gap-2">
          <h1 className="text-xl lg:text-3xl bold text-[#17191c] mt-2">Woohoo! Your booking is confirmed.</h1>
          {booking?.propertyName && (
            <p className="text-xs lg:text-xs text-[#777b86]">
              <span className="bold text-[#17191c]">{booking.propertyName}</span> will get everything ready. We'll notify you once it's confirmed.
            </p>
          )}
        </div>

        {!isLoading && booking && (
          <>
            {/* stepper */}
            <div className="flex items-center justify-between px-2">
              {STEPS.map((step, i) => (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1.5 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs lg:text-xs bold ${
                      i <= stepIdx ? "bg-[#17191c] text-white" : "border-2 border-[#e8e6e3] text-[#a3a6af]"
                    }`}>
                      {i < stepIdx ? "✓" : i + 1}
                    </div>
                    <span className={`text-xs lg:text-xs ${i <= stepIdx ? "text-[#17191c] bold" : "text-[#a3a6af]"}`}>{step.label}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 -mt-5 ${i < stepIdx ? "bg-[#17191c]" : "bg-[#e8e6e3]"}`} />}
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate(`/trips/${booking.bookingId}`)}
              className="w-full h-12 rounded-full border border-[#e8e6e3] text-xs lg:text-xs bold text-[#17191c] hover:bg-[#f2f0ed] transition-colors"
            >
              View your booking
            </button>

            {/* order details card */}
            <div className="border border-[#e8e6e3] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#e8e6e3]">
                <p className="text-xs lg:text-xs uppercase medium text-[#777b86]">Booking details</p>
                <p className="text-xs lg:text-xs bold mt-0.5">Confirmation: {booking.bookingRef}</p>
              </div>

              <div className="px-4 py-4 flex gap-3 border-b items-center border-[#f2f0ed]">
                <div className="w-32 h-32 rounded-lg overflow-hidden bg-[#f2f0ed] shrink-0">
                  {booking.roomTypeImage && <LazyImage src={booking.roomTypeImage} alt={booking.roomTypeName ?? ""} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm lg:text-lg bold text-[#17191c] truncate">{booking.propertyName}</p>
                  <p className="text-xs lg:text-xs text-[#777b86]">{booking.nights} night{booking.nights !== 1 ? "s" : ""} · {booking.guestCount} guest{booking.guestCount !== 1 ? "s" : ""}</p>
                </div>
                <p className="text-xs lg:text-sm bold text-[#17191c] whitespace-nowrap">{formatCurrency(booking.totalAmountNgn)}</p>
              </div>

              <div className="px-4 py-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs lg:text-xs uppercase text-[#a3a6af] bold mb-1">Check-in</p>
                  <p className="text-xs lg:text-xs bold text-[#17191c]">{formatDate(booking.checkIn)}</p>
                </div>
                <div>
                  <p className="text-xs lg:text-xs uppercase text-[#a3a6af] bold mb-1">Check-out</p>
                  <p className="text-xs lg:text-xs bold text-[#17191c]">{formatDate(booking.checkOut)}</p>
                </div>
              </div>

              <div className="px-4 py-3 bg-[#f7f7f8] flex items-center justify-between">
                <span className="text-xs lg:text-xs bold text-[#17191c]">Total (1 booking)</span>
                <span className="text-xs lg:text-xs bold text-[#17191c]">{formatCurrency(booking.totalAmountNgn)}</span>
              </div>
            </div>

            {booking.receiptUrl && (
              <a href={booking.receiptUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-center underline underline-offset-4 text-[#777b86] hover:text-[#17191c] transition-colors">
                View receipt
              </a>
            )}

            {/* property/host mini-card, links to seller profile once item 3 exists */}
            {booking.propertyName && (
              <button
                onClick={() => navigate(`/properties/${booking.propertyId}`)}
                className="border border-[#e8e6e3] rounded-xl p-4 flex items-center justify-between hover:bg-[#f7f7f8] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#17191c] text-white flex items-center justify-center text-xs bold shrink-0">
                    {booking.propertyName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs lg:text-sm bold text-[#17191c]">{booking.propertyName}</p>
                    <p className="text-xs lg:text-xs text-[#a3a6af]">{booking.propertyCity}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[#a3a6af]" />
              </button>
            )}
          </>
        )}

        <button
          onClick={() => { sessionStorage.removeItem("pending_booking_id"); navigate("/"); }}
          className="w-full h-14 rounded-full bg-[#17191c] text-white text-xs lg:text-xs bold hover:opacity-90 transition-opacity"
        >
          Continue browsing
        </button>
      </motion.div>
    </div>
  );
}