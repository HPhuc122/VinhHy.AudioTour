import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useState } from 'react';

// Use a custom red SVG marker via divIcon. className set to empty to avoid default white background.
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
  // called when user confirms selection
  onConfirm: (lat: number, lng: number) => void;
}

type MapType = 'roadmap' | 'hybrid';

const DEFAULT_CENTER: [number, number] = [11.6017, 109.2267];
const DEFAULT_ZOOM = 17;

function ClickHandler({ onSetTemp }: { onSetTemp: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSetTemp(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function MapPickerOverlay({ open, initialPosition, onClose, onConfirm }: Props) {
  // tempPos holds the clicked location until user confirms
  const [tempPos, setTempPos] = useState<{ lat: number; lng: number } | null>(
    initialPosition ?? { lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] },
  );
  const [mapType, setMapType] = useState<MapType>('roadmap');

  useEffect(() => {
    setTempPos(initialPosition ?? { lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] });
  }, [initialPosition]);

  if (!open) return null;

  const tileUrls: Record<MapType, string> = {
    roadmap: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    hybrid: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/60 flex items-center justify-center">
      <div className="relative w-[90%] h-[85%] bg-white rounded-lg shadow-lg overflow-hidden">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-[2100] rounded bg-white px-3 py-1 text-sm shadow"
        >
          X
        </button>

        <div className="absolute right-3 top-12 z-[2100]">
          <button
            type="button"
            onClick={() => setMapType((t) => (t === 'roadmap' ? 'hybrid' : 'roadmap'))}
            className="rounded bg-white/90 px-3 py-1 text-xs shadow hover:bg-white"
          >
            {mapType === 'roadmap' ? '🗺️ Xem ảnh Vệ tinh' : '🗺️ Xem Bản đồ thường'}
          </button>
        </div>

        <MapContainer
          center={tempPos ? [tempPos.lat, tempPos.lng] : DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer url={tileUrls[mapType]} attribution="&copy; Google Maps" />
          <ClickHandler
            onSetTemp={(lat, lng) => {
              // only update tempPos; do not notify parent until confirmation
              setTempPos({ lat, lng });
            }}
          />
          {tempPos && <Marker position={[tempPos.lat, tempPos.lng]} icon={customRedIcon} />}
        </MapContainer>

        {/* Confirm button — user explicitly confirms selection to close overlay */}
        <div className="absolute right-6 bottom-6 z-[2010]">
          <button
            type="button"
            onClick={() => {
              if (tempPos) onConfirm(tempPos.lat, tempPos.lng);
            }}
            className="rounded bg-blue-600 text-white px-4 py-2 shadow hover:bg-blue-700"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

export default MapPickerOverlay;
