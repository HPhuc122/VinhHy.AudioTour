import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { ApiClientError } from '@/api/apiError';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { useDashboardStatsQuery } from '@/features/analytics/hooks/useDashboardStatsQuery';
import { canViewAnalyticsDashboard, isAdminRole, isVendorRole } from '@/features/auth/roleAccess';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useMediaQuery } from '@/features/media/hooks/useMediaQuery';
import { useNarrationsQuery } from '@/features/narrations/hooks/useNarrationsQuery';
import { poisApi, type PoiDto, type PoiListFilter } from '@/features/pois/api/poisApi';

const DEFAULT_CENTER: [number, number] = [10.7615, 106.7033];
const DEFAULT_ZOOM = 17;

const LIFECYCLE_PENDING_REVIEW = 0;
const LIFECYCLE_PENDING_PAYMENT = 2;
const LIFECYCLE_ACTIVE = 3;
const LIFECYCLE_REJECTED = 5;

const poiMarkerIcon = L.divIcon({
  className: '',
  html: '<span style="display:block;width:18px;height:18px;border-radius:9999px;background:#2563eb;border:3px solid #ffffff;box-shadow:0 4px 12px rgba(37,99,235,.45);"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -8],
});

const ownedPoiMarkerIcon = L.divIcon({
  className: '',
  html: '<span style="display:block;width:22px;height:22px;border-radius:9999px;background:#f59e0b;border:4px solid #ffffff;box-shadow:0 4px 14px rgba(245,158,11,.55);"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -10],
});

export function DashboardPage() {
  const { user } = useAuth();
  const isVendorDashboard = isVendorRole(user?.role);
  const isAdminDashboard = isAdminRole(user?.role);
  const canLoadAnalytics = canViewAnalyticsDashboard(user?.role);
  const canLoadPoiMap = isAdminDashboard || isVendorDashboard;

  const dashboardQuery = useDashboardStatsQuery({ enabled: canLoadAnalytics });
  const poisMapQuery = useDashboardPoiQuery(
    { page: 1, pageSize: 500 },
    canLoadPoiMap,
    'map',
  );

  if (isVendorDashboard) {
    return <VendorDashboard poisMapQuery={poisMapQuery} currentUserId={user?.userId} />;
  }

  if (isAdminDashboard) {
    return <AdminDashboard dashboardQuery={dashboardQuery} poisMapQuery={poisMapQuery} />;
  }

  if (canLoadAnalytics) {
    return <AnalyticsOnlyDashboard dashboardQuery={dashboardQuery} />;
  }

  return <LegacyRoleDashboard role={user?.role} />;
}

interface DashboardQueryResult {
  data?: import('@/features/analytics/api/analyticsApi').DashboardStatsDto;
  isLoading: boolean;
  error: unknown;
}

interface PoiQueryResult {
  data?: import('@/types/api').PagedResult<PoiDto>;
  isLoading: boolean;
  error: unknown;
}

function AdminDashboard({
  dashboardQuery,
  poisMapQuery,
}: {
  dashboardQuery: DashboardQueryResult;
  poisMapQuery: PoiQueryResult;
}) {
  const stats = dashboardQuery.data;
  const poiPoints = useMemo(
    () => getPoiMapPoints(poisMapQuery.data?.items ?? []),
    [poisMapQuery.data],
  );

  return (
    <section className="app-page">
      <div>
        <h1 className="app-title">Bảng điều khiển</h1>
        <p className="app-subtitle">Theo dõi trạng thái vận hành POI, nội dung và phê duyệt.</p>
      </div>

      {getErrorMessage(dashboardQuery.error) ? (
        <Alert variant="error" message={getErrorMessage(dashboardQuery.error) ?? ''} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard label="Tổng POI" value={stats?.totalPois} isLoading={dashboardQuery.isLoading} />
        <DashboardCard label="POI chờ duyệt" value={stats?.pendingReviewPois} isLoading={dashboardQuery.isLoading} />
        <DashboardCard label="POI chờ thanh toán" value={stats?.pendingPaymentPois} isLoading={dashboardQuery.isLoading} />
        <DashboardCard label="POI đang hoạt động" value={stats?.activePois} isLoading={dashboardQuery.isLoading} />
        <DashboardCard label="POI bị từ chối" value={stats?.rejectedPois} isLoading={dashboardQuery.isLoading} />
        <DashboardCard label="Ảnh chờ duyệt" value={stats?.pendingImages} isLoading={dashboardQuery.isLoading} />
        <DashboardCard label="Thuyết minh chờ duyệt" value={stats?.pendingNarrations} isLoading={dashboardQuery.isLoading} />
        <DashboardCard label="Mã QR đang hoạt động" value={stats?.activeQrCodes} isLoading={dashboardQuery.isLoading} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard label="Tổng tour" value={stats?.totalTours} isLoading={dashboardQuery.isLoading} />
        <DashboardCard label="Tour đang hoạt động" value={stats?.activeTours} isLoading={dashboardQuery.isLoading} />
        <DashboardCard label="Tổng ảnh" value={stats?.totalImages} isLoading={dashboardQuery.isLoading} />
        <DashboardCard label="Tổng âm thanh" value={stats?.totalAudioFiles} isLoading={dashboardQuery.isLoading} />
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Bản đồ địa điểm POI</h2>
          <p className="text-sm text-gray-500">
            Các điểm ghim thể hiện POI đã đăng ký có tọa độ hợp lệ.
          </p>
        </div>

        {getErrorMessage(poisMapQuery.error) ? (
          <Alert variant="error" message={getErrorMessage(poisMapQuery.error) ?? ''} />
        ) : null}

        <Card className="overflow-hidden p-0">
          <div className="relative h-[420px] w-full">
            {poisMapQuery.isLoading ? (
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

function VendorDashboard({
  poisMapQuery,
  currentUserId,
}: {
  poisMapQuery: PoiQueryResult;
  currentUserId?: number;
}) {
  const vendorPoisTotal = useDashboardPoiQuery({ page: 1, pageSize: 1 }, true, 'vendor-total');
  const vendorPoisPendingReview = useDashboardPoiQuery(
    { page: 1, pageSize: 1, lifecycleStatus: LIFECYCLE_PENDING_REVIEW },
    true,
    'vendor-pending-review',
  );
  const vendorPoisPendingPayment = useDashboardPoiQuery(
    { page: 1, pageSize: 1, lifecycleStatus: LIFECYCLE_PENDING_PAYMENT },
    true,
    'vendor-pending-payment',
  );
  const vendorPoisActive = useDashboardPoiQuery(
    { page: 1, pageSize: 1, lifecycleStatus: LIFECYCLE_ACTIVE, isActive: true },
    true,
    'vendor-active',
  );
  const vendorPoisRejected = useDashboardPoiQuery(
    { page: 1, pageSize: 1, lifecycleStatus: LIFECYCLE_REJECTED },
    true,
    'vendor-rejected',
  );
  const vendorImagesAll = useMediaQuery({ page: 1, pageSize: 1, fileType: 'image', approvalStatus: 'all' });
  const vendorImagesPending = useMediaQuery({ page: 1, pageSize: 1, fileType: 'image', approvalStatus: 'Pending' });
  const vendorImagesApproved = useMediaQuery({ page: 1, pageSize: 1, fileType: 'image', approvalStatus: 'Approved' });
  const vendorImagesRejected = useMediaQuery({ page: 1, pageSize: 1, fileType: 'image', approvalStatus: 'Rejected' });
  const vendorNarrationsAll = useNarrationsQuery({ page: 1, pageSize: 1, status: 'all' });
  const vendorNarrationsPending = useNarrationsQuery({ page: 1, pageSize: 1, status: 'Pending' });
  const vendorNarrationsApproved = useNarrationsQuery({ page: 1, pageSize: 1, status: 'Approved' });
  const vendorNarrationsAudio = useNarrationsQuery({ page: 1, pageSize: 1, status: 'AudioGenerated' });
  const poiPoints = useMemo(
    () => getPoiMapPoints(poisMapQuery.data?.items ?? [], currentUserId),
    [poisMapQuery.data, currentUserId],
  );
  const isLoading = [
    vendorPoisTotal,
    vendorPoisPendingReview,
    vendorPoisPendingPayment,
    vendorPoisActive,
    vendorPoisRejected,
    vendorImagesAll,
    vendorImagesPending,
    vendorImagesApproved,
    vendorImagesRejected,
    vendorNarrationsAll,
    vendorNarrationsPending,
    vendorNarrationsApproved,
    vendorNarrationsAudio,
    poisMapQuery,
  ].some((query) => query.isLoading);

  return (
    <section className="app-page">
      <div>
        <h1 className="app-title">Bảng điều khiển chủ sạp</h1>
        <p className="app-subtitle">
          Theo dõi POI, ảnh và bản thuyết minh thuộc tài khoản của bạn.
        </p>
      </div>

      <DashboardErrors
        errors={[
          vendorPoisTotal.error,
          vendorImagesAll.error,
          vendorNarrationsAll.error,
          poisMapQuery.error,
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard label="Tổng POI của bạn" value={vendorPoisTotal.data?.totalCount} isLoading={isLoading} />
        <DashboardCard label="POI chờ duyệt" value={vendorPoisPendingReview.data?.totalCount} isLoading={isLoading} />
        <DashboardCard label="POI chờ thanh toán" value={vendorPoisPendingPayment.data?.totalCount} isLoading={isLoading} />
        <DashboardCard label="POI đang hoạt động" value={vendorPoisActive.data?.totalCount} isLoading={isLoading} />
        <DashboardCard label="POI bị từ chối" value={vendorPoisRejected.data?.totalCount} isLoading={isLoading} />
        <DashboardCard label="Tổng ảnh đã tải" value={vendorImagesAll.data?.totalCount} isLoading={isLoading} />
        <DashboardCard label="Ảnh chờ duyệt" value={vendorImagesPending.data?.totalCount} isLoading={isLoading} />
        <DashboardCard label="Ảnh đã duyệt" value={vendorImagesApproved.data?.totalCount} isLoading={isLoading} />
        <DashboardCard label="Ảnh bị từ chối" value={vendorImagesRejected.data?.totalCount} isLoading={isLoading} />
        <DashboardCard label="Tổng thuyết minh" value={vendorNarrationsAll.data?.totalCount} isLoading={isLoading} />
        <DashboardCard label="Thuyết minh chờ duyệt" value={vendorNarrationsPending.data?.totalCount} isLoading={isLoading} />
        <DashboardCard label="Thuyết minh đã duyệt" value={vendorNarrationsApproved.data?.totalCount} isLoading={isLoading} />
        <DashboardCard label="Đã tạo âm thanh" value={vendorNarrationsAudio.data?.totalCount} isLoading={isLoading} />
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Bản đồ sạp của bạn</h2>
          <p className="text-sm text-gray-500">
            Các điểm màu vàng là POI thuộc tài khoản vendor hiện tại.
          </p>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="relative h-[360px] w-full">
            {poisMapQuery.isLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                Đang tải bản đồ sạp...
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

function AnalyticsOnlyDashboard({ dashboardQuery }: { dashboardQuery: DashboardQueryResult }) {
  const stats = dashboardQuery.data;

  return (
    <section className="app-page">
      <div>
        <h1 className="app-title">Bảng điều khiển phân tích</h1>
        <p className="app-subtitle">Các chỉ số tổng quan được phép xem cho vai trò phân tích cũ.</p>
      </div>

      {getErrorMessage(dashboardQuery.error) ? (
        <Alert variant="error" message={getErrorMessage(dashboardQuery.error) ?? ''} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard label="Tổng tour" value={stats?.totalTours} isLoading={dashboardQuery.isLoading} />
        <DashboardCard label="Tour đang hoạt động" value={stats?.activeTours} isLoading={dashboardQuery.isLoading} />
        <DashboardCard label="Tổng mã QR" value={stats?.totalQrCodes} isLoading={dashboardQuery.isLoading} />
        <DashboardCard label="Lượt phát từ QR" value={stats?.totalQrScans} isLoading={dashboardQuery.isLoading} />
        <DashboardCard label="Tổng lượt phát âm thanh" value={stats?.totalAudioPlays} isLoading={dashboardQuery.isLoading} />
      </div>
    </section>
  );
}

function LegacyRoleDashboard({ role }: { role?: string | null }) {
  return (
    <section className="app-page">
      <div>
        <h1 className="app-title">Bảng điều khiển</h1>
        <p className="app-subtitle">
          Vai trò {role ?? 'hiện tại'} chưa có bộ chỉ số dashboard riêng trong giao diện quản trị.
        </p>
      </div>
      <Alert
        variant="info"
        message="Không có widget nào được tải cho vai trò này để tránh gọi API không được cấp quyền."
      />
    </section>
  );
}

function useDashboardPoiQuery(filter: PoiListFilter, enabled: boolean, scope: string) {
  return useQuery({
    queryKey: ['dashboard', 'pois', scope, filter],
    queryFn: () => poisApi.getAll(filter),
    enabled,
  });
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

function DashboardErrors({ errors }: { errors: unknown[] }) {
  const message = errors.map(getErrorMessage).find(Boolean);
  return message ? <Alert variant="error" message={message} /> : null;
}

function getStatColor(label: string): string {
  if (label.includes('đang hoạt động') || label.includes('đã duyệt') || label.includes('Đã tạo')) {
    return 'bg-emerald-50 text-emerald-700';
  }

  if (label.includes('chờ')) {
    return 'bg-amber-50 text-amber-700';
  }

  if (label.includes('từ chối')) {
    return 'bg-red-50 text-red-700';
  }

  if (label.includes('âm thanh') || label.includes('ảnh') || label.includes('Ảnh')) {
    return 'bg-green-50 text-green-700';
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
  isOwned: boolean;
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
        <Marker key={poi.id} position={[poi.latitude, poi.longitude]} icon={poi.isOwned ? ownedPoiMarkerIcon : poiMarkerIcon}>
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

function getPoiMapPoints(pois: PoiDto[], currentUserId?: number): PoiMapPoint[] {
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
      isOwned: Boolean(currentUserId && poi.userId === currentUserId),
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
