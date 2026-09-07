import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const DEFAULT_CENTER: [number, number] = [6.5244, 3.3792]; // Lagos map center only

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface Props {
  latitude?: number | null;
  longitude?: number | null;
  onChange: (lat: number, lng: number) => void;
}

function ClickHandler({
  onChange,
}: {
  onChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** Fly map when parent lat/lng change (e.g. after geocode) */
function MapFlyTo({
  latitude,
  longitude,
}: {
  latitude?: number | null;
  longitude?: number | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (
      latitude != null &&
      longitude != null &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude)
    ) {
      map.flyTo([latitude, longitude], 15, { duration: 0.6 });
    }
  }, [latitude, longitude, map]);
  return null;
}

export default function LocationPicker({
  latitude,
  longitude,
  onChange,
}: Props) {
  const hasCoords =
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  const [position, setPosition] = useState<[number, number]>(() =>
    hasCoords ? [latitude!, longitude!] : DEFAULT_CENTER,
  );

  useEffect(() => {
    if (
      latitude != null &&
      longitude != null &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude)
    ) {
      setPosition([latitude, longitude]);
    }
  }, [latitude, longitude]);

  const handleClick = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    onChange(lat, lng);
  };

  return (
    <div
      className="w-full overflow-hidden rounded-xl border"
      style={{ borderColor: "#e8e6e3", height: 320 }}
    >
      <MapContainer
        center={position}
        zoom={hasCoords ? 14 : 6}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hasCoords && <Marker position={position} icon={markerIcon} />}
        <ClickHandler onChange={handleClick} />
        <MapFlyTo latitude={latitude} longitude={longitude} />
      </MapContainer>
      <p
        className="px-3 py-2 text-xs lg:text-[13px]"
        style={{ color: "#777b86" }}
      >
        {hasCoords
          ? "Click the map to fine-tune the pin."
          : "Click the map to set this property’s exact location, or fill the address and use Locate."}
      </p>
    </div>
  );
}