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
          <h1 className="text-3xl md:text-3xl bold text-[#17191c]">
            {property.name}
            <span className="text-xs pt-2 text-[#777b86] font-normal flex items-center gap-3 mt-1">
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
            <h1 className="text-xl lg:text-3xl bold text-[#17191c]">
              ₦{Number(lowestPrice).toLocaleString()}
              <span className="text-xs font-normal text-[#777b86]"> /night</span>
            </h1>
          )}
        </div>

        <span className="text-xs px-3 py-1 bold rounded-full capitalize self-start"
          style={{ backgroundColor: "var(--color-fog)"}}>
          {TYPE_LABEL[property.property_type ?? property.propertyType ?? "shortlet"]}
        </span>
      </div>

      <div className="flex items-center flex-wrap gap-3">
        {[
          { label: "Room Types",  value: String(roomTypes.length),         icon: <Bed size={14} />    },
          { label: "Total Units", value: String(totalRooms),               icon: <Bed size={14} />    },
          { label: "Max Guests",  value: maxOccupancy ? `${maxOccupancy} guests` : "—", icon: <Users size={14} /> },
          { label: "Check-in",    value: property.checkInTime ?? "—", icon: <Wifi size={14} /> },
        ].map(({ label, value, icon }) => (
          <div key={label}
            className={`flex items-center gap-1 p-2 bg-[#f2f0ed] rounded-full justify-center`}>

            <div className="flex items-center gap-1 text-[#777b86]">
              
              {icon}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs">{value}</span>
<h4 className="text-xs bold text-[#17191c]">{label}</h4>
            </div>
                        
          </div>
        ))}
      </div>
    </div>
  );
}