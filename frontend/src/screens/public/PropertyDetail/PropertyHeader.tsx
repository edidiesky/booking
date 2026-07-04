import { MapPin }       from "lucide-react";
import { IoStar }       from "react-icons/io5";
import { Bed, Wifi, Users } from "lucide-react";
import type { Property, RoomType } from "@/types/api";

interface Props {
  property:    Property;
  roomTypes:   RoomType[];
}

export default function PropertyHeader({ property, roomTypes }: Props) {
  const totalRooms     = roomTypes.reduce((s, r) => s + r.quantity, 0);
  const maxOccupancy   = roomTypes.length
    ? Math.max(...roomTypes.map((r) => r.maxOccupancy))
    : null;
  const lowestPrice    = roomTypes.length
    ? Math.min(...roomTypes.map((r) => Number(r.base_price_ngn)))
    : null;

  const TYPE_LABEL: Record<string, string> = {
    shortlet:   "Shortlet",
    hotel:      "Hotel",
    guesthouse: "Guesthouse",
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex flex-col gap-2 flex-1">
          <h1 className="text-3xl md:text-4xl bold text-[#17191c]">
            {property.name}
            <span className="text-base pt-2 text-[#777b86] font-normal flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1">
                <MapPin size={13} />
                {property.address.city}, {property.address.country}
              </span>
              <span className="flex items-center gap-0.5 text-[#f5a623]">
                {Array.from({ length: 5 }).map((_, i) => <IoStar key={i} />)}
              </span>
            </span>
          </h1>
          {lowestPrice !== null && (
            <p className="text-2xl lg:text-3xl bold text-[#17191c]">
              ₦{Number(lowestPrice).toLocaleString()}
              <span className="text-sm font-normal text-[#777b86]"> /night</span>
            </p>
          )}
        </div>

        <span className="text-base px-3 py-1 bold rounded-full capitalize self-start"
          style={{ backgroundColor: "var(--color-fog)", color: "var(--color-muted-stone)" }}>
          {TYPE_LABEL[property.property_type ?? property.propertyType ?? "shortlet"]}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 border border-[#e8e6e3] rounded-xl">
        {[
          { label: "Room Types",  value: String(roomTypes.length),         icon: <Bed size={22} />    },
          { label: "Total Units", value: String(totalRooms),               icon: <Bed size={22} />    },
          { label: "Max Guests",  value: maxOccupancy ? `${maxOccupancy} guests` : "—", icon: <Users size={22} /> },
          { label: "Check-in",    value: property.checkInTime ?? "—", icon: <Wifi size={22} /> },
        ].map(({ label, value, icon }, i, arr) => (
          <div key={label}
            className={`flex flex-col p-4 pl-6 min-h-[110px] justify-center gap-1 ${i < arr.length - 1 ? "border-r border-[#e8e6e3]" : ""}`}>
            <h4 className="text-base bold text-[#17191c]">{label}</h4>
            <div className="flex items-center gap-3 text-[#777b86]">
              <span className="text-base">{value}</span>
              {icon}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}