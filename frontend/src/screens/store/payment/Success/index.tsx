import { useEffect, useState }   from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle }           from "lucide-react";
import { useGetBookingByIdQuery } from "@/redux/services/bookingApi";

export default function PaymentSuccess() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    const fromQuery = searchParams.get("bookingId");
    if (fromQuery) { setBookingId(fromQuery); return; }
    const stored = sessionStorage.getItem("pending_booking_id");
    if (stored) setBookingId(stored);
  }, [searchParams]);

  const { data, isLoading } = useGetBookingByIdQuery(bookingId ?? "", { skip: !bookingId });
  const booking = data?.data;

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white border border-black/5 p-10 flex flex-col items-center gap-6 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
          <CheckCircle size={32} className="text-emerald-500" />
        </div>

        <div>
          <h1 className="text-xl  text-[#171717]">Payment Successful</h1>
          <p className="text-xs text-[#666] mt-2 leading-relaxed">
            Your booking is confirmed. You will receive a confirmation email shortly.
          </p>
        </div>

        {isLoading && (
          <div className="w-full bg-[#f4f3ee] p-4 flex flex-col gap-2">
            <div className="h-3 bg-[#e5e3e0] w-1/2" />
            <div className="h-3 bg-[#e5e3e0] w-1/3" />
          </div>
        )}

        {booking && !isLoading && (
          <div className="w-full bg-[#f4f3ee] p-4 text-left flex flex-col gap-2">
            <p className="text-xs text-[#888] uppercase ">Booking summary</p>
            <p className="text-xs  text-[#171717]">{booking.bookingRef}</p>
            <p className="text-xs text-[#666]">
              {booking.checkIn} - {booking.checkOut} ({booking.nights} night{booking.nights !== 1 ? "s" : ""})
            </p>
            <p className="text-xs  text-[#171717]">
              ₦{booking.totalAmountNgn.toLocaleString("en-NG")}
            </p>
            <span className="text-xs  px-2 py-0.5 bg-green-50 text-green-700 w-fit capitalize">
              {booking.status.replace("_", " ")}
            </span>
          </div>
        )}

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={() => {
              sessionStorage.removeItem("pending_booking_id");
              navigate("/trips");
            }}
            className="w-full rounded-full h-12 bg-[#171717] text-white text-xs  hover:opacity-90 transition-opacity"
          >
            View My Trips
          </button>
          <button
            onClick={() => navigate("/")}
            className="w-full rounded-full h-12 border border-black/10 text-xs  hover:bg-[#f4f3ee] transition-colors"
          >
            Browse More Properties
          </button>
        </div>
      </div>
    </div>
  );
}