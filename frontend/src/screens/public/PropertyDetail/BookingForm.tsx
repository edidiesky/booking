import { useState } from "react";
import { DateRange } from "react-date-range";
import type { RangeKeyDict } from "react-date-range";
import { enUS } from "date-fns/locale";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { BiPlus, BiMinus } from "react-icons/bi";
import type { RoomType } from "@/types/api";
import { formatCurrency } from "@/utils/formatCurrency";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "@/redux/slices/authSlice";

interface Props {
  roomTypes: RoomType[];
  selectedRoomType: RoomType | null;
  onSelectRoomType: (rt: RoomType) => void;
  dateRange: { from: Date; to: Date };
  onDateChange: (range: { from: Date; to: Date }) => void;
  guestCount: number;
  onGuestCount: (n: number) => void;
  nights: number;
  totalAmount: number;
  onBook: () => void;
  isBooking: boolean;
}

export default function BookingForm({
  roomTypes,
  selectedRoomType,
  onSelectRoomType,
  dateRange,
  onDateChange,
  guestCount,
  onGuestCount,
  nights,
  totalAmount,
  onBook,
  isBooking,
}: Props) {
  const isAuth = useSelector(selectIsAuthenticated);
  const [showPicker, setShowPicker] = useState(false);

  const ranges = [
    { startDate: dateRange.from, endDate: dateRange.to, key: "selection" },
  ];

  const handleSelect = (rangesByKey: RangeKeyDict) => {
    const selection = rangesByKey["selection"];
    if (selection?.startDate && selection?.endDate) {
      onDateChange({ from: selection.startDate, to: selection.endDate });
    }
  };

  const DatePickerBlock = () => (
    <div className="relative">
      <div
        onClick={() => setShowPicker((v) => !v)}
        className="grid rounded-t-xl border border-[rgba(0,0,0,0.15)] min-h-[80px] w-full grid-cols-2 cursor-pointer"
      >
        <div className="flex items-start py-3 px-3 border-r border-[rgba(0,0,0,0.15)] flex-col gap-1">
          <span className="text-xs lg:text-[13px]     text-[#777b86] uppercase">Check-in</span>
          <span className="text-xs lg:text-[13px]   border-lime-950  text-[#17191c]">
            {dateRange.from.toLocaleDateString("en-NG", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="flex items-start py-3 px-3 flex-col gap-1">
          <span className="text-xs lg:text-[13px]     text-[#777b86] uppercase">Check-out</span>
          <span className="text-xs lg:text-[13px]   border-lime-950  text-[#17191c]">
            {dateRange.to.toLocaleDateString("en-NG", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {showPicker && (
        <div className="absolute z-50 top-full left-0 mt-2 border border-[#e8e6e3] rounded-xl overflow-hidden bg-white shadow-lg">
          <DateRange
            rangeColors={["#17191c"]}
            ranges={ranges}
            onChange={handleSelect}
            showDateDisplay={false}
            minDate={new Date()}
            moveRangeOnFirstSelection={false}
            locale={enUS}
            months={1}
            direction="horizontal"
          />
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* desktop sticky sidebar */}
      <div className="w-full lg:sticky top-[10%] hidden lg:flex flex-col">
        <div className="w-full border border-[#e8e6e3] rounded-xl py-8 px-4 flex flex-col gap-5 md:w-[380px] bg-white">
          <h2 className="text-xl font-semibold text-[#17191c] px-2">
            {selectedRoomType
              ? formatCurrency(Number(selectedRoomType.base_price_ngn))
              : "Select a room"}
            <span className="font-normal text-xs lg:text-[13px]     border-lime-950 text-[#777b86]"> /night</span>
          </h2>

          {roomTypes.length > 0 && (
            <div className="flex flex-col gap-2 px-2">
              <p className="text-xs lg:text-[13px]     border-lime-950 bold uppercase text-[#a3a6af]">
                Room Type
              </p>
              {roomTypes.map((rt) => (
                <button
                  key={rt.id}
                  onClick={() => onSelectRoomType(rt)}
                  className={`text-left px-3 py-2 rounded-xl text-xs lg:text-[13px]     border-lime-950 bold transition-colors ${
                    selectedRoomType?.id === rt.id
                      ? "border-[#17191c] bg-[#f2f0ed]"
                      : "border-[#e8e6e3] hover:border-[#17191c]"
                  }`}
                >
                  <span className="text-[#17191c] bold">{rt.name}</span>
                  <span className="float-right bold text-[#777b86]">
                    {formatCurrency(Number(rt.base_price_ngn))}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="w-full flex flex-col">
            <DatePickerBlock />

            <div className="rounded-b-xl border border-t-0 border-[rgba(0,0,0,0.15)] min-h-[50px] p-3">
              <span className="text-xs lg:text-[13px]     bold text-[#777b86] uppercase">Guests</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs lg:text-[13px]     border-lime-950 bold text-[#17191c] flex-1">
                  {guestCount} guest{guestCount !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={() => onGuestCount(Math.max(1, guestCount - 1))}
                  className="w-8 h-8 rounded-full bg-[#f2f0ed] hover:bg-[#e8e6e3] flex items-center justify-center transition-colors"
                >
                  <BiMinus size={16} />
                </button>
                <button
                  onClick={() => onGuestCount(guestCount + 1)}
                  className="w-8 h-8 rounded-full bg-[#f2f0ed] hover:bg-[#e8e6e3] flex items-center justify-center transition-colors"
                >
                  <BiPlus size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="w-[90%] mx-auto">
            <button
              onClick={onBook}
              disabled={isBooking || !selectedRoomType}
              className="w-full py-4 text-xs lg:text-[13px]     border-lime-950 text-white bg-[#17191c] rounded-full bold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isBooking
                ? "Reserving..."
                : isAuth
                  ? "Place Reservation"
                  : "Sign in to Reserve"}
            </button>
          </div>

          {selectedRoomType && nights > 0 && (
            <div className="w-[90%] mx-auto flex flex-col gap-2 pt-2 border-t border-[#e8e6e3] bg-white">
              <div className="flex items-center bold justify-between text-xs lg:text-[13px]   ">
                <span className="text-[#4c4c4c] bold">
                  {formatCurrency(Number(selectedRoomType.base_price_ngn))} ×{" "}
                  {nights} night{nights !== 1 ? "s" : ""}
                </span>
                <span className="text-[#17191c]">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between bold text-xs lg:text-[13px]     border-t pt-2 border-[#e8e6e3]">
                <span className="text-[#17191c]">Total</span>
                <span className="text-[#17191c]">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* mobile sticky bottom bar */}
      <div className="w-full fixed bottom-0 left-0 h-20 flex lg:hidden items-center justify-center border-t bg-white/90 backdrop-blur-md z-50">
        <div className="w-[90%] bold mx-auto flex items-center justify-between">
          <div className="flex flex-col relative">
            <h4 className="text-xs lg:text-[13px]     bold text-[#17191c]">
              {selectedRoomType
                ? formatCurrency(Number(selectedRoomType.base_price_ngn))
                : "Select room"}
              <span className="text-xs lg:text-[13px]     bold text-[#777b86]">
                {" "}
                /night
              </span>
            </h4>
            <button
              onClick={() => setShowPicker((v) => !v)}
              className="text-xs lg:text-[13px]     underline text-[#17191c]  text-left"
            >
              {dateRange.from.toLocaleDateString("en-NG", {
                day: "numeric",
                month: "short",
              })}
              {" — "}
              {dateRange.to.toLocaleDateString("en-NG", {
                day: "numeric",
                month: "short",
              })}
            </button>
            {showPicker && (
              <div className="absolute z-50 bottom-full left-0 mb-2 border border-[#e8e6e3] rounded-xl overflow-hidden bg-white shadow-lg">
                <DateRange
                  rangeColors={["#17191c"]}
                  ranges={ranges}
                  onChange={handleSelect}
                  showDateDisplay={false}
                  minDate={new Date()}
                  moveRangeOnFirstSelection={false}
                  locale={enUS}
                  months={1}
                  direction="horizontal"
                />
              </div>
            )}
          </div>
          <button
            onClick={onBook}
            disabled={isBooking || !selectedRoomType}
            className="py-2 px-8 text-xs lg:text-[13px]     rounded-full text-white bg-[#17191c] hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isBooking ? "Reserving..." : "Reserve"}
          </button>
        </div>
      </div>
    </>
  );
}
