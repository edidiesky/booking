import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const markerIcon = new L.Icon({
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41],
});

interface Props {
  latitude?:  number | null;
  longitude?: number | null;
  onChange:   (lat: number, lng: number) => void;
}

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) { onChange(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

export default function LocationPicker({ latitude, longitude, onChange }: Props) {
  const [position, setPosition] = useState<[number, number]>([
    latitude  ?? 6.5244,  // Lagos, a reasonable default center, not a claim about the property's actual location
    longitude ?? 3.3792,
  ]);

  const handleClick = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    onChange(lat, lng);
  };

  return (
    <div className="w-full rounded-xl overflow-hidden border" style={{ borderColor: "#e8e6e3", height: 320 }}>
      <MapContainer center={position} zoom={latitude ? 14 : 6} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={markerIcon} />
        <ClickHandler onChange={handleClick} />
      </MapContainer>
      <p className="text-xs lg:text-[13px]   px-3 py-2" style={{ color: "#777b86" }}>
        Click anywhere on the map to set this property's exact location.
      </p>
    </div>
  );
}