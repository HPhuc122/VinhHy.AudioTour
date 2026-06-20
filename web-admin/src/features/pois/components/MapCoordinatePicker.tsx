import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import {
  MAP_ATTRIBUTION,
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_MAX_ZOOM,
  MAP_TILE_URL,
} from '@/config/mapConfig';

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

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapResizeHandler({ trigger }: { trigger: unknown }) {
  const map = useMap();

  useEffect(() => {
    const resize = () => map.invalidateSize();
    const frameId = window.requestAnimationFrame(resize);
    const timeoutId = window.setTimeout(resize, 250);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [map, trigger]);

  return null;
}

export function MapCoordinatePicker({ position, onChange }: Props) {
  const [localPos, setLocalPos] = useState<{ lat: number; lng: number } | null>(position ?? null);

  useEffect(() => {
    setLocalPos(position ?? null);
  }, [position]);

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-md">
      <MapContainer
        center={localPos ? [localPos.lat, localPos.lng] : MAP_DEFAULT_CENTER}
        zoom={MAP_DEFAULT_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        scrollWheelZoom={false}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer url={MAP_TILE_URL} attribution={MAP_ATTRIBUTION} maxZoom={MAP_MAX_ZOOM} />
        <MapResizeHandler trigger={`${position?.lat ?? 'none'}:${position?.lng ?? 'none'}`} />
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
