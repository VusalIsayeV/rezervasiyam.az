import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

// Leaflet default icon fix (CRA/Vite bundler issue)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type Props = {
  lat: number;
  lng: number;
  onChange?: (lat: number, lng: number, address?: string) => void;
  readOnly?: boolean;
  height?: number;
};

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number, address?: string) => void }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
          { headers: { "Accept-Language": "az" } }
        );
        const data = await res.json();
        onChange(lat, lng, data.display_name);
      } catch {
        onChange(lat, lng);
      }
    },
  });
  return null;
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng]);
  return null;
}

export default function MapPicker({ lat, lng, onChange, readOnly, height = 320 }: Props) {
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200" style={{ height }}>
      <MapContainer
        center={[lat, lng]}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} />
        <Recenter lat={lat} lng={lng} />
        {!readOnly && onChange && <ClickHandler onChange={onChange} />}
      </MapContainer>
    </div>
  );
}
