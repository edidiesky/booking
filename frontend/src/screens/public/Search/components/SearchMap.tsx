import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatCurrency } from "@/utils/formatCurrency";
import type { PropertyCardData } from "@/components/common/PropertyCard";

export type MapPin = {
  id: string;
  lat: number;
  lng: number;
  price: number | null;
  name: string;
};

function pinsFromProperties(properties: PropertyCardData[]): MapPin[] {
  return properties
    .map((p) => {
      const lat = p.address?.lat;
      const lng = p.address?.lng;
      if (lat == null || lng == null) return null;
      const price = p.roomTypes?.length
        ? Math.min(...p.roomTypes.map((r) => Number(r.base_price_ngn)))
        : null;
      return { id: p.id, lat, lng, price, name: p.name };
    })
    .filter(Boolean) as MapPin[];
}

function priceIcon(price: number | null, active: boolean) {
  const label =
    price != null ? formatCurrency(price).replace(/\.00$/, "") : "·";
  return L.divIcon({
    className: "",
    iconSize: [64, 28],
    iconAnchor: [32, 14],
    html: `<div style="
      background:${active ? "#222" : "#fff"};
      color:${active ? "#fff" : "#222"};
      border:1px solid ${active ? "#222" : "#ddd"};
      border-radius:999px;
      padding:4px 10px;
      font-size:13px;
      font-weight:600;
      font-family:system-ui,sans-serif;
      box-shadow:0 2px 8px rgba(0,0,0,.15);
      white-space:nowrap;
      text-align:center;
    ">${label}</div>`,
  });
}

function FitBounds({ pins }: { pins: MapPin[] }) {
  const map = useMap();
  useEffect(() => {
    if (!pins.length) return;
    if (pins.length === 1) {
      map.setView([pins[0].lat, pins[0].lng], 13);
      return;
    }
    const bounds = L.latLngBounds(
      pins.map((p) => [p.lat, p.lng] as [number, number]),
    );
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, pins]);
  return null;
}

interface Props {
  properties: PropertyCardData[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
}

export default function SearchMap({
  properties,
  activeId,
  onSelect,
  className = "",
}: Props) {
  const pins = useMemo(() => pinsFromProperties(properties), [properties]);
  const center: [number, number] = pins[0]
    ? [pins[0].lat, pins[0].lng]
    : [6.5244, 3.3792];

  return (
    <div
      className={`w-full h-full min-h-[320px] rounded-2xl overflow-hidden border border-[#e8e6e3] ${className}`}
    >
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds pins={pins} />
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            position={[pin.lat, pin.lng]}
            icon={priceIcon(pin.price, pin.id === activeId)}
            eventHandlers={{
              click: () => onSelect?.(pin.id),
            }}
          />
        ))}
      </MapContainer>
    </div>
  );
}