import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { ApiClientError } from '@/api/apiError';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { useDashboardStatsQuery } from '@/features/analytics/hooks/useDashboardStatsQuery';
import { useAuth } from '@/features/auth/context/AuthContext';
import { ROLE_VENDOR } from '@/features/auth/roleAccess';
import { useMediaQuery } from '@/features/media/hooks/useMediaQuery';
import { useNarrationsQuery } from '@/features/narrations/hooks/useNarrationsQuery';
import { poisApi, type PoiDto } from '@/features/pois/api/poisApi';

const DEFAULT_CENTER: [number, number] = [10.7615, 106.7033];
const DEFAULT_ZOOM = 17;

const poiMarkerIcon = L.divIcon({
  className: '',
  html: '<span style="display:block;width:18px;height:18px;border-radius:9999px;background:#2563eb;border:3px solid #ffffff;box-shadow:0 4px 12px rgba(37,99,235,.45);"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -8],
});

export function DashboardPage() {
  const { user } = useAuth();
  const isVendor = user?.role === ROLE_VENDOR;
  const dashboardQuery = useDashboardStatsQuery({ enabled: !isVendor });
  const poisQuery = useQuery({
    queryKey: ['dashboard', 'poi-map'],
    queryFn: () => poisApi.getAll({ page: 1, pageSize: 500 }),
    enabled: !isVendor,
  });
  const vendorImagesAll = useMediaQuery(
    { page: 1, pageSize: 1, fileType: 'image', approvalStatus: 'all' },
    { enabled: isVendor },
  );
  const vendorImagesPending = useMediaQuery(
    { page: 1, pageSize: 1, fileType: 'image', approvalStatus: 'Pending' },
    { enabled: isVendor },
  );
  const vendorImagesApproved = useMediaQuery(
    { page: 1, pageSize: 1, fileType: 'image', approvalStatus: 'Approved' },
    { enabled: isVendor },
  );
  const vendorImagesRejected = useMediaQuery(
    { page: 1, pageSize: 1, fileType: 'image', approvalStatus: 'Rejected' },
    { enabled: isVendor },
  );
  const vendorNarrationsPending = useNarrationsQuery(
    { page: 1, pageSize: 1, status: 'Pending' },
    { enabled: isVendor },
  );
  const vendorNarrationsApproved = useNarrationsQuery(
    { page: 1, pageSize: 1, status: 'Approved' },
    { enabled: isVendor },
  );
  const vendorNarrationsRejected = useNarrationsQuery(
    { page: 1, pageSize: 1, status: 'Rejected' },
    { enabled: isVendor },
  );
  const vendorNarrationsAudio = useNarrationsQuery(
    { page: 1, pageSize: 1, status: 'AudioGenerated' },
    { enabled: isVendor },
  );
  const stats = dashboardQuery.data;
  const errorMessage = getErrorMessage(dashboardQuery.error);
  const poiPoints = useMemo(() => getPoiMapPoints(poisQuery.data?.items ?? []), [poisQuery.data]);

  if (isVendor) {
    const isLoading =
      vendorImagesAll.isLoading ||
      vendorImagesPending.isLoading ||
      vendorImagesApproved.isLoading ||
      vendorImagesRejected.isLoading ||
      vendorNarrationsPending.isLoading ||
      vendorNarrationsApproved.isLoading ||
      vendorNarrationsRejected.isLoading ||
      vendorNarrationsAudio.isLoading;

    return (
      <section className="app-page">
        <div>
          <h1 className="app-title">Bảng điều khiển chủ sạp</h1>
          <p className="app-subtitle">
            Theo dõi trạng thái ảnh và bản thuyết minh đã gửi duyệt.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCard label="Tổng ảnh" value={vendorImagesAll.data?.totalCount} isLoading={isLoading} />
          <DashboardCard label="Ảnh chờ duyệt" value={vendorImagesPending.data?.totalCount} isLoading={isLoading} />
          <DashboardCard label="Ảnh đã duyệt" value={vendorImagesApproved.data?.totalCount} isLoading={isLoading} />
          <DashboardCard label="Ảnh từ chối" value={vendorImagesRejected.data?.totalCount} isLoading={isLoading} />
          <DashboardCard label="Thuyết minh chờ duyệt" value={vendorNarrationsPending.data?.totalCount} isLoading={isLoading} />
          <DashboardCard label="Thuyết minh đã duyệt" value={vendorNarrationsApproved.data?.totalCount} isLoading={isLoading} />
          <DashboardCard label="Thuyết minh từ chối" value={vendorNarrationsRejected.data?.totalCount} isLoading={isLoading} />
          <DashboardCard label="Đã tạo âm thanh" value={vendorNarrationsAudio.data?.totalCount} isLoading={isLoading} />
        </div>
      </section>
    );
  }

  return (
    <section className="app-page">
      <div>
        <h1 className="app-title">Bảng điều khiển</h1>
        <p className="app-subtitle">Thống kê tổng quan nội dung và tài nguyên.</p>
      </div>

      {errorMessage ? <Alert variant="error" message={errorMessage} /> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard label="Tổng số tour" value={stats?.totalTours} isLoading={dashboardQuery.isLoading} />
        <DashboardCard label="Tour đang hoạt động" value={stats?.activeTours} isLoading={dashboardQuery.isLoading} />
        <DashboardCard label="Mã QR" value={stats?.totalQrCodes} isLoading={dashboardQuery.isLoading} />
        <DashboardCard label="Mã QR đang hoạt động" value={stats?.activeQrCodes} isLoading={dashboardQuery.isLoading} />
        <DashboardCard label="Tệp media" value={stats?.totalMediaFiles} isLoading={dashboardQuery.isLoading} />
        <DashboardCard label="Hình ảnh" value={stats?.totalImages} isLoading={dashboardQuery.isLoading} />
        <DashboardCard label="Tệp âm thanh" value={stats?.totalAudioFiles} isLoading={dashboardQuery.isLoading} />
        <DashboardCard label="Media đã xóa" value={stats?.deletedMediaFiles} isLoading={dashboardQuery.isLoading} />
        <DashboardCard label="Ảnh chờ duyệt" value={stats?.pendingImages} isLoading={dashboardQuery.isLoading} />
        <DashboardCard label="Thuyết minh chờ duyệt" value={stats?.pendingNarrations} isLoading={dashboardQuery.isLoading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardCard label="Lượt phát từ mã QR" value={stats?.totalQrScans} isLoading={dashboardQuery.isLoading} />
        <DashboardCard label="Tổng lượt phát âm thanh" value={stats?.totalAudioPlays} isLoading={dashboardQuery.isLoading} />
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Bản đồ địa điểm POI</h2>
          <p className="text-sm text-gray-500">
            Các điểm ghim thể hiện POI đã đăng ký có tọa độ hợp lệ.
          </p>
        </div>

        {getErrorMessage(poisQuery.error) ? (
          <Alert variant="error" message={getErrorMessage(poisQuery.error) ?? ''} />
        ) : null}

        <Card className="overflow-hidden p-0">
          <div className="relative h-[420px] w-full">
            {poisQuery.isLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                Đang tải bản đồ địa điểm...
              </div>
            ) : (
              <PoiDashboardMap points={poiPoints} />
            )}
          </div>
        </Card>
      </section>
    </section>
  );
}

interface DashboardCardProps {
  label: string;
  value?: number | null;
  isLoading: boolean;
}

function DashboardCard({ label, value, isLoading }: DashboardCardProps) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-1 inline-block rounded px-2 py-0.5 text-2xl font-bold ${getStatColor(label)}`}>
        {isLoading ? '...' : formatStat(value)}
      </p>
    </Card>
  );
}

function getStatColor(label: string): string {
  if (label.includes('đang hoạt động')) {
    return 'bg-emerald-50 text-emerald-700';
  }

  if (label.includes('âm thanh') || label.includes('Hình ảnh')) {
    return 'bg-green-50 text-green-700';
  }

  if (label.includes('đã xóa')) {
    return 'bg-red-50 text-red-700';
  }

  return 'bg-blue-50 text-blue-700';
}

function formatStat(value?: number | null): string {
  if (value === null || typeof value === 'undefined') {
    return '-';
  }

  return new Intl.NumberFormat().format(value);
}

interface PoiMapPoint {
  id: number;
  code: string;
  name: string;
  category?: string | null;
  isActive: boolean;
  latitude: number;
  longitude: number;
}

function PoiDashboardMap({ points }: { points: PoiMapPoint[] }) {
  return (
    <MapContainer
      center={points[0] ? [points[0].latitude, points[0].longitude] : DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" attribution="&copy; Google Maps" />
      <FitPoiBounds points={points} />
      {points.map((poi) => (
        <Marker key={poi.id} position={[poi.latitude, poi.longitude]} icon={poiMarkerIcon}>
          <Popup>
            <div className="min-w-40 text-sm">
              <p className="font-semibold text-gray-900">{poi.name || poi.code}</p>
              <p className="text-xs text-gray-500">{poi.code}</p>
              {poi.category ? <p className="mt-1 text-xs text-gray-600">{poi.category}</p> : null}
              <span
                className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs ${
                  poi.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {poi.isActive ? 'Hoạt động' : 'Tạm tắt'}
              </span>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

function FitPoiBounds({ points }: { points: PoiMapPoint[] }) {
  const map = useMap();

  useEffect(() => {
    window.setTimeout(() => map.invalidateSize(), 0);

    if (points.length === 0) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      return;
    }

    if (points.length === 1) {
      const point = points[0]!;
      map.setView([point.latitude, point.longitude], DEFAULT_ZOOM);
      return;
    }

    const bounds = L.latLngBounds(points.map((point) => [point.latitude, point.longitude]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
  }, [map, points]);

  return null;
}

function getPoiMapPoints(pois: PoiDto[]): PoiMapPoint[] {
  return pois.reduce<PoiMapPoint[]>((points, poi) => {
    const latitude = parseCoordinate(poi.latitude);
    const longitude = parseCoordinate(poi.longitude);

    if (latitude === null || longitude === null) {
      return points;
    }

    points.push({
      id: poi.id,
      code: poi.code,
      name: poi.name || poi.displayName || poi.code,
      category: poi.category,
      isActive: poi.isActive,
      latitude,
      longitude,
    });

    return points;
  }, []);
}

function parseCoordinate(value?: number | string | null): number | null {
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
}

function getErrorMessage(error: unknown): string | null {
  if (!error) {
    return null;
  }

  if (error instanceof ApiClientError) {
    return error.message;
  }

  return 'Không thể tải thống kê bảng điều khiển.';
}
