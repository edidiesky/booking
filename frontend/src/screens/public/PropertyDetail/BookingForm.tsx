import { formatCurrency } from "@/utils/formatCurrency";
import type { RoomType }  from "@/types/api";

interface Props {
  roomTypes:             RoomType[];
  selectedRoomTypeId:    string;
  onSelectRoomType:      (id: string) => void;
  checkIn:               string;
  checkOut:              string;
  onCheckIn:             (v: string) => void;
  onCheckOut:            (v: string) => void;
  roomsCount:            number;
  onRoomsCount:          (v: number) => void;
  guestCount:            number;
  onGuestCount:          (v: number) => void;
  onBook:                () => void;
  isBooking:             boolean;
}

export default function BookingForm({
  roomTypes, selectedRoomTypeId, onSelectRoomType,
  checkIn, checkOut, onCheckIn, onCheckOut,
  roomsCount, onRoomsCount, guestCount, onGuestCount,
  onBook, isBooking,
}: Props) {
  const selectedRoom = roomTypes.find((r) => r.id === selectedRoomTypeId);

  const nights = checkIn && checkOut
    ? Math.max(0, Math.round(
        (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000
      ))
    : 0;

  const total = selectedRoom ? selectedRoom.basePriceNgn * nights * roomsCount : 0;

  return (
    <div className="flex flex-col gap-5 p-6 rounded-2xl border sticky top-24"
         style={{ borderColor: "#e8e6e3", backgroundColor: "var(--color-canvas)" }}>
      <p className="text-sm bold" style={{ color: "var(--color-ink)" }}>
        Book this property
      </p>

      {/* room type picker */}
      <div className="flex flex-col gap-2">
        <label className="text-xs bold uppercase tracking-widest"
               style={{ color: "var(--color-hint-of-grey)" }}>Room Type</label>
        <div className="flex flex-col gap-2">
          {roomTypes.map((rt) => (
            <button key={rt.id} onClick={() => onSelectRoomType(rt.id)}
              className="flex items-center justify-between p-3 rounded-xl border-2 text-left transition-colors"
              style={{
                borderColor:     rt.id === selectedRoomTypeId ? "var(--color-ink)" : "#e8e6e3",
                backgroundColor: rt.id === selectedRoomTypeId ? "var(--color-fog)" : "transparent",
              }}>
              <span className="text-sm" style={{ color: "var(--color-ink)" }}>{rt.name}</span>
              <span className="text-sm bold" style={{ color: "var(--color-ink)" }}>
                {formatCurrency(rt.basePriceNgn)}/night
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* dates */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs bold uppercase tracking-widest"
                 style={{ color: "var(--color-hint-of-grey)" }}>Check-in</label>
          <input type="date" value={checkIn} onChange={(e) => onCheckIn(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="border rounded-lg px-3 py-2 text-sm outline-none"
            style={{ borderColor: "#e8e6e3", color: "var(--color-ink)" }} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs bold uppercase tracking-widest"
                 style={{ color: "var(--color-hint-of-grey)" }}>Check-out</label>
          <input type="date" value={checkOut} onChange={(e) => onCheckOut(e.target.value)}
            min={checkIn || new Date().toISOString().split("T")[0]}
            className="border rounded-lg px-3 py-2 text-sm outline-none"
            style={{ borderColor: "#e8e6e3", color: "var(--color-ink)" }} />
        </div>
      </div>

      {/* counters */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Rooms",  value: roomsCount,  onChange: onRoomsCount  },
          { label: "Guests", value: guestCount,  onChange: onGuestCount  },
        ].map(({ label, value, onChange }) => (
          <div key={label} className="flex flex-col gap-1">
            <label className="text-xs bold uppercase tracking-widest"
                   style={{ color: "var(--color-hint-of-grey)" }}>{label}</label>
            <div className="flex items-center gap-3">
              <button onClick={() => onChange(Math.max(1, value - 1))}
                className="w-8 h-8 rounded-full border flex items-center justify-center text-lg transition-opacity hover:opacity-70"
                style={{ borderColor: "#e8e6e3", color: "var(--color-ink)" }}>−</button>
              <span className="text-sm bold" style={{ color: "var(--color-ink)" }}>{value}</span>
              <button onClick={() => onChange(value + 1)}
                className="w-8 h-8 rounded-full border flex items-center justify-center text-lg transition-opacity hover:opacity-70"
                style={{ borderColor: "#e8e6e3", color: "var(--color-ink)" }}>+</button>
            </div>
          </div>
        ))}
      </div>

      {/* total */}
      {total > 0 && (
        <div className="flex items-center justify-between pt-3 border-t"
             style={{ borderColor: "#e8e6e3" }}>
          <span className="text-sm" style={{ color: "var(--color-muted-stone)" }}>
            {nights} night{nights !== 1 ? "s" : ""} × {roomsCount} room{roomsCount !== 1 ? "s" : ""}
          </span>
          <span className="text-base bold" style={{ color: "var(--color-ink)" }}>
            {formatCurrency(total)}
          </span>
        </div>
      )}

      <button
        onClick={onBook}
        disabled={isBooking || !selectedRoomTypeId || !checkIn || !checkOut}
        className="w-full h-12 rounded-full flex items-center justify-center text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
        style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}
      >
        {isBooking ? "Reserving..." : "Reserve"}
      </button>

      <p className="text-xs text-center" style={{ color: "var(--color-hint-of-grey)" }}>
        You won't be charged yet. Payment is collected after confirmation.
      </p>
    </div>
  );
}