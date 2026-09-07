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

function toCoord(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function pinPrice(p: PropertyCardData): number | null {
  const fromList = p.fromPrice ?? p.from_price;
  if (fromList != null && Number.isFinite(Number(fromList))) {
    return Number(fromList);
  }
  if (p.roomTypes?.length) {
    const prices = p.roomTypes
      .map((r) => Number(r.base_price_ngn))
      .filter((n) => Number.isFinite(n));
    if (prices.length) return Math.min(...prices);
  }
  return null;
}

function pinsFromProperties(properties: PropertyCardData[]): MapPin[] {
  return properties
    .map((p) => {
      // API returns root latitude/longitude (not address.lat/lng)
      const lat = toCoord(p.latitude ?? p.address?.lat);
      const lng = toCoord(p.longitude ?? p.address?.lng);
      if (lat == null || lng == null) return null;

      return {
        id: p.id,
        lat,
        lng,
        price: pinPrice(p),
        name: p.name,
      };
    })
    .filter((x): x is MapPin => x != null);
}

function priceIcon(price: number | null, active: boolean) {
  const label =
    price != null ? formatCurrency(price).replace(/\.00$/, "") : "·";
  return L.divIcon({
    className: "",
    iconSize: [72, 28],
    iconAnchor: [36, 14],
    html: `<div style="
      background:${active ? "#222" : "#fff"};
      color:${active ? "#fff" : "#222"};
      border:1px solid ${active ? "#222" : "#ddd"};
      border-radius:999px;
      padding: 10px;
      font-size:13px;
      font-weight:600;
      font-family:'Bricolage Grotesque', system-ui, sans-serif;
      box-shadow:0 2px 8px rgba(0,0,0,.15);
      white-space:nowrap;
      text-align:center;
      cursor:pointer;
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
    map.fitBounds(bounds, { padding: [48, 48] });
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
    : [9.082, 8.6753];

  return (
    <div
      className={`w-full h-full min-h-[320px] overflow-hidden rounded-2xl border border-[#e8e6e3] ${className}`}
    >
      <MapContainer
        center={center}
        zoom={pins.length ? 12 : 6}
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
