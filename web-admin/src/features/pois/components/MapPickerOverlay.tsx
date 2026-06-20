import { useEffect, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import {
  MAP_ATTRIBUTION,
  MAP_DEFAULT_POSITION,
  MAP_DEFAULT_ZOOM,
  MAP_MAX_ZOOM,
  MAP_TILE_URL,
} from '@/config/mapConfig';

const customRedIcon = L.divIcon({
  className: '',
  html: '<svg width="28" height="40" viewBox="0 0 24 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.37258 0 0 5.37258 0 12C0 21 12 40 12 40C12 40 24 21 24 12C24 5.37258 18.6274 0 12 0Z" fill="#EF4444"/><circle cx="12" cy="12" r="4" fill="white"/></svg>',
  iconSize: [28, 40],
  iconAnchor: [14, 40],
  popupAnchor: [0, -35],
});

interface Props {
  open: boolean;
  initialPosition: { lat: number; lng: number } | null;
  onClose: () => void;
  onConfirm: (lat: number, lng: number) => void;
}

function ClickHandler({ onSetTemp }: { onSetTemp: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSetTemp(e.latlng.lat, e.latlng.lng);
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

export function MapPickerOverlay({ open, initialPosition, onClose, onConfirm }: Props) {
  const [tempPos, setTempPos] = useState<{ lat: number; lng: number }>(
    initialPosition ?? MAP_DEFAULT_POSITION,
  );

  useEffect(() => {
    setTempPos(initialPosition ?? MAP_DEFAULT_POSITION);
  }, [initialPosition]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60">
      <div className="relative h-[85vh] min-h-[360px] w-[90%] overflow-hidden rounded-lg bg-white shadow-lg">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-[2100] rounded bg-white px-3 py-1 text-sm shadow"
        >
          X
        </button>

        <MapContainer
          center={[tempPos.lat, tempPos.lng]}
          zoom={MAP_DEFAULT_ZOOM}
          maxZoom={MAP_MAX_ZOOM}
          scrollWheelZoom
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer url={MAP_TILE_URL} attribution={MAP_ATTRIBUTION} maxZoom={MAP_MAX_ZOOM} />
          <MapResizeHandler trigger={open} />
          <ClickHandler
            onSetTemp={(lat, lng) => {
              setTempPos({ lat, lng });
            }}
          />
          <Marker position={[tempPos.lat, tempPos.lng]} icon={customRedIcon} />
        </MapContainer>

        <div className="absolute bottom-6 right-6 z-[2010]">
          <button
            type="button"
            onClick={() => onConfirm(tempPos.lat, tempPos.lng)}
            className="rounded bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

export default MapPickerOverlay;
