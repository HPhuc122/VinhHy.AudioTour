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

const CATEGORY_STYLES = [
  { icon: 'M', color: '#2563eb' },
  { icon: 'F', color: '#16a34a' },
  { icon: 'S', color: '#f59e0b' },
] as const;

export function MapPage({ lang }: Props) {
  const [searchParams] = useSearchParams();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const [selectedPoi, setSelectedPoi] = useState<PublicPoiDto | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [clientExpired, setClientExpired] = useState(false);

  const tourId = searchParams.get('tour');
  const focusLat = searchParams.get('lat');
  const focusLng = searchParams.get('lng');

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

    import('leaflet').then((L) => {
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
    });

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

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
        map.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40], maxZoom: MAP_DEFAULT_ZOOM });
      }

      if (focusLat && focusLng) {
        map.setView([parseFloat(focusLat), parseFloat(focusLng)], MAP_FOCUS_ZOOM);
      }
    });
  }, [mapReady, poisData, tourDetail, focusLat, focusLng]);

  const listedPois = tourDetail ? tourDetail.pois : poisData?.items ?? [];

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="flex w-72 shrink-0 flex-col overflow-hidden border-r border-gray-800 bg-gray-900">
        <div className="border-b border-gray-800 p-4">
          <h2 className="font-bold text-white">{tourDetail ? tourDetail.name : 'All POIs'}</h2>
          <p className="mt-0.5 text-xs text-gray-400">
            {tourDetail ? `${tourDetail.pois.length} POIs` : `${poisData?.totalCount ?? '-'} POIs`}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? <Spinner /> : (
            listedPois.map((poi: PublicPoiDto, i: number) => (
              <button
                key={poi.id}
                onClick={() => {
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

      <div className="relative flex-1">
        <div ref={mapRef} className="h-full w-full" />
        {selectedPoi && (
          <PublicPoiInfoPanel
            poi={selectedPoi}
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

function PublicPoiInfoPanel({
  poi,
  accessRecord,
  audioTourQuery,
  clientExpired,
  onClose,
  onExpired,
}: {
  poi: PublicPoiDto;
  accessRecord: GuestAccessRecord | null;
  audioTourQuery: ReturnType<typeof useQuery>;
  clientExpired: boolean;
  onClose: () => void;
  onExpired: () => void;
}) {
  return (
    <div className="absolute bottom-4 left-4 right-4 z-[1000] max-h-[82vh] overflow-y-auto rounded-xl border border-gray-700 bg-gray-900 p-4 shadow-2xl sm:left-auto sm:right-4 sm:w-96">
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
          <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-gray-400">
            {poi.shortDescription ?? poi.description}
          </p>
        </div>
      </div>

      <p className="mt-4 line-clamp-5 text-sm leading-relaxed text-gray-300">
        {poi.description || poi.shortDescription || 'Description is being updated.'}
      </p>

      <Link
        to={ROUTES.POI_DETAIL.replace(':id', String(poi.id))}
        className="mt-4 block rounded-lg bg-emerald-600 py-2 text-center text-xs text-white transition-colors hover:bg-emerald-700"
      >
        View details
      </Link>

      <div className="mt-4">
        <h4 className="mb-2 text-sm font-semibold text-white">Audio narration</h4>
        {clientExpired ? (
          <AccessExpiredPanel />
        ) : !accessRecord?.accessToken ? (
          <AccessRequiredPanel
            title="GuestAccessPass required"
            message="Scan the POI QR code to unlock protected audio playback."
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
                    accessToken={accessRecord.accessToken}
                    onUnauthorized={onExpired}
                  />
                ))
            ) : (
              <div className="rounded-lg bg-gray-800 p-3 text-xs text-gray-400">Audio is being updated.</div>
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
