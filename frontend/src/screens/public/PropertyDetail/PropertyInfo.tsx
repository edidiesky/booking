import { MapPin, Clock } from "lucide-react";
import type { Property }        from "@/types/api";

interface Props { property: Property; }

export default function PropertyInfo({ property }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full capitalize font-semibold"
                style={{ backgroundColor: "var(--color-fog)", color: "var(--color-muted-stone)" }}>
            {property.propertyType}
          </span>
        </div>
        <h1 className="text-3xl font-semibold"
            style={{ color: "var(--color-ink)", letterSpacing: "-0.3px" }}>
          {property.name}
        </h1>
        <p className="flex items-center gap-1.5 text-sm"
           style={{ color: "var(--color-light-steel)" }}>
          <MapPin size={13} />
          {property.address.street}, {property.address.city}, {property.address.state}
        </p>
      </div>

      <p className="text-sm leading-relaxed" style={{ color: "var(--color-muted-stone)" }}>
        {property.description}
      </p>

      <div className="flex items-center gap-6 text-sm" style={{ color: "var(--color-muted-stone)" }}>
        <span className="flex items-center gap-1.5">
          <Clock size={14} />
          Check-in: {property.checkInTime}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={14} />
          Check-out: {property.checkOutTime}
        </span>
      </div>

      {property.amenities.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold" style={{ color: "var(--color-ink)" }}>Amenities</p>
          <div className="flex flex-wrap gap-2">
            {property.amenities.map((a) => (
              <span key={a}
                className="text-xs px-3 py-1 rounded-full capitalize"
                style={{ backgroundColor: "var(--color-fog)", color: "var(--color-muted-stone)" }}>
                {a}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}