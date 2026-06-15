import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useState } from 'react';

// Fix for default marker icons not loading with build tools like Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Props {
  position: { lat: number; lng: number } | null;
  onChange: (lat: number, lng: number) => void;
}

type MapType = 'roadmap' | 'hybrid';

const DEFAULT_CENTER: [number, number] = [10.7615, 106.7033];
const DEFAULT_ZOOM = 17;

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function MapCoordinatePicker({ position, onChange }: Props) {
  const [localPos, setLocalPos] = useState<{ lat: number; lng: number } | null>(position ?? null);

  useEffect(() => {
    setLocalPos(position ?? null);
  }, [position]);

  const [mapType, setMapType] = useState<MapType>('roadmap');

  const tileUrls: Record<MapType, string> = {
    roadmap: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    hybrid: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
  };

  const currentTileUrl = tileUrls[mapType];

  return (
    <div className="relative w-full h-64 rounded-md overflow-hidden">
      <div className="absolute right-3 top-3 z-[1000]">
        <button
          type="button"
          onClick={() => setMapType((t) => (t === 'roadmap' ? 'hybrid' : 'roadmap'))}
          className="rounded bg-white/90 px-3 py-1 text-xs shadow hover:bg-white"
        >
          {mapType === 'roadmap' ? '🗺️ Xem ảnh Vệ tinh' : '🗺️ Xem Bản đồ thường'}
        </button>
      </div>

      <MapContainer
        center={localPos ? [localPos.lat, localPos.lng] : DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={false}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer url={currentTileUrl} attribution="&copy; Google Maps" />
        <ClickHandler
          onChange={(lat, lng) => {
            setLocalPos({ lat, lng });
            onChange(lat, lng);
          }}
        />
        {localPos && <Marker position={[localPos.lat, localPos.lng]} />}
      </MapContainer>
    </div>
  );
}

export default MapCoordinatePicker;
