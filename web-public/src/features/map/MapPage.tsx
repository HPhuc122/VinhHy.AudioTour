import { useEffect, useRef, useState } from 'react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { poisApi } from '../../api/poisApi';
import { publicAudioTourApi, type AudioTourTriggerType, type PublicAudioTourPoiDto } from '../../api/publicAudioTourApi';
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
import { useI18n, type MessageKey } from '../../i18n/I18nContext';
import {
  MAP_ATTRIBUTION,
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_FOCUS_ZOOM,
  MAP_MAX_ZOOM,
  MAP_OFFLINE_TILE_URL,
  MAP_TILE_URL,
} from '../../config/mapConfig';

interface Props { lang: Lang; }

interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface GeofenceCandidate {
  poi: PublicPoiDto;
  distanceMeters: number;
  radiusMeters: number;
  insideRatio: number;
}

interface RouteSummary {
  distanceMeters: number;
  durationSeconds: number;
}

interface DirectionsResult extends RouteSummary {
  latLngs: [number, number][];
}

interface OrsDirectionsResponse {
  routes?: Array<{
    geometry?: string | { coordinates?: number[][] };
    summary?: { distance?: number; duration?: number };
  }>;
  features?: Array<{
    geometry?: { coordinates?: number[][] };
    properties?: { summary?: { distance?: number; duration?: number } };
  }>;
  error?: string | { message?: string };
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

const ORS_DIRECTIONS_URL = 'https://api.openrouteservice.org/v2/directions/driving-car';
const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY?.trim()
  || 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjcwN2MyZTA0Y2JjODQ0OTg4NWM4OTk3MjIwOTE4NTlmIiwiaCI6Im11cm11cjY0In0=';

const DEFAULT_GEOFENCE_RADIUS_METERS = 30;
const DEFAULT_GEOFENCE_COOLDOWN_SECONDS = 300;

export function MapPage({ lang }: Props) {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const contentLayersRef = useRef<any[]>([]);
  const userLocationLayersRef = useRef<any[]>([]);
  const routeLayerRef = useRef<any>(null);
  const fittedRouteTargetRef = useRef<string | null>(null);
  const locationWatchIdRef = useRef<number | null>(null);
  const shouldFollowUserRef = useRef(false);
  const appliedUrlFocusRef = useRef<string | null>(null);
  const geofenceEnteredAtRef = useRef<Map<number, number>>(new Map());
  const geofenceLastPlayedAtRef = useRef<Map<number, number>>(new Map());
  const dismissedGeofencePoiIdsRef = useRef<Set<number>>(new Set());
  const [selectedPoi, setSelectedPoi] = useState<PublicPoiDto | null>(null);
  const [selectedPoiTrigger, setSelectedPoiTrigger] = useState<AudioTourTriggerType>('manual');
  const [navigationPoi, setNavigationPoi] = useState<PublicPoiDto | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [clientExpired, setClientExpired] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [autoAudioEnabled, setAutoAudioEnabled] = useState(true);
  const [autoAudioMessage, setAutoAudioMessage] = useState<string | null>(null);
  const [autoPlayRequestKey, setAutoPlayRequestKey] = useState(0);
  const [geofenceTick, setGeofenceTick] = useState(0);
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  const tourId = searchParams.get('tour');
  const focusPoiId = Number(searchParams.get('poi'));
  const focusLat = searchParams.get('lat');
  const focusLng = searchParams.get('lng');
  const urlFocusSignature = `${focusPoiId}|${focusLat ?? ''}|${focusLng ?? ''}`;
  // Rounding to about 11 metres prevents a noisy GPS watch from repeatedly
  // consuming the Directions API quota while the user is standing still.
  const routeStartLatitude = userLocation ? Number(userLocation.latitude.toFixed(4)) : null;
  const routeStartLongitude = userLocation ? Number(userLocation.longitude.toFixed(4)) : null;
  const routeTargetSignature = tourId
    ? `tour:${tourId}`
    : navigationPoi
      ? `poi:${navigationPoi.id}`
      : null;

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
  const audioTourQuery = useQuery<PublicAudioTourPoiDto>({
    queryKey: ['public-map-audio-tour', selectedPoi?.id, lang, accessRecord?.accessToken, selectedPoiTrigger],
    queryFn: () => publicAudioTourApi.getPoi(selectedPoi!.id, accessRecord!.accessToken, lang, selectedPoiTrigger),
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
        errorTileUrl: MAP_OFFLINE_TILE_URL,
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
    const markOnline = () => setIsOnline(true);
    const markOffline = () => setIsOnline(false);
    window.addEventListener('online', markOnline);
    window.addEventListener('offline', markOffline);
    return () => {
      window.removeEventListener('online', markOnline);
      window.removeEventListener('offline', markOffline);
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

      contentLayersRef.current.forEach((layer) => map.removeLayer(layer));
      contentLayersRef.current = [];

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
            setSelectedPoiTrigger('manual');
            setAutoPlayRequestKey((current) => current + 1);
            setSelectedPoi(poi);
          });

        marker.bindTooltip(getPoiHoverHtml(poi), {
          direction: 'top',
          offset: [0, -24],
          opacity: 1,
          sticky: true,
          className: 'vinhhy-map-hovercard',
        });

        const radiusCircle = L.circle([poi.latitude, poi.longitude], {
          radius: poi.radiusMeters ?? 30,
          color: style.color,
          fillColor: style.color,
          fillOpacity: 0.1,
          weight: 1,
        }).addTo(map);
        contentLayersRef.current.push(marker, radiusCircle);
      });

      scheduleMapResize(map);
    });
  }, [mapReady, poisData, tourDetail]);

  useEffect(() => {
    if (!mapReady || !leafletMapRef.current) return;

    const map = leafletMapRef.current;
    const controller = new AbortController();
    let cancelled = false;

    // A route has its own layer so replacing it never removes markers, popups,
    // radius circles, the user-location layer, or any other map content.
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    setRouteSummary(null);
    setRouteError(null);

    const routePois = tourId
      ? tourDetail?.pois ?? []
      : navigationPoi ? [navigationPoi] : [];
    if (routePois.length === 0 || routeStartLatitude === null || routeStartLongitude === null) {
      fittedRouteTargetRef.current = null;
      setRouteLoading(false);
      return () => controller.abort();
    }

    setRouteLoading(true);
    const coordinates: [number, number][] = [
      [routeStartLongitude, routeStartLatitude],
      ...routePois.map(
        (poi: PublicPoiDto) => [poi.longitude, poi.latitude] as [number, number],
      ),
    ];

    void (async () => {
      try {
        const result = await getDrivingRoute(coordinates, controller.signal);
        if (cancelled || !leafletMapRef.current) return;

        const L = await import('leaflet');
        if (cancelled || !leafletMapRef.current) return;

        // Remove once more in case another layer was assigned while the request
        // was in flight. Only one route polyline can exist at any time.
        if (routeLayerRef.current) {
          map.removeLayer(routeLayerRef.current);
        }

        const routeLine = L.polyline(result.latLngs, {
          color: '#10b981',
          weight: 5,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);

        routeLayerRef.current = routeLine;
        setRouteSummary({
          distanceMeters: result.distanceMeters,
          durationSeconds: result.durationSeconds,
        });
        if (routeTargetSignature && fittedRouteTargetRef.current !== routeTargetSignature) {
          map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });
          fittedRouteTargetRef.current = routeTargetSignature;
        }
        scheduleMapResize(map);
      } catch (error) {
        if (cancelled || (error instanceof DOMException && error.name === 'AbortError')) return;
        setRouteError(getRouteErrorMessage(error, t));
      } finally {
        if (!cancelled) setRouteLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [mapReady, navigationPoi, routeStartLatitude, routeStartLongitude, routeTargetSignature, t, tourDetail, tourId]);

  useEffect(() => {
    if (tourId) setNavigationPoi(null);
  }, [tourId]);

  useEffect(() => {
    if (!mapReady || !leafletMapRef.current) return;

    let cancelled = false;
    import('leaflet').then((L) => {
      if (cancelled || !leafletMapRef.current) return;
      const map = leafletMapRef.current;
      userLocationLayersRef.current.forEach((layer) => map.removeLayer(layer));
      userLocationLayersRef.current = [];
      if (!userLocation) return;

      const accuracyCircle = userLocation.accuracy
        ? L.circle([userLocation.latitude, userLocation.longitude], {
            radius: userLocation.accuracy,
            color: '#0ea5e9',
            fillColor: '#38bdf8',
            fillOpacity: 0.08,
            weight: 1,
          }).addTo(map)
        : null;
      const locationMarker = L.circleMarker([userLocation.latitude, userLocation.longitude], {
        radius: 8,
        color: '#ffffff',
        fillColor: '#0ea5e9',
        fillOpacity: 0.95,
        weight: 3,
      }).addTo(map).bindTooltip(t('currentLocation'), {
        direction: 'top',
        offset: [0, -10],
        opacity: 1,
      });

      userLocationLayersRef.current = accuracyCircle
        ? [accuracyCircle, locationMarker]
        : [locationMarker];
    });

    return () => { cancelled = true; };
  }, [mapReady, userLocation, t]);

  const listedPois = tourDetail ? tourDetail.pois : poisData?.items ?? [];
  const selectedDistance = selectedPoi && userLocation
    ? getDistanceMeters(userLocation.latitude, userLocation.longitude, selectedPoi.latitude, selectedPoi.longitude)
    : null;
  const selectedPoiId = selectedPoi?.id ?? null;
  const navigationPoiId = navigationPoi?.id ?? null;

  useEffect(() => {
    if (!listedPois.length) return;

    if (selectedPoiId) {
      const localizedSelectedPoi = listedPois.find((item) => item.id === selectedPoiId);
      if (localizedSelectedPoi) setSelectedPoi(localizedSelectedPoi);
    }

    if (navigationPoiId) {
      const localizedNavigationPoi = listedPois.find((item) => item.id === navigationPoiId);
      if (localizedNavigationPoi) setNavigationPoi(localizedNavigationPoi);
    }
  }, [listedPois, navigationPoiId, selectedPoiId]);

  useEffect(() => {
    if (!autoAudioEnabled || !userLocation || !listedPois.length) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setGeofenceTick((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [autoAudioEnabled, listedPois.length, userLocation]);

  useEffect(() => {
    if (!autoAudioEnabled) {
      geofenceEnteredAtRef.current.clear();
      dismissedGeofencePoiIdsRef.current.clear();
      setAutoAudioMessage(null);
      return;
    }

    if (!userLocation || !listedPois.length) {
      geofenceEnteredAtRef.current.clear();
      return;
    }

    const now = Date.now();
    const candidates = getGeofenceCandidates(listedPois, userLocation);
    const candidateIds = new Set(candidates.map((candidate) => candidate.poi.id));

    for (const poiId of geofenceEnteredAtRef.current.keys()) {
      if (!candidateIds.has(poiId)) {
        geofenceEnteredAtRef.current.delete(poiId);
        dismissedGeofencePoiIdsRef.current.delete(poiId);
      }
    }

    const visibleCandidates = candidates.filter(
      (candidate) => !dismissedGeofencePoiIdsRef.current.has(candidate.poi.id),
    );

    for (const candidate of visibleCandidates) {
      if (!geofenceEnteredAtRef.current.has(candidate.poi.id)) {
        geofenceEnteredAtRef.current.set(candidate.poi.id, now);
      }
    }

    const readyCandidate = visibleCandidates.find((candidate) => {
      const enteredAt = geofenceEnteredAtRef.current.get(candidate.poi.id) ?? now;
      const dwellMilliseconds = getGeofenceMinDwellSeconds(candidate.poi) * 1000;
      return now - enteredAt >= dwellMilliseconds;
    });

    if (!readyCandidate) {
      return;
    }

    const lastPlayedAt = geofenceLastPlayedAtRef.current.get(readyCandidate.poi.id);
    const cooldownMilliseconds = getGeofenceCooldownSeconds(readyCandidate.poi) * 1000;
    if (lastPlayedAt && now - lastPlayedAt < cooldownMilliseconds) {
      return;
    }

    const nearbyAccessRecord = getAccessRecordForPoi(readyCandidate.poi.id);
    if (!nearbyAccessRecord?.accessToken) {
      if (selectedPoiId !== readyCandidate.poi.id || selectedPoiTrigger !== 'gps') {
        setClientExpired(false);
        setSelectedPoiTrigger('gps');
        setSelectedPoi(readyCandidate.poi);
      }
      setAutoAudioMessage(`${t('geofenceAccessRequired')}: ${readyCandidate.poi.name}`);
      return;
    }

    geofenceLastPlayedAtRef.current.set(readyCandidate.poi.id, now);
    setClientExpired(false);
    setSelectedPoiTrigger('gps');
    setAutoPlayRequestKey((current) => current + 1);
    setSelectedPoi(readyCandidate.poi);
    setAutoAudioMessage(`${t('geofenceDetected')}: ${readyCandidate.poi.name}`);
  }, [
    autoAudioEnabled,
    geofenceTick,
    listedPois,
    selectedPoiId,
    selectedPoiTrigger,
    t,
    userLocation,
  ]);

  useEffect(() => {
    if (!mapReady || !leafletMapRef.current || appliedUrlFocusRef.current === urlFocusSignature) return;

    if (Number.isInteger(focusPoiId) && focusPoiId > 0) {
      if (!listedPois.length) return;
      const poi = listedPois.find((item) => item.id === focusPoiId);
      if (poi) {
        shouldFollowUserRef.current = false;
        setSelectedPoiTrigger('manual');
        setAutoPlayRequestKey((current) => current + 1);
        setSelectedPoi(poi);
        leafletMapRef.current.setView([poi.latitude, poi.longitude], MAP_FOCUS_ZOOM);
        appliedUrlFocusRef.current = urlFocusSignature;
        return;
      }
    }

    const latitude = focusLat ? Number(focusLat) : NaN;
    const longitude = focusLng ? Number(focusLng) : NaN;
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      shouldFollowUserRef.current = false;
      leafletMapRef.current.setView([latitude, longitude], MAP_FOCUS_ZOOM);
    }

    appliedUrlFocusRef.current = urlFocusSignature;
  }, [focusLat, focusLng, focusPoiId, listedPois, mapReady, urlFocusSignature]);

  useEffect(() => {
    if (!mapReady || !navigator.geolocation) return;

    let cancelled = false;

    if (locationWatchIdRef.current !== null) return;

    locationWatchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        if (cancelled) return;

        const nextLocation = toUserLocation(position);
        setUserLocation(nextLocation);
        setLocationMessage(null);

        if (shouldFollowUserRef.current) {
          leafletMapRef.current?.setView([nextLocation.latitude, nextLocation.longitude], MAP_FOCUS_ZOOM);
          shouldFollowUserRef.current = false;
          if (leafletMapRef.current) {
            scheduleMapResize(leafletMapRef.current);
          }
        }
      },
      () => setLocationMessage(t('geoFailed')),
      GEOLOCATION_OPTIONS,
    );

    return () => {
      cancelled = true;
      if (locationWatchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(locationWatchIdRef.current);
        locationWatchIdRef.current = null;
      }
    };
  }, [mapReady, t]);

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
      setLocationMessage(t('geoUnsupported'));
      return;
    }

    shouldFollowUserRef.current = true;
    if (locationWatchIdRef.current !== null) {
      if (userLocation) {
        leafletMapRef.current?.setView([userLocation.latitude, userLocation.longitude], MAP_FOCUS_ZOOM);
        shouldFollowUserRef.current = false;
      }
      return;
    }

    locationWatchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const nextLocation = toUserLocation(position);
        setUserLocation(nextLocation);
        setLocationMessage(null);
        if (shouldFollowUserRef.current) {
          leafletMapRef.current?.setView([nextLocation.latitude, nextLocation.longitude], MAP_FOCUS_ZOOM);
          shouldFollowUserRef.current = false;
          if (leafletMapRef.current) {
            scheduleMapResize(leafletMapRef.current);
          }
        }
      },
      () => setLocationMessage(t('geoFailed')),
      GEOLOCATION_OPTIONS,
    );
  };

  const toggleAutoAudio = () => {
    const willEnable = !autoAudioEnabled;
    setAutoAudioEnabled(willEnable);

    if (willEnable) {
      geofenceLastPlayedAtRef.current.clear();
      setGeofenceTick((current) => current + 1);
      setAutoAudioMessage(t('geofenceListening'));
      requestLocation();
    } else {
      setAutoAudioMessage(null);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col lg:flex-row">
      <div className="flex h-56 w-full shrink-0 flex-col overflow-hidden border-b border-gray-800 bg-gray-900 lg:h-auto lg:w-72 lg:border-b-0 lg:border-r">
        <div className="border-b border-gray-800 p-4">
          <h2 className="font-bold text-white">{tourDetail ? tourDetail.name : t('map')}</h2>
          <p className="mt-0.5 text-xs text-gray-400">
            {tourDetail ? `${tourDetail.pois.length} điểm dừng` : `${poisData?.totalCount ?? '-'} địa điểm`}
          </p>
          <button
            type="button"
            onClick={requestLocation}
            className="mt-3 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-medium text-gray-200 transition-colors hover:bg-gray-700"
          >
            {t('locateMe')}
          </button>
          <button
            type="button"
            onClick={toggleAutoAudio}
            className={`mt-2 w-full rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
              autoAudioEnabled
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'border border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700'
            }`}
          >
            {autoAudioEnabled ? t('geofenceAutoOn') : t('geofenceAutoOff')}
          </button>
          {locationMessage ? <p className="mt-2 text-xs leading-5 text-amber-300">{locationMessage}</p> : null}
          {autoAudioMessage ? <p className="mt-2 text-xs leading-5 text-emerald-200">{autoAudioMessage}</p> : null}
          {(tourDetail?.pois.length || navigationPoi) ? (
            <div className="mt-3 rounded-lg border border-gray-700 bg-gray-800 p-3 text-xs">
              {navigationPoi && !tourId ? (
                <p className="mb-2 truncate text-gray-300">
                  {t('directionsTo')}: <span className="font-semibold text-white">{navigationPoi.name}</span>
                </p>
              ) : null}
              {!userLocation ? (
                <p className="leading-5 text-amber-300">
                  {t('routeWaitingForLocation')}
                </p>
              ) : routeLoading ? (
                <p className="text-gray-300">{t('routeLoading')}</p>
              ) : routeError ? (
                <p className="leading-5 text-red-300">{routeError}</p>
              ) : routeSummary ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-gray-400">{t('routeDistance')}</p>
                    <p className="mt-0.5 font-semibold text-white">
                      {(routeSummary.distanceMeters / 1000).toFixed(2)} km
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">{t('routeDuration')}</p>
                    <p className="mt-0.5 font-semibold text-white">
                      {Math.ceil(routeSummary.durationSeconds / 60)} {t('minutes')}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? <Spinner /> : (
            listedPois.map((poi: PublicPoiDto, i: number) => (
              <button
                key={poi.id}
                onClick={() => {
                  shouldFollowUserRef.current = false;
                  setClientExpired(false);
                  setSelectedPoiTrigger('manual');
                  setAutoPlayRequestKey((current) => current + 1);
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
        {!isOnline ? (
          <div className="absolute left-3 top-3 z-[1000] max-w-xs rounded-lg border border-amber-400/40 bg-gray-900/95 px-3 py-2 text-xs leading-5 text-amber-200 shadow-lg">
            {t('offlineMapNotice')}
          </div>
        ) : null}
        {selectedPoi && (
          <PublicPoiInfoPanel
            poi={selectedPoi}
            distanceMeters={selectedDistance}
            accessRecord={accessRecord}
            audioTourQuery={audioTourQuery}
            clientExpired={clientExpired}
            isNavigating={navigationPoi?.id === selectedPoi.id}
            selectionTrigger={selectedPoiTrigger}
            autoPlayRequestKey={autoPlayRequestKey}
            onNavigate={!tourId ? () => {
              shouldFollowUserRef.current = false;
              setNavigationPoi({ ...selectedPoi });
              if (!userLocation) requestLocation();
            } : undefined}
            onClose={() => {
              if (selectedPoiTrigger === 'gps') {
                dismissedGeofencePoiIdsRef.current.add(selectedPoi.id);
                geofenceLastPlayedAtRef.current.delete(selectedPoi.id);
              }
              setSelectedPoi(null);
            }}
            onAutoPlayBlocked={() => {
              setAutoAudioMessage(t('geofenceAutoplayBlocked'));
            }}
            onAutoPlayStarted={() => {
              setAutoAudioMessage(`${t('geofencePlaying')}: ${selectedPoi.name}`);
            }}
            onExpired={() => {
              if (accessRecord) {
                guestAccessStore.remove(accessRecord.qrCode);
              }
              geofenceLastPlayedAtRef.current.delete(selectedPoi.id);
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

async function getDrivingRoute(
  coordinates: [number, number][],
  signal: AbortSignal,
): Promise<DirectionsResult> {
  const response = await fetch(ORS_DIRECTIONS_URL, {
    method: 'POST',
    signal,
    headers: {
      Authorization: ORS_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      coordinates,
      instructions: false,
    }),
  });

  let data: OrsDirectionsResponse | null = null;
  try {
    data = await response.json() as OrsDirectionsResponse;
  } catch {
    // The status-specific message below is more useful than a JSON parse error.
  }

  if (!response.ok) {
    const apiMessage = typeof data?.error === 'string' ? data.error : data?.error?.message;
    if (response.status === 401 || response.status === 403) {
      throw new Error('API_KEY_INVALID');
    }
    if (response.status === 404) {
      throw new Error('ROUTE_NOT_FOUND');
    }
    if (apiMessage && /(?:could not|unable to|cannot) find (?:a )?route|route not found/i.test(apiMessage)) {
      throw new Error('ROUTE_NOT_FOUND');
    }
    if (response.status === 429) {
      throw new Error('API_RATE_LIMIT');
    }
    throw new Error(apiMessage || `ORS_API_${response.status}`);
  }

  const route = data?.routes?.[0];
  const feature = data?.features?.[0];
  const geometry = route?.geometry ?? feature?.geometry;
  const summary = route?.summary ?? feature?.properties?.summary;

  const latLngs = typeof geometry === 'string'
    ? decodeOrsPolyline(geometry)
    : geometry?.coordinates?.map(([longitude, latitude]) => [latitude, longitude] as [number, number]) ?? [];

  if (latLngs.length < 2) {
    throw new Error('ROUTE_NOT_FOUND');
  }

  return {
    latLngs,
    distanceMeters: Number(summary?.distance) || 0,
    durationSeconds: Number(summary?.duration) || 0,
  };
}

/** Decode the precision-5 encoded polyline returned by ORS JSON Directions. */
function decodeOrsPolyline(encoded: string): [number, number][] {
  const coordinates: [number, number][] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < encoded.length) {
    const latitudeChange = decodePolylineValue(encoded, index);
    index = latitudeChange.nextIndex;
    const longitudeChange = decodePolylineValue(encoded, index);
    index = longitudeChange.nextIndex;
    latitude += latitudeChange.value;
    longitude += longitudeChange.value;
    coordinates.push([latitude / 1e5, longitude / 1e5]);
  }

  return coordinates;
}

function decodePolylineValue(encoded: string, startIndex: number): { value: number; nextIndex: number } {
  let index = startIndex;
  let result = 0;
  let shift = 0;
  let byte: number;

  do {
    if (index >= encoded.length) throw new Error('ROUTE_GEOMETRY_INVALID');
    byte = encoded.charCodeAt(index++) - 63;
    result |= (byte & 0x1f) << shift;
    shift += 5;
  } while (byte >= 0x20);

  return {
    value: result & 1 ? ~(result >> 1) : result >> 1,
    nextIndex: index,
  };
}

function getRouteErrorMessage(error: unknown, t: (key: MessageKey) => string): string {
  if (error instanceof TypeError) {
    return t('routeNetworkError');
  }

  const message = error instanceof Error ? error.message : '';
  if (message === 'API_KEY_INVALID') {
    return t('routeApiKeyError');
  }
  if (message === 'ROUTE_NOT_FOUND') {
    return t('routeNotFound');
  }
  if (message === 'API_RATE_LIMIT') {
    return t('routeRateLimit');
  }
  if (message === 'ROUTE_GEOMETRY_INVALID') {
    return t('routeGeometryError');
  }
  return message
    ? `${t('routeApiError')}: ${message}`
    : t('routeLoadError');
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
  isNavigating,
  selectionTrigger,
  autoPlayRequestKey,
  onNavigate,
  onClose,
  onAutoPlayBlocked,
  onAutoPlayStarted,
  onExpired,
}: {
  poi: PublicPoiDto;
  distanceMeters: number | null;
  accessRecord: GuestAccessRecord | null;
  audioTourQuery: UseQueryResult<PublicAudioTourPoiDto, Error>;
  clientExpired: boolean;
  isNavigating: boolean;
  selectionTrigger: AudioTourTriggerType;
  autoPlayRequestKey: number;
  onNavigate?: () => void;
  onClose: () => void;
  onAutoPlayBlocked: () => void;
  onAutoPlayStarted: () => void;
  onExpired: () => void;
}) {
  const { t } = useI18n();
  const hasAccess = Boolean(accessRecord?.accessToken) && !clientExpired;
  const availableAudioTracks = audioTourQuery.data?.audioTracks.filter((track) => track.isAvailable) ?? [];

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
        {onNavigate ? (
          <button
            type="button"
            onClick={onNavigate}
            disabled={isNavigating}
            className="rounded-lg bg-sky-600 py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-sky-700 disabled:cursor-default disabled:bg-sky-800 disabled:text-sky-200 sm:col-span-2"
          >
            {isNavigating ? t('directionsActive') : t('directions')}
          </button>
        ) : null}
        <Link
          to={ROUTES.POI_DETAIL.replace(':id', String(poi.id))}
          className="block rounded-lg bg-emerald-600 py-2 text-center text-xs font-medium text-white transition-colors hover:bg-emerald-700"
        >
          {t('viewDetails')}
        </Link>
        <Link
          to={hasAccess ? ROUTES.POI_DETAIL.replace(':id', String(poi.id)) : ROUTES.PACKAGES}
          className="block rounded-lg border border-gray-700 bg-gray-800 py-2 text-center text-xs font-medium text-gray-100 transition-colors hover:bg-gray-700"
        >
          {hasAccess ? t('listen') : t('accessRequired')}
        </Link>
      </div>

      <div className="mt-4">
        <h4 className="mb-2 text-sm font-semibold text-white">{t('selectedLanguageAudio')}</h4>
        {selectionTrigger === 'gps' && hasAccess ? (
          <div className="mb-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs leading-5 text-emerald-100">
            {t('geofencePlayPrompt')}
          </div>
        ) : null}
        {clientExpired ? (
          <AccessExpiredPanel />
        ) : !accessRecord?.accessToken ? (
          <AccessRequiredPanel
            title="Cần mã nghe"
            message={t('accessRequiredMessage')}
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
            {availableAudioTracks.length > 0 ? (
              availableAudioTracks
                .map((track, index) => (
                  <ProtectedAudioPlayer
                    key={track.audioTrackId ?? track.id}
                    track={track}
                    poiName={poi.name}
                    accessToken={accessRecord.accessToken}
                    autoPlay={index === 0 && hasAccess}
                    autoPlayKey={`${poi.id}:${track.audioTrackId ?? track.id}:${selectionTrigger}:${autoPlayRequestKey}:${accessRecord.accessToken}`}
                    triggerType={selectionTrigger}
                    onUnauthorized={onExpired}
                    onAutoPlayBlocked={onAutoPlayBlocked}
                    onAutoPlayStarted={onAutoPlayStarted}
                  />
                ))
            ) : (
              <div className="rounded-lg bg-gray-800 p-3 text-xs text-gray-400">{t('audioUnavailable')}</div>
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

function getGeofenceCandidates(pois: PublicPoiDto[], userLocation: UserLocation): GeofenceCandidate[] {
  return pois
    .map((poi) => {
      const distanceMeters = getDistanceMeters(
        userLocation.latitude,
        userLocation.longitude,
        poi.latitude,
        poi.longitude,
      );
      const radiusMeters = getGeofenceRadiusMeters(poi);
      const accuracyToleranceMeters = Math.min(Math.max(userLocation.accuracy ?? 0, 0) * 0.25, 20);

      return {
        poi,
        distanceMeters,
        radiusMeters,
        insideRatio: distanceMeters / radiusMeters,
        isInside: distanceMeters <= radiusMeters + accuracyToleranceMeters,
      };
    })
    .filter((candidate) => candidate.isInside)
    .sort((left, right) => {
      const priorityDifference = (right.poi.priority ?? 0) - (left.poi.priority ?? 0);
      if (priorityDifference !== 0) return priorityDifference;

      return left.insideRatio - right.insideRatio;
    });
}

function getGeofenceRadiusMeters(poi: PublicPoiDto): number {
  const radiusMeters = Number(poi.radiusMeters);
  return Number.isFinite(radiusMeters) && radiusMeters > 0
    ? radiusMeters
    : DEFAULT_GEOFENCE_RADIUS_METERS;
}

function getGeofenceCooldownSeconds(poi: PublicPoiDto): number {
  const cooldownSeconds = Number(poi.cooldownSeconds);
  return Number.isFinite(cooldownSeconds) && cooldownSeconds >= 0
    ? cooldownSeconds
    : DEFAULT_GEOFENCE_COOLDOWN_SECONDS;
}

function getGeofenceMinDwellSeconds(poi: PublicPoiDto): number {
  const minDwellSeconds = Number(poi.minDwellSeconds);
  return Number.isFinite(minDwellSeconds) && minDwellSeconds >= 0
    ? minDwellSeconds
    : 0;
}

function formatDistance(distanceMeters: number): string {
  if (distanceMeters >= 1000) {
    return `${(distanceMeters / 1000).toFixed(1)} km`;
  }

  return `${Math.round(distanceMeters)} m`;
}
