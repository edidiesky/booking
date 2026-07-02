import { motion }       from "framer-motion";
import { X }            from "lucide-react";
import { useState }     from "react";
import { useCheckInMutation, useCheckOutMutation, useCancelBookingMutation } from "@/redux/services/bookingApi";
import { showToast }    from "@/components/common/Toast";
import { formatDate }   from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";
import type { Booking, BookingStatus } from "@/types/api";

const STATUS_CONFIG: Record<BookingStatus, { label: string; className: string }> = {
  pending_payment: { label: "Pending Payment", className: "bg-yellow-50 text-yellow-800" },
  confirmed:       { label: "Confirmed",       className: "bg-blue-50 text-blue-700"    },
  checked_in:      { label: "Checked In",      className: "bg-green-50 text-green-700"  },
  checked_out:     { label: "Checked Out",     className: "bg-[#f2f0ed] text-[#4c4c4c]"},
  cancelled:       { label: "Cancelled",       className: "bg-red-50 text-red-700"      },
  refunded:        { label: "Refunded",        className: "bg-purple-50 text-purple-700" },
};

interface Props {
  booking:  Booking;
  onClose:  () => void;
}

export default function BookingDrawer({ booking, onClose }: Props) {
  const [cancelReason, setCancelReason] = useState("");
  const [showCancel,   setShowCancel]   = useState(false);

  const [checkIn,  { isLoading: checkingIn  }] = useCheckInMutation();
  const [checkOut, { isLoading: checkingOut }] = useCheckOutMutation();
  const [cancel,   { isLoading: cancelling  }] = useCancelBookingMutation();

  const cfg = STATUS_CONFIG[booking.status];

  const handleCheckIn = async () => {
    try {
      await checkIn(booking.bookingId).unwrap();
      showToast("Guest checked in.", "success");
      onClose();
    } catch { /* errorMiddleware */ }
  };

  const handleCheckOut = async () => {
    try {
      await checkOut(booking.bookingId).unwrap();
      showToast("Guest checked out. Escrow released.", "success");
      onClose();
    } catch { /* errorMiddleware */ }
  };

  const handleCancel = async () => {
    try {
      await cancel({ id: booking.bookingId, body: { reason: cancelReason || undefined } }).unwrap();
      showToast("Booking cancelled.", "success");
      onClose();
    } catch { /* errorMiddleware */ }
  };

  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-end z-50">
      <motion.div
        initial={{ x: 480 }}
        animate={{ x: 0 }}
        exit={{ x: 480 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white w-full max-w-[480px] h-full flex flex-col overflow-hidden"
      >
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e6e3]">
          <div>
            <p className="text-sm  text-[#17191c]">Booking details</p>
            <p className="text-xs text-[#777b86] mt-0.5">{booking.bookingRef}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-[#f2f0ed] transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">

          <span className={`text-xs px-2 py-0.5 w-fit ${cfg.className}`}>
            {cfg.label}
          </span>

          {/* dates + amounts */}
          <div className="border border-[#e8e6e3]">
            <p className="px-4 py-3 text-xs text-[#a3a6af] uppercase tracking-widest border-b border-[#e8e6e3]">
              Reservation
            </p>
            {[
              { label: "Check-in",      value: formatDate(booking.checkIn)              },
              { label: "Check-out",     value: formatDate(booking.checkOut)             },
              { label: "Nights",        value: String(booking.nights)                   },
              { label: "Rooms",         value: String(booking.roomsCount)               },
              { label: "Guests",        value: String(booking.guestCount)               },
              { label: "Total",         value: formatCurrency(booking.totalAmountNgn)   },
              { label: "Platform fee",  value: formatCurrency(booking.platformFeeNgn)   },
              { label: "Host payout",   value: formatCurrency(booking.hostPayoutNgn)    },
            ].map(({ label, value }, i, arr) => (
              <div key={label}
                className={`px-4 py-3 flex items-center justify-between ${i < arr.length - 1 ? "border-b border-[#f2f0ed]" : ""}`}>
                <p className="text-xs text-[#777b86]">{label}</p>
                <p className="text-sm text-[#17191c]">{value}</p>
              </div>
            ))}
          </div>

          {/* actions */}
          <div className="flex flex-col gap-3">
            <p className="text-xs text-[#a3a6af] uppercase tracking-widest">Actions</p>

            {booking.status === "confirmed" && (
              <button
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="w-full h-10 bg-[#17191c] text-white text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {checkingIn ? "Checking in..." : "Check In Guest"}
              </button>
            )}

            {booking.status === "checked_in" && (
              <button
                onClick={handleCheckOut}
                disabled={checkingOut}
                className="w-full h-10 border border-[#17191c] text-[#17191c] text-sm hover:bg-[#f2f0ed] disabled:opacity-50 transition-colors"
              >
                {checkingOut ? "Checking out..." : "Check Out Guest"}
              </button>
            )}

            {(booking.status === "pending_payment" || booking.status === "confirmed") && (
              <button
                onClick={() => setShowCancel((v) => !v)}
                className="w-full h-10 border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors"
              >
                Cancel Booking
              </button>
            )}

            {showCancel && (
              <div className="flex flex-col gap-2">
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Reason for cancellation (optional)"
                  rows={3}
                  className="w-full border border-[#e8e6e3] px-3 py-2 text-sm outline-none resize-none focus:border-[#17191c] transition-colors"
                />
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="w-full h-9 bg-red-600 text-white text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {cancelling ? "Cancelling..." : "Confirm Cancellation"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* footer */}
        <div className="border-t border-[#e8e6e3] px-6 py-4 flex items-center justify-between">
          <button onClick={onClose} className="text-sm text-[#777b86] hover:text-[#17191c]">
            Close
          </button>
          <p className="text-xs text-[#a3a6af]">
            Created {formatDate(booking.createdAt)}
          </p>
        </div>
      </motion.div>
    </div>
  );
}