import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { poisApi } from '../../api/poisApi';
import { publicAudioTourApi } from '../../api/publicAudioTourApi';
import { toursApi } from '../../api/toursApi';
import { Spinner } from '../../components/ui/Spinner';
import type { Lang } from '../../hooks/useLanguage';
import { ROUTES } from '../../routes/routeConstants';
import type { PublicPoiDto } from '../../types/api';
import { AccessExpiredPanel } from '../access/AccessExpiredPanel';
import { getAudioTourErrorKind, getAudioTourErrorMessage } from '../../utils/audioTourErrors';
import { AccessRequiredPanel } from '../access/AccessRequiredPanel';
import { guestAccessStore, type GuestAccessRecord } from '../access/guestAccessStore';
import { ProtectedAudioPlayer } from '../audio/ProtectedAudioPlayer';
import {
  MAP_ATTRIBUTION,
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_FOCUS_ZOOM,
  MAP_MAX_ZOOM,
  MAP_TILE_URL,
} from '../../config/mapConfig';

interface Props { lang: Lang; }

interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

const CATEGORY_STYLES = [
  { icon: 'M', color: '#2563eb' },
  { icon: 'F', color: '#16a34a' },
  { icon: 'S', color: '#f59e0b' },
] as const;

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 8000,
  maximumAge: 30000,
};

export function MapPage({ lang }: Props) {
  const [searchParams] = useSearchParams();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const locationWatchIdRef = useRef<number | null>(null);
  const shouldFollowUserRef = useRef(false);
  const [selectedPoi, setSelectedPoi] = useState<PublicPoiDto | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [clientExpired, setClientExpired] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  const tourId = searchParams.get('tour');
  const focusPoiId = Number(searchParams.get('poi'));
  const focusLat = searchParams.get('lat');
  const focusLng = searchParams.get('lng');
  const hasUrlFocusTarget = Boolean(focusLat && focusLng) || (Number.isInteger(focusPoiId) && focusPoiId > 0);

  const { data: poisData, isLoading } = useQuery({
    queryKey: ['pois-map', lang],
    queryFn: () => poisApi.getAll(1, 100, lang),
  });

  const { data: tourDetail } = useQuery({
    queryKey: ['tour-map', tourId, lang],
    queryFn: () => toursApi.getById(Number(tourId), lang),
    enabled: !!tourId,
  });

  const accessRecord = selectedPoi ? getAccessRecordForPoi(selectedPoi.id) : null;
  const audioTourQuery = useQuery({
    queryKey: ['public-map-audio-tour', selectedPoi?.id, lang, accessRecord?.accessToken],
    queryFn: () => publicAudioTourApi.getPoi(selectedPoi!.id, accessRecord!.accessToken, lang),
    enabled: !!selectedPoi && !!accessRecord?.accessToken && !clientExpired,
    retry: false,
  });

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    let cancelled = false;

    import('leaflet').then((L) => {
      if (cancelled || !mapRef.current || leafletMapRef.current) return;

      const map = L.map(mapRef.current!, {
        center: MAP_DEFAULT_CENTER,
        zoom: MAP_DEFAULT_ZOOM,
        zoomControl: true,
      });

      L.tileLayer(MAP_TILE_URL, {
        attribution: MAP_ATTRIBUTION,
        maxZoom: MAP_MAX_ZOOM,
      }).addTo(map);

      leafletMapRef.current = map;
      setMapReady(true);
      scheduleMapResize(map);
    });

    return () => {
      cancelled = true;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !leafletMapRef.current) return;

    const map = leafletMapRef.current;
    const resize = () => map.invalidateSize();
    const frameId = window.requestAnimationFrame(resize);
    const timeoutIds = [100, 300].map((delay) => window.setTimeout(resize, delay));
    const observer =
      !mapRef.current || typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            resize();
          });

    if (mapRef.current) {
      observer?.observe(mapRef.current);
    }

    window.addEventListener('resize', resize);

    return () => {
      window.cancelAnimationFrame(frameId);
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
      observer?.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, [mapReady, selectedPoi, tourId]);

  useEffect(() => {
    if (!mapReady || !leafletMapRef.current || !poisData) return;

    import('leaflet').then((L) => {
      const map = leafletMapRef.current;

      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker || layer instanceof L.Circle || layer instanceof L.Polyline) {
          map.removeLayer(layer);
        }
      });

      const pois = tourDetail ? tourDetail.pois : poisData.items;

      pois.forEach((poi: PublicPoiDto, index: number) => {
        const style = getCategoryStyle(poi.category);
        const marker = L.marker([poi.latitude, poi.longitude], {
          icon: L.divIcon({
            html: `
              <div style="display:flex;align-items:center;gap:6px;transform:translate(-18px,-34px);">
                <span style="display:flex;width:32px;height:32px;align-items:center;justify-content:center;border-radius:9999px;background:${style.color};border:3px solid #ffffff;box-shadow:0 4px 12px rgba(0,0,0,.35);color:white;font:700 12px system-ui;">${tourDetail ? index + 1 : style.icon}</span>
                <span style="max-width:132px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border-radius:6px;background:rgba(17,24,39,.92);padding:3px 7px;color:white;font:600 12px system-ui;box-shadow:0 2px 8px rgba(0,0,0,.25);">${escapeHtml(poi.name || poi.code)}</span>
              </div>
            `,
            className: '',
            iconSize: [180, 38],
            iconAnchor: [18, 34],
          }),
        })
          .addTo(map)
          .on('click', () => {
            shouldFollowUserRef.current = false;
            setClientExpired(false);
            setSelectedPoi(poi);
          });

        marker.bindTooltip(getPoiHoverHtml(poi), {
          direction: 'top',
          offset: [0, -24],
          opacity: 1,
          sticky: true,
          className: 'vinhhy-map-hovercard',
        });

        L.circle([poi.latitude, poi.longitude], {
          radius: poi.radiusMeters ?? 30,
          color: style.color,
          fillColor: style.color,
          fillOpacity: 0.1,
          weight: 1,
        }).addTo(map);
      });

      if (tourDetail && tourDetail.pois.length > 1) {
        const latlngs = tourDetail.pois.map((p: PublicPoiDto) => [p.latitude, p.longitude] as [number, number]);
        L.polyline(latlngs, { color: '#10b981', weight: 2, dashArray: '6 4' }).addTo(map);
        if (!userLocation && !hasUrlFocusTarget) {
          map.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40], maxZoom: MAP_DEFAULT_ZOOM });
        }
      }

      if (userLocation) {
        L.circleMarker([userLocation.latitude, userLocation.longitude], {
          radius: 8,
          color: '#ffffff',
          fillColor: '#0ea5e9',
          fillOpacity: 0.95,
          weight: 3,
        })
          .addTo(map)
          .bindTooltip('Vị trí của bạn', {
            direction: 'top',
            offset: [0, -10],
            opacity: 1,
          });

        if (userLocation.accuracy) {
          L.circle([userLocation.latitude, userLocation.longitude], {
            radius: userLocation.accuracy,
            color: '#0ea5e9',
            fillColor: '#38bdf8',
            fillOpacity: 0.08,
            weight: 1,
          }).addTo(map);
        }
      }

      if (focusLat && focusLng) {
        map.setView([parseFloat(focusLat), parseFloat(focusLng)], MAP_FOCUS_ZOOM);
      }

      scheduleMapResize(map);
    });
  }, [mapReady, poisData, tourDetail, focusLat, focusLng, userLocation, hasUrlFocusTarget]);

  const listedPois = tourDetail ? tourDetail.pois : poisData?.items ?? [];
  const selectedDistance = selectedPoi && userLocation
    ? getDistanceMeters(userLocation.latitude, userLocation.longitude, selectedPoi.latitude, selectedPoi.longitude)
    : null;

  useEffect(() => {
    if (!listedPois.length || !Number.isInteger(focusPoiId) || focusPoiId <= 0) {
      return;
    }

    const poi = listedPois.find((item) => item.id === focusPoiId);
    if (poi) {
      shouldFollowUserRef.current = false;
      setSelectedPoi(poi);
      leafletMapRef.current?.setView([poi.latitude, poi.longitude], MAP_FOCUS_ZOOM);
    }
  }, [focusPoiId, listedPois]);

  useEffect(() => {
    if (!mapReady || hasUrlFocusTarget || !navigator.geolocation) return;

    let cancelled = false;
    shouldFollowUserRef.current = true;

    if (locationWatchIdRef.current !== null) return;

    locationWatchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        if (cancelled) return;

        const nextLocation = toUserLocation(position);
        setUserLocation(nextLocation);

        if (shouldFollowUserRef.current) {
          leafletMapRef.current?.setView([nextLocation.latitude, nextLocation.longitude], MAP_FOCUS_ZOOM);
          if (leafletMapRef.current) {
            scheduleMapResize(leafletMapRef.current);
          }
        }
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
  }, [hasUrlFocusTarget, mapReady]);

  useEffect(() => {
    return () => {
      if (locationWatchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(locationWatchIdRef.current);
        locationWatchIdRef.current = null;
      }
    };
  }, []);

  const requestLocation = () => {
    setLocationMessage(null);
    if (!navigator.geolocation) {
      setLocationMessage('Trình duyệt chưa hỗ trợ định vị.');
      return;
    }

    shouldFollowUserRef.current = true;
    if (locationWatchIdRef.current !== null) {
      if (userLocation) {
        leafletMapRef.current?.setView([userLocation.latitude, userLocation.longitude], MAP_FOCUS_ZOOM);
      }
      return;
    }

    locationWatchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const nextLocation = toUserLocation(position);
        setUserLocation(nextLocation);
        if (shouldFollowUserRef.current) {
          leafletMapRef.current?.setView([nextLocation.latitude, nextLocation.longitude], MAP_FOCUS_ZOOM);
          if (leafletMapRef.current) {
            scheduleMapResize(leafletMapRef.current);
          }
        }
      },
      () => setLocationMessage('Không thể lấy vị trí hiện tại. Bạn vẫn có thể chọn POI trên bản đồ.'),
      GEOLOCATION_OPTIONS,
    );
  };

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col lg:flex-row">
      <div className="flex h-56 w-full shrink-0 flex-col overflow-hidden border-b border-gray-800 bg-gray-900 lg:h-auto lg:w-72 lg:border-b-0 lg:border-r">
        <div className="border-b border-gray-800 p-4">
          <h2 className="font-bold text-white">{tourDetail ? tourDetail.name : 'Bản đồ địa điểm'}</h2>
          <p className="mt-0.5 text-xs text-gray-400">
            {tourDetail ? `${tourDetail.pois.length} điểm dừng` : `${poisData?.totalCount ?? '-'} địa điểm`}
          </p>
          <button
            type="button"
            onClick={requestLocation}
            className="mt-3 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-medium text-gray-200 transition-colors hover:bg-gray-700"
          >
            Dùng vị trí của tôi
          </button>
          {locationMessage ? <p className="mt-2 text-xs leading-5 text-amber-300">{locationMessage}</p> : null}
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? <Spinner /> : (
            listedPois.map((poi: PublicPoiDto, i: number) => (
              <button
                key={poi.id}
                onClick={() => {
                  shouldFollowUserRef.current = false;
                  setClientExpired(false);
                  setSelectedPoi(poi);
                  leafletMapRef.current?.setView([poi.latitude, poi.longitude], MAP_DEFAULT_ZOOM);
                }}
                className={`w-full border-b border-gray-800 px-4 py-3 text-left transition-colors hover:bg-gray-800 ${
                  selectedPoi?.id === poi.id ? 'border-l-2 border-l-emerald-500 bg-gray-800' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  {tourDetail && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs text-white">
                      {i + 1}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{poi.name}</p>
                    {poi.category && <p className="text-xs text-emerald-500">{poi.category}</p>}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="relative min-h-[420px] flex-1 lg:min-h-[calc(100vh-64px)]">
        <div ref={mapRef} className="absolute inset-0 h-full w-full" />
        {selectedPoi && (
          <PublicPoiInfoPanel
            poi={selectedPoi}
            distanceMeters={selectedDistance}
            accessRecord={accessRecord}
            audioTourQuery={audioTourQuery}
            clientExpired={clientExpired}
            onClose={() => setSelectedPoi(null)}
            onExpired={() => {
              if (accessRecord) {
                guestAccessStore.remove(accessRecord.qrCode);
              }
              setClientExpired(true);
            }}
          />
        )}
      </div>
    </div>
  );
}

function scheduleMapResize(map: { invalidateSize: () => void }) {
  const resize = () => map.invalidateSize();
  window.requestAnimationFrame(resize);
  window.setTimeout(resize, 100);
  window.setTimeout(resize, 300);
}

function toUserLocation(position: GeolocationPosition): UserLocation {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
  };
}

function PublicPoiInfoPanel({
  poi,
  distanceMeters,
  accessRecord,
  audioTourQuery,
  clientExpired,
  onClose,
  onExpired,
}: {
  poi: PublicPoiDto;
  distanceMeters: number | null;
  accessRecord: GuestAccessRecord | null;
  audioTourQuery: ReturnType<typeof useQuery>;
  clientExpired: boolean;
  onClose: () => void;
  onExpired: () => void;
}) {
  const hasAccess = Boolean(accessRecord?.accessToken) && !clientExpired;

  return (
    <div className="absolute bottom-3 left-3 right-3 z-[1000] max-h-[70vh] overflow-y-auto rounded-xl border border-gray-700 bg-gray-900 p-4 shadow-2xl sm:bottom-4 sm:left-auto sm:right-4 sm:max-h-[82vh] sm:w-96">
      <button onClick={onClose} className="absolute right-3 top-3 text-gray-500 hover:text-white">X</button>
      <div className="flex gap-3">
        {poi.imageUrl ? (
          <img src={poi.imageUrl} alt={poi.name} className="h-20 w-20 shrink-0 rounded-lg object-cover" />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-gray-700 text-sm text-gray-400">POI</div>
        )}
        <div className="min-w-0 flex-1">
          {poi.category && <p className="mb-1 text-xs text-emerald-500">{poi.category}</p>}
          <h3 className="text-base font-semibold text-white">{poi.name}</h3>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
            {distanceMeters !== null ? (
              <span className="rounded-full bg-sky-500/15 px-2 py-1 text-sky-200">
                Cách bạn {formatDistance(distanceMeters)}
              </span>
            ) : null}
            <span className={`rounded-full px-2 py-1 ${hasAccess ? 'bg-emerald-500/15 text-emerald-200' : 'bg-amber-500/15 text-amber-200'}`}>
              {hasAccess ? 'Đã mở quyền nghe' : 'Cần gói nghe / QR'}
            </span>
          </div>
          <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-gray-400">
            {poi.shortDescription ?? poi.description}
          </p>
        </div>
      </div>

      <p className="mt-4 line-clamp-5 text-sm leading-relaxed text-gray-300">
        {poi.description || poi.shortDescription || 'Thông tin địa điểm đang được cập nhật.'}
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Link
          to={ROUTES.POI_DETAIL.replace(':id', String(poi.id))}
          className="block rounded-lg bg-emerald-600 py-2 text-center text-xs font-medium text-white transition-colors hover:bg-emerald-700"
        >
          Xem chi tiết
        </Link>
        <Link
          to={hasAccess ? ROUTES.POI_DETAIL.replace(':id', String(poi.id)) : ROUTES.PACKAGES}
          className="block rounded-lg border border-gray-700 bg-gray-800 py-2 text-center text-xs font-medium text-gray-100 transition-colors hover:bg-gray-700"
        >
          {hasAccess ? 'Nghe thuyết minh' : 'Mở quyền nghe'}
        </Link>
      </div>

      <div className="mt-4">
        <h4 className="mb-2 text-sm font-semibold text-white">Thuyết minh audio</h4>
        {clientExpired ? (
          <AccessExpiredPanel />
        ) : !accessRecord?.accessToken ? (
          <AccessRequiredPanel
            title="Cần mã nghe"
            message="Quét QR tại địa điểm hoặc chọn gói nghe để phát audio bảo vệ."
          />
        ) : audioTourQuery.isLoading ? (
          <Spinner />
        ) : audioTourQuery.isError ? (
          getAudioTourErrorKind(audioTourQuery.error) === 'unauthorized' ? (
            <AccessExpiredPanel />
          ) : (
            <div className="rounded-lg bg-gray-800 p-3 text-xs text-gray-400">
              {getAudioTourErrorMessage(getAudioTourErrorKind(audioTourQuery.error))}
            </div>
          )
        ) : !audioTourQuery.data ? (
          <div className="rounded-lg bg-gray-800 p-3 text-xs text-gray-400">
            {getAudioTourErrorMessage('notfound')}
          </div>
        ) : (
          <div className="space-y-3">
            {(audioTourQuery.data as any).audioTracks?.some((track: any) => track.isAvailable) ? (
              (audioTourQuery.data as any).audioTracks
                .filter((track: any) => track.isAvailable)
                .map((track: any) => (
                  <ProtectedAudioPlayer
                    key={track.audioTrackId ?? track.id}
                    track={track}
                    poiName={poi.name}
                    accessToken={accessRecord.accessToken}
                    onUnauthorized={onExpired}
                  />
                ))
            ) : (
              <div className="rounded-lg bg-gray-800 p-3 text-xs text-gray-400">Điểm này chưa có bản thuyết minh.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function getAccessRecordForPoi(poiId: number): GuestAccessRecord | null {
  return guestAccessStore.getForPoi(poiId) ?? guestAccessStore.getAnyActive();
}

function getCategoryStyle(category?: string | null) {
  if (!category) {
    return CATEGORY_STYLES[0];
  }

  const normalized = category.toLowerCase();
  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash += normalized.charCodeAt(i);
  }

  return CATEGORY_STYLES[hash % CATEGORY_STYLES.length];
}

function getPoiHoverHtml(poi: PublicPoiDto): string {
  return `
    <div style="max-width:240px;text-align:left;">
      <div style="font-weight:700;color:#111827;">${escapeHtml(poi.name || poi.code)}</div>
      <div style="font-size:12px;color:#6b7280;">${escapeHtml(poi.category || 'POI')}</div>
      ${poi.shortDescription ? `<div style="margin-top:4px;font-size:12px;line-height:1.35;color:#374151;">${escapeHtml(poi.shortDescription)}</div>` : ''}
    </div>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadiusMeters = 6371000;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(distanceMeters: number): string {
  if (distanceMeters >= 1000) {
    return `${(distanceMeters / 1000).toFixed(1)} km`;
  }

  return `${Math.round(distanceMeters)} m`;
}
