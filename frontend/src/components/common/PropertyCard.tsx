import { useNavigate }   from "react-router-dom";
import { MapPin }        from "lucide-react";
import type { Property } from "@/types/api";
import { formatCurrency } from "@/utils/formatCurrency";

interface Props {
  property: Property;
}

export default function PropertyCard({ property }: Props) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/properties/${property.id}`)}
      className="flex flex-col gap-3 cursor-pointer group"
    >
      <div className="relative overflow-hidden rounded-xl bg-[#f2f0ed]" style={{ aspectRatio: "4/5" }}>
        {property.images[0] ? (
          <img
            src={property.images[0]}
            alt={property.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: "var(--color-fog)" }}>
            <MapPin size={24} style={{ color: "var(--color-hint-of-grey)" }} />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span
            className="text-xs px-2 py-1 rounded-full capitalize"
            style={{ backgroundColor: "var(--color-canvas)", color: "var(--color-ink)" }}
          >
            {property.propertyType}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-tight line-clamp-1" style={{ color: "var(--color-ink)" }}>
            {property.name}
          </p>
        </div>
        <p className="text-xs flex items-center gap-1" style={{ color: "var(--color-light-steel)" }}>
          <MapPin size={10} />
          {property.address.city}, {property.address.country}
        </p>
        <p className="text-sm font-semibold mt-1" style={{ color: "var(--color-ink)" }}>
          {formatCurrency(0)}{" "}
          <span className="font-normal text-xs" style={{ color: "var(--color-light-steel)" }}>/ night</span>
        </p>
      </div>
    </div>
  );
}