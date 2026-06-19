import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { poisApi } from '../../api/poisApi';
import { toursApi } from '../../api/toursApi';
import { Spinner } from '../../components/ui/Spinner';
import { ROUTES } from '../../routes/routeConstants';
import type { Lang } from '../../hooks/useLanguage';
import type { PoiDto } from '../../types/api';
import {
  MAP_ATTRIBUTION,
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_FOCUS_ZOOM,
  MAP_MAX_ZOOM,
  MAP_TILE_URL,
} from '../../config/mapConfig';

interface Props { lang: Lang; }

// Vĩnh Hy center coordinates
export function MapPage({ lang }: Props) {
  const [searchParams] = useSearchParams();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const [selectedPoi, setSelectedPoi] = useState<PoiDto | null>(null);
  const [mapReady, setMapReady] = useState(false);

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

  // Init Leaflet
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

  // Add markers when POIs loaded
  useEffect(() => {
    if (!mapReady || !leafletMapRef.current || !poisData) return;

    import('leaflet').then((L) => {
      const map = leafletMapRef.current;

      // Clear existing markers
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker || layer instanceof L.Circle) {
          map.removeLayer(layer);
        }
      });

      const pois = tourDetail ? tourDetail.pois : poisData.items;

      pois.forEach((poi: PoiDto, index: number) => {
        const icon = L.divIcon({
          html: `<div style="
            background: ${tourDetail ? '#10b981' : '#3b82f6'};
            color: white;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          ">${tourDetail ? index + 1 : '📍'}</div>`,
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([poi.latitude, poi.longitude], { icon })
          .addTo(map)
          .on('click', () => setSelectedPoi(poi));

        // Geofence circle
        L.circle([poi.latitude, poi.longitude], {
          radius: poi.radiusMeters ?? 30,
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: 0.1,
          weight: 1,
        }).addTo(map);
      });

      // Draw tour route line
      if (tourDetail && tourDetail.pois.length > 1) {
        const latlngs = tourDetail.pois.map((p: PoiDto) => [p.latitude, p.longitude] as [number, number]);
        L.polyline(latlngs, { color: '#10b981', weight: 2, dashArray: '6 4' }).addTo(map);
        map.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40] });
      }

      // Focus on specific POI
      if (focusLat && focusLng) {
        map.setView([parseFloat(focusLat), parseFloat(focusLng)], MAP_FOCUS_ZOOM);
      }
    });
  }, [mapReady, poisData, tourDetail, focusLat, focusLng]);

  return (
    <div className="h-[calc(100vh-64px)] flex">
      {/* Sidebar */}
      <div className="w-72 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h2 className="font-bold text-white">
            {tourDetail ? `🗺️ ${tourDetail.name}` : '📍 Tất cả địa điểm'}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {tourDetail ? `${tourDetail.pois.length} địa điểm` : `${poisData?.totalCount ?? '—'} địa điểm`}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? <Spinner /> : (
            (tourDetail ? tourDetail.pois : poisData?.items ?? []).map((poi: PoiDto, i: number) => (
              <button
                key={poi.id}
                onClick={() => {
                  setSelectedPoi(poi);
                  leafletMapRef.current?.setView([poi.latitude, poi.longitude], MAP_DEFAULT_ZOOM);
                }}
                className={`w-full text-left px-4 py-3 border-b border-gray-800 hover:bg-gray-800 transition-colors ${
                  selectedPoi?.id === poi.id ? 'bg-gray-800 border-l-2 border-l-emerald-500' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  {tourDetail && (
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{poi.name}</p>
                    {poi.category && <p className="text-xs text-emerald-500">{poi.category}</p>}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Map + POI popup */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" />

        {/* Selected POI popup */}
        {selectedPoi && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-gray-900 border border-gray-700 rounded-xl p-4 shadow-2xl z-[1000]">
            <button
              onClick={() => setSelectedPoi(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-white"
            >✕</button>
            <div className="flex gap-3">
              {selectedPoi.imageUrl ? (
                <img src={selectedPoi.imageUrl} alt={selectedPoi.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gray-700 flex items-center justify-center text-2xl shrink-0">📍</div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-sm">{selectedPoi.name}</h3>
                {selectedPoi.category && <p className="text-xs text-emerald-500 mb-1">{selectedPoi.category}</p>}
                <p className="text-gray-400 text-xs line-clamp-2">{selectedPoi.shortDescription ?? selectedPoi.description}</p>
              </div>
            </div>
            <Link
              to={ROUTES.POI_DETAIL.replace(':id', String(selectedPoi.id))}
              className="block text-center mt-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 rounded-lg transition-colors"
            >
              Xem chi tiết
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
