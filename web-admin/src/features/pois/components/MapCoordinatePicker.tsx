import { useEffect, useRef, useState } from 'react';
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

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 8000,
  maximumAge: 30000,
};

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

function MapPositionHandler({ position }: { position: { lat: number; lng: number } | null }) {
  const map = useMap();

  useEffect(() => {
    if (!position) return;

    map.setView([position.lat, position.lng], map.getZoom() || MAP_DEFAULT_ZOOM);
    map.invalidateSize();
  }, [map, position]);

  return null;
}

export function MapCoordinatePicker({ position, onChange }: Props) {
  const locationWatchIdRef = useRef<number | null>(null);
  const shouldFollowUserRef = useRef(false);
  const [localPos, setLocalPos] = useState<{ lat: number; lng: number } | null>(position ?? null);

  useEffect(() => {
    if (position) {
      shouldFollowUserRef.current = false;
    }
    setLocalPos(position ?? null);
  }, [position]);

  useEffect(() => {
    if (position || !navigator.geolocation) return;

    let cancelled = false;
    shouldFollowUserRef.current = true;

    if (locationWatchIdRef.current !== null) return;

    locationWatchIdRef.current = navigator.geolocation.watchPosition(
      (currentPosition) => {
        if (cancelled || !shouldFollowUserRef.current) return;

        const nextPosition = {
          lat: currentPosition.coords.latitude,
          lng: currentPosition.coords.longitude,
        };

        setLocalPos(nextPosition);
        onChange(nextPosition.lat, nextPosition.lng);
      },
      undefined,
      GEOLOCATION_OPTIONS,
    );

    return () => {
      cancelled = true;
      if (locationWatchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(locationWatchIdRef.current);
        locationWatchIdRef.current = null;
      }
    };
  }, [onChange, position]);

  useEffect(() => {
    return () => {
      if (locationWatchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(locationWatchIdRef.current);
        locationWatchIdRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative h-72 min-h-72 w-full overflow-hidden rounded-md">
      <MapContainer
        center={localPos ? [localPos.lat, localPos.lng] : MAP_DEFAULT_CENTER}
        zoom={MAP_DEFAULT_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        scrollWheelZoom={false}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer url={MAP_TILE_URL} attribution={MAP_ATTRIBUTION} maxZoom={MAP_MAX_ZOOM} />
        <MapResizeHandler trigger={`${localPos?.lat ?? 'none'}:${localPos?.lng ?? 'none'}`} />
        <MapPositionHandler position={localPos} />
        <ClickHandler
          onChange={(lat, lng) => {
            shouldFollowUserRef.current = false;
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
