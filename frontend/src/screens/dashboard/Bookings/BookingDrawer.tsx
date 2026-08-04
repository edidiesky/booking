import { motion } from "framer-motion";
import { X } from "lucide-react";
import { formatDate, formatDateTime } from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";
import type { Booking, BookingStatus } from "@/types/api";
import LazyImage from "@/components/common/LazyImage";
import { useTransitionBookingStatusMutation } from "@/redux/services/bookingApi";
import { showToast } from "@/components/common/Toast";

const STATUS_CFG: Record<BookingStatus, { label: string; className: string }> =
  {
    pending_payment: {
      label: "Pending Payment",
      className: "bg-yellow-50 text-yellow-800",
    },
    confirmed: { label: "Confirmed", className: "bg-blue-50 text-blue-700" },
    checked_in: {
      label: "Checked In",
      className: "bg-green-50 text-green-700",
    },
    checked_out: {
      label: "Checked Out",
      className: "bg-[#f2f0ed] text-[#4c4c4c]",
    },
    cancelled: { label: "Cancelled", className: "bg-red-50 text-red-700" },
    refunded: { label: "Refunded", className: "bg-purple-50 text-purple-700" },
  };

const TIMELINE_STEPS = [
  {
    key: "placed",
    label: "Booking placed",
    description: "Guest reserved the room type",
  },
  {
    key: "confirmed",
    label: "Payment confirmed",
    description: "Payment verified, room secured",
  },
  {
    key: "checked_in",
    label: "Checked in",
    description: "Guest arrived and checked in",
  },
  {
    key: "checked_out",
    label: "Checked out",
    description: "Stay completed, escrow released",
  },
];

const NEXT_STATES: Record<BookingStatus, BookingStatus[]> = {
  pending_payment: ["confirmed", "cancelled"],
  confirmed: ["checked_in", "cancelled"],
  checked_in: ["checked_out"],
  checked_out: [],
  cancelled: [],
  refunded: [],
};

function stepIndex(status: BookingStatus): number {
  if (status === "checked_out") return 3;
  if (status === "checked_in") return 2;
  if (status === "confirmed") return 1;
  return 0;
}

interface Props {
  booking: Booking;
  onClose: () => void;
}

export default function BookingDrawer({ booking, onClose }: Props) {
  const cfg = STATUS_CFG[booking.status];
  const idx = stepIndex(booking.status);
  const isTerminal =
    booking.status === "cancelled" || booking.status === "refunded";
  const nights = Math.round(
    (new Date(booking.checkOut).getTime() -
      new Date(booking.checkIn).getTime()) /
      86_400_000,
  );
  const [transitionStatus, { isLoading: isTransitioning }] =
    useTransitionBookingStatusMutation();
  const handleTransition = async (target: BookingStatus) => {
    try {
      await transitionStatus({
        id: booking.bookingId,
        status: target,
      }).unwrap();
      showToast(`Booking moved to ${STATUS_CFG[target].label}.`, "success");
    onClose();
    } catch {
      /* errorMiddleware surfaces the server's rejection message */
    }
  };
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-base p-4 flex items-center justify-end z-50">
      <motion.div
        initial={{ x: 400 }}
        animate={{ x: 0 }}
        exit={{ x: 400 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white w-full rounded-2xl overflow-hidden relative flex flex-col lg:w-[750px] h-[95vh]"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e6e3]">
          <div>
            <p className="text-xs bold text-[#17191c]">Booking details</p>
            <p className="text-xs text-[#777b86] mt-0.5">
              {booking.bookingRef}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-[#f2f0ed] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 flex overflow-y-auto flex-col gap-2">
          <div className="w-full px-6 py-5 border-b flex flex-col gap-4">
            <p className="text-xs uppercase text-[#a3a6af] bold">Room</p>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#f2f0ed] shrink-0">
                {(booking.roomTypeImage?.[0] ?? booking.roomTypeImage) ? (
                  <LazyImage
                    src={booking.roomTypeImage}
                    alt={booking.roomTypeName}
                  />
                ) : null}
              </div>
              <div className="flex-1 min-w-0 flex-col flex gap-1">
                <p className="text-sm lg:text-sm bold text-[#17191c] truncate">
                  {booking.propertyName}
                </p>
                <p className="text-xs lg:text-xs text-[#777b86] truncate">
                  {booking.roomTypeName}
                </p>
                <p className="text-xs text-[#777b86]">
                  {nights} night{nights !== 1 ? "s" : ""}
                </p>
              </div>
              <p className="text-xs bold text-[#17191c] whitespace-nowrap">
                {formatCurrency(Number(booking.totalAmountNgn))}
              </p>
            </div>
          </div>
          <div className="w-full px-6 py-5 border-b flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:gap-4 lg:w-[75%]">
              {[
                ["Created at", formatDateTime(booking.createdAt)],
                ["Check-in", formatDate(booking.checkIn)],
                ["Status", cfg.label],
                ["Check-out", formatDate(booking.checkOut)],
                ["Nights", String(booking.nights)],
                ["Rooms", String(booking.roomsCount)],
                ["Guests", String(booking.guestCount)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex w-full items-center gap-8 lg:gap-10"
                >
                  <span className="text-xs bold flex-1 text-[#777b86]">
                    {label}
                  </span>
                  <span className="text-xs text-end flex-1 text-[#17191c] bold">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full px-6 py-5 border-b flex flex-col gap-4">
            <p className="w-full text-xs text-[#a3a6af] uppercase">
              Customer breakdown
            </p>
            {[
              ["Customer First Name", booking?.guestFirstName],
              ["Customer Last Name", booking?.guestLastName],
              ["Customer Id", booking?.guestUserId],
            ].map(([label, value]) => (
              <div
                key={label}
                className={`w-full flex items-center gap-8 lg:gap-10`}
              >
                <p className="text-xs medium text-[#777b86]">{label}</p>
                <p className="text-xs text-[#17191c] bold">{value}</p>
              </div>
            ))}
          </div>

          <div className="px-6 py-5 border-b flex flex-col gap-4">
            <p className="w-full text-xs text-[#a3a6af] uppercase">
              Payment breakdown
            </p>
            {[
              ["Total amount", formatCurrency(booking.totalAmountNgn)],
              ["Platform fee", formatCurrency(booking.platformFeeNgn)],
              ["Host payout", formatCurrency(booking.hostPayoutNgn)],
            ].map(([label, value]) => (
              <div
                key={label}
                className={`w-full flex items-center gap-8 lg:gap-10`}
              >
                <p className="text-xs bold text-[#777b86]">{label}</p>
                <p className="text-xs text-[#17191c] bold">{value}</p>
              </div>
            ))}
          </div>
          <div className="px-6 py-5 border-b flex flex-col gap-4">
            {!isTerminal && (
              <div className="flex flex-col gap-4">
                <p className="text-xs text-[#a3a6af] uppercase bold">
                  Timeline
                </p>
                <div className="flex flex-col gap-4">
                  {TIMELINE_STEPS.map((step, i) => (
                    <div key={step.key} className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${i <= idx ? "bg-[#17191c]" : "bg-[#e8e6e3]"}`}
                      />
                      <div>
                        <p
                          className={`text-xs bold ${i <= idx ? "text-[#17191c]" : "text-[#a3a6af]"}`}
                        >
                          {step.label}
                        </p>
                        <p className="text-xs text-[#a3a6af]">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-[#e8e6e3] px-6 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs  text-[#777b86] bold hover:text-[#17191c]"
          >
            Cancel
          </button>
          <div className="flex items-center lg:justify-end gap-2">
            {booking.receiptUrl && (
              <button
                onClick={() =>
                  window.open(
                    booking.receiptUrl!,
                    "_blank",
                    "noopener,noreferrer",
                  )
                }
                className="text-xs bold text-[#fff] bg-black rounded-full px-4 py-2"
              >
                View receipt
              </button>
            )}
            {NEXT_STATES[booking.status].length > 0 && (
              <div className="flex items-center gap-2">
                {NEXT_STATES[booking.status].map((target) => (
                  <button
                    key={target}
                    onClick={() => handleTransition(target)}
                    disabled={isTransitioning}
                    className="text-xs bold text-dark border-[#17191c] border rounded-full px-4 h-8 hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {isTransitioning
                      ? "Moving..."
                      : `Move to ${STATUS_CFG[target].label}`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
