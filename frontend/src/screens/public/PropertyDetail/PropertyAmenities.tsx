import {
  Wifi,
  Wind,
  Tv,
  Car,
  Zap,
  Shield,
  Coffee,
  Waves,
  Dumbbell,
  Utensils,
} from "lucide-react";
import type { Property } from "@/types/api";

const ICON_MAP: Record<string, React.ReactNode> = {
  wifi: <Wifi size={20} />,
  "wi-fi": <Wifi size={20} />,
  ac: <Wind size={20} />,
  "air conditioning": <Wind size={20} />,
  tv: <Tv size={20} />,
  "smart tv": <Tv size={20} />,
  parking: <Car size={20} />,
  generator: <Zap size={20} />,
  security: <Shield size={20} />,
  breakfast: <Coffee size={20} />,
  pool: <Waves size={20} />,
  "swimming pool": <Waves size={20} />,
  gym: <Dumbbell size={20} />,
  restaurant: <Utensils size={20} />,
};

function getIcon(label: string): React.ReactNode {
  const key = label.toLowerCase();
  const match = Object.entries(ICON_MAP).find(([k]) => key.includes(k));
  return match ? (
    match[1]
  ) : (
    <span className="w-5 h-5 rounded-full bg-[#f2f0ed] inline-block" />
  );
}

interface Props {
  property: Property;
}

export default function PropertyAmenities({ property }: Props) {
  if (!property.amenities?.length) return null;

  return (
    <div className="w-full flex flex-col gap-6">
      <h3 className="text-xl bold md:text-xl  text-[#17191c]">
        Room Services
        <span className="block text-xs text-[#777b86] pt-1">
          Enjoy the comforts of home and beyond with these distinctive features.
        </span>
      </h3>
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-6">
        {property.amenities.map((amenity, i) => (
          <div
            key={i}
            className="flex items-center gap-3 text-xs bold text-[#4c4c4c]"
          >
            <span className="text-[#17191c]">{getIcon(amenity)}</span>
            <span>{amenity}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
