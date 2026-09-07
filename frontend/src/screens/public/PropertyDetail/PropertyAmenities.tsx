import type { ReactNode } from "react";
import {
  Wifi,
  Tv,
  ChefHat,
  WashingMachine,
  Wind as Dryer,
  Wind,
  Flame,
  Laptop,
  Shirt,
  Sparkles,
  Car,
  Waves,
  Bath,
  Dumbbell,
  ArrowUpDown,
  KeyRound,
  PawPrint,
  Plug,
  Coffee,
  Droplets,
  Trees,
  Utensils,
  Sun,
  Building2,
  Palmtree,
  ShieldAlert,
  AlertTriangle,
  Cross,
  FireExtinguisher,
  Camera,
} from "lucide-react";
import type { Property } from "@/types/api";
import { AMENITY_OPTIONS } from "@/constants/amenities";

const ICON_MAP: Record<string, ReactNode> = {
  wifi: <Wifi size={24} />,
  tv: <Tv size={24} />,
  kitchen: <ChefHat size={24} />,
  washer: <WashingMachine size={24} />,
  dryer: <Dryer size={24} />,
  ac: <Wind size={24} />,
  heating: <Flame size={24} />,
  workspace: <Laptop size={24} />,
  iron: <Shirt size={24} />,
  hair_dryer: <Sparkles size={24} />,
  parking: <Car size={24} />,
  pool: <Waves size={24} />,
  hot_tub: <Bath size={24} />,
  gym: <Dumbbell size={24} />,
  elevator: <ArrowUpDown size={24} />,
  self_checkin: <KeyRound size={24} />,
  pets: <PawPrint size={24} />,
  ev_charger: <Plug size={24} />,
  breakfast: <Coffee size={24} />,
  bathtub: <Droplets size={24} />,
  garden: <Trees size={24} />,
  bbq: <Utensils size={24} />,
  patio: <Sun size={24} />,
  balcony: <Building2 size={24} />,
  beach_access: <Palmtree size={24} />,
  smoke_alarm: <ShieldAlert size={24} />,
  carbon_monoxide: <AlertTriangle size={24} />,
  first_aid: <Cross size={24} />,
  fire_extinguisher: <FireExtinguisher size={24} />,
  security_cameras: <Camera size={24} />,
};

const LABEL_FALLBACK: Record<string, ReactNode> = {
  wifi: <Wifi size={24} />,
  "wi-fi": <Wifi size={24} />,
  ac: <Wind size={24} />,
  "air conditioning": <Wind size={24} />,
  tv: <Tv size={24} />,
  "smart tv": <Tv size={24} />,
  parking: <Car size={24} />,
  security: <ShieldAlert size={24} />,
  breakfast: <Coffee size={24} />,
  pool: <Waves size={24} />,
  "swimming pool": <Waves size={24} />,
  gym: <Dumbbell size={24} />,
  restaurant: <Utensils size={24} />,
};

function getIcon(amenity: string): ReactNode {
  if (ICON_MAP[amenity]) return ICON_MAP[amenity];

  const key = amenity.toLowerCase();
  const match = Object.entries(LABEL_FALLBACK).find(([k]) => key.includes(k));
  return match ? (
    match[1]
  ) : (
    <span className="w-5 h-5 rounded-full bg-[#f2f0ed] inline-block" />
  );
}

function getLabel(amenity: string): string {
  const found = AMENITY_OPTIONS.find((o) => o.id === amenity);
  return found?.label ?? amenity;
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
        <span className="block text-sm  text-[#777b86] pt-1">
          Enjoy the comforts of home and beyond with these distinctive features.
        </span>
      </h3>
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-6">
        {property.amenities.map((amenity, i) => (
          <div
            key={i}
            className="flex items-center gap-3 text-sm lg:text-base    bold text-[#4c4c4c]"
          >
            <span className="text-[#17191c]">{getIcon(amenity)}</span>
            <span>{getLabel(amenity)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
