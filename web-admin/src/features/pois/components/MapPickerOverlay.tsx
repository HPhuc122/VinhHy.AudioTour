import { useEffect, useRef, useState } from 'react';
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

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 8000,
  maximumAge: 30000,
};

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
    const timeoutIds = [100, 300].map((delay) => window.setTimeout(resize, delay));
    const container = map.getContainer();
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            resize();
          });

    observer?.observe(container);

    return () => {
      window.cancelAnimationFrame(frameId);
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
      observer?.disconnect();
    };
  }, [map, trigger]);

  return null;
}

function MapPositionHandler({ position }: { position: { lat: number; lng: number } }) {
  const map = useMap();

  useEffect(() => {
    map.setView([position.lat, position.lng], map.getZoom() || MAP_DEFAULT_ZOOM);
    map.invalidateSize();
  }, [map, position.lat, position.lng]);

  return null;
}

export function MapPickerOverlay({ open, initialPosition, onClose, onConfirm }: Props) {
  const locationWatchIdRef = useRef<number | null>(null);
  const shouldFollowUserRef = useRef(false);
  const [tempPos, setTempPos] = useState<{ lat: number; lng: number }>(
    initialPosition ?? MAP_DEFAULT_POSITION,
  );

  useEffect(() => {
    if (!open) return;

    if (initialPosition) {
      shouldFollowUserRef.current = false;
      setTempPos(initialPosition);
      return;
    }

    setTempPos(MAP_DEFAULT_POSITION);

    if (!navigator.geolocation) return;

    let cancelled = false;
    shouldFollowUserRef.current = true;

    if (locationWatchIdRef.current !== null) return;

    locationWatchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        if (cancelled || !shouldFollowUserRef.current) return;

        setTempPos({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        if (!cancelled) {
          setTempPos(MAP_DEFAULT_POSITION);
        }
      },
      GEOLOCATION_OPTIONS,
    );

    return () => {
      cancelled = true;
      if (locationWatchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(locationWatchIdRef.current);
        locationWatchIdRef.current = null;
      }
    };
  }, [open, initialPosition?.lat, initialPosition?.lng]);

  useEffect(() => {
    return () => {
      if (locationWatchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(locationWatchIdRef.current);
        locationWatchIdRef.current = null;
      }
    };
  }, []);

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
          <MapResizeHandler trigger={`${open}:${tempPos.lat}:${tempPos.lng}`} />
          <MapPositionHandler position={tempPos} />
          <ClickHandler
            onSetTemp={(lat, lng) => {
              shouldFollowUserRef.current = false;
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
