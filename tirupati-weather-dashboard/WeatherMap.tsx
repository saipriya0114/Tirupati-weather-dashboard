import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons (Leaflet + bundlers issue)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface WeatherMapProps {
  lat: number;
  lon: number;
  city: string;
  temperature: number | null;
  humidity: number | null;
  windSpeed: number | null;
  lastUpdated: Date;
}

const Recenter = ({ lat, lon }: { lat: number; lon: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lon], map.getZoom());
  }, [lat, lon, map]);
  return null;
};

export const WeatherMap = ({
  lat,
  lon,
  city,
  temperature,
  humidity,
  windSpeed,
  lastUpdated,
}: WeatherMapProps) => {
  return (
    <div className="h-[380px] w-full overflow-hidden rounded-lg border">
      <MapContainer
        center={[lat, lon]}
        zoom={11}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter lat={lat} lon={lon} />
        <Marker position={[lat, lon]}>
          <Popup>
            <div className="space-y-1 text-sm">
              <div className="text-base font-semibold">📍 {city}</div>
              <div className="text-xs text-muted-foreground">
                {lat.toFixed(4)}°N, {lon.toFixed(4)}°E
              </div>
              <div className="mt-2 space-y-0.5">
                <div>🌡️ Temperature: <strong>{temperature != null ? `${temperature.toFixed(1)}°C` : "--"}</strong></div>
                {humidity != null && <div>💧 Humidity: <strong>{humidity.toFixed(0)}%</strong></div>}
                {windSpeed != null && <div>🌬️ Wind: <strong>{windSpeed.toFixed(1)} km/h</strong></div>}
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground">
                Updated {lastUpdated.toLocaleTimeString()}
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};