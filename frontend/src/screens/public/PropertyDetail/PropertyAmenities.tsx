import type { ReactNode } from "react";
import {
  Wifi, Tv, ChefHat, WashingMachine, Wind as Dryer, Wind, Flame,
  Laptop, Shirt, Sparkles, Car, Waves, Bath, Dumbbell, ArrowUpDown,
  KeyRound, PawPrint, Plug, Coffee, Droplets, Trees, Utensils,
  Sun, Building2, Palmtree, ShieldAlert, AlertTriangle, Cross,
  FireExtinguisher, Camera,
} from "lucide-react";
import type { Property } from "@/types/api";
import { AMENITY_OPTIONS } from "@/constants/amenities";

const ICON_MAP: Record<string, ReactNode> = {
  wifi:               <Wifi size={20} />,
  tv:                 <Tv size={20} />,
  kitchen:            <ChefHat size={20} />,
  washer:             <WashingMachine size={20} />,
  dryer:              <Dryer size={20} />,
  ac:                 <Wind size={20} />,
  heating:            <Flame size={20} />,
  workspace:          <Laptop size={20} />,
  iron:               <Shirt size={20} />,
  hair_dryer:         <Sparkles size={20} />,
  parking:            <Car size={20} />,
  pool:               <Waves size={20} />,
  hot_tub:            <Bath size={20} />,
  gym:                <Dumbbell size={20} />,
  elevator:           <ArrowUpDown size={20} />,
  self_checkin:       <KeyRound size={20} />,
  pets:               <PawPrint size={20} />,
  ev_charger:         <Plug size={20} />,
  breakfast:          <Coffee size={20} />,
  bathtub:            <Droplets size={20} />,
  garden:             <Trees size={20} />,
  bbq:                <Utensils size={20} />,
  patio:              <Sun size={20} />,
  balcony:            <Building2 size={20} />,
  beach_access:       <Palmtree size={20} />,
  smoke_alarm:        <ShieldAlert size={20} />,
  carbon_monoxide:    <AlertTriangle size={20} />,
  first_aid:          <Cross size={20} />,
  fire_extinguisher:  <FireExtinguisher size={20} />,
  security_cameras:   <Camera size={20} />,
};

const LABEL_FALLBACK: Record<string, ReactNode> = {
  wifi: <Wifi size={20} />,
  "wi-fi": <Wifi size={20} />,
  ac: <Wind size={20} />,
  "air conditioning": <Wind size={20} />,
  tv: <Tv size={20} />,
  "smart tv": <Tv size={20} />,
  parking: <Car size={20} />,
  security: <ShieldAlert size={20} />,
  breakfast: <Coffee size={20} />,
  pool: <Waves size={20} />,
  "swimming pool": <Waves size={20} />,
  gym: <Dumbbell size={20} />,
  restaurant: <Utensils size={20} />,
};

function getIcon(amenity: string): ReactNode {
  if (ICON_MAP[amenity]) return ICON_MAP[amenity];

  const key = amenity.toLowerCase();
  const match = Object.entries(LABEL_FALLBACK).find(([k]) => key.includes(k));
  return match ? match[1] : <span className="w-5 h-5 rounded-full bg-[#f2f0ed] inline-block" />;
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
        <span className="block text-xs lg:text-[13px]     text-[#777b86] pt-1">
          Enjoy the comforts of home and beyond with these distinctive features.
        </span>
      </h3>
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-6">
        {property.amenities.map((amenity, i) => (
          <div
            key={i}
            className="flex items-center gap-3 text-xs lg:text-[13px]     bold text-[#4c4c4c]"
          >
            <span className="text-[#17191c]">{getIcon(amenity)}</span>
            <span>{getLabel(amenity)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
