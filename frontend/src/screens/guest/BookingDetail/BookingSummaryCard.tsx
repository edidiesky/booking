import { formatCurrency } from "@/utils/formatCurrency";
import type { Booking }    from "@/types/api";

interface Props {
  booking:   Booking | null;
  isLoading: boolean;
}

function Skeleton() {
  return (
    <div className="w-full rounded-xl bg-white border overflow-hidden flex flex-col animate-pulse">
      <div className="w-full h-[260px] bg-[#f2f0ed]" />
      <div className="p-8 flex flex-col gap-3">
        <div className="h-4 w-1/3 bg-[#f2f0ed] rounded" />
        <div className="h-6 w-2/3 bg-[#f2f0ed] rounded" />
        <div className="h-4 w-1/2 bg-[#f2f0ed] rounded" />
      </div>
    </div>
  );
}

export default function BookingSummaryCard({ booking, isLoading }: Props) {
  if (isLoading || !booking) return <Skeleton />;

  const checkInLabel  = new Date(booking.checkIn).toLocaleDateString("en-NG",  { month: "long", day: "numeric" });
  const checkOutLabel = new Date(booking.checkOut).toLocaleDateString("en-NG", { month: "long", day: "numeric" });

  return (
    <div className="rounded-xl bg-white border overflow-hidden flex flex-col w-full">
      {booking.roomTypeImage && (
        <img
          alt={booking.propertyName ?? "Room"}
          loading="lazy"
          src={booking.roomTypeImage}
          className="object-cover w-full h-[300px]"
        />
      )}

      <div className="w-full flex flex-col gap-2">
        <div className="flex p-8 pb-6 border-b-4 flex-col w-full gap-2">
          <span className="text-xs bold text-[#4c4c4c]">
            {booking.roomsCount} room{booking.roomsCount !== 1 ? "s" : ""} | {booking.guestCount} guest{booking.guestCount !== 1 ? "s" : ""}
          </span>
          <h1 className="text-xl w-full text-[#17191c]">
            {booking.bookingRef}
          </h1>

          <div className="py-3 flex items-center justify-between w-full">
            <div className="flex flex-col gap-2">
              <span className="text-xs bold text-[#17191c]">Dates</span>
              <span className="text-xs text-[#4c4c4c]">{checkInLabel} - {checkOutLabel}</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs bold text-[#17191c]">Guests</span>
              <span className="text-xs text-[#4c4c4c]">{booking.guestCount} guest{booking.guestCount !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>

        <div className="w-full flex p-4 pb-6 px-8 border-b-4 flex-col gap-2">
          <div className="w-full text-xs bold flex items-center justify-between text-[#17191c]">
            <span>{booking.nights} night{booking.nights !== 1 ? "s" : ""}</span>
            <span>{formatCurrency(booking.totalAmountNgn - booking.platformFeeNgn)}</span>
          </div>
          <div className="w-full text-xs pb-4 bold flex items-center justify-between text-[#17191c]">
            <span>Platform fee</span>
            <span>{formatCurrency(booking.platformFeeNgn)}</span>
          </div>
          <div className="w-full text-xs bold pt-4 border-t flex items-center justify-between text-[#17191c]">
            <span>Total</span>
            <span>{formatCurrency(booking.totalAmountNgn)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}