import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { ApiClientError } from '@/api/apiError';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import {
  MAP_ATTRIBUTION,
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_MAX_ZOOM,
  MAP_TILE_URL,
} from '@/config/mapConfig';
import { CmsAudioPreviewPlayer } from '@/features/audio/components/CmsAudioPreviewPlayer';
import { useDashboardStatsQuery } from '@/features/analytics/hooks/useDashboardStatsQuery';
import { canViewAnalyticsDashboard, isAdminRole, isVendorRole } from '@/features/auth/roleAccess';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useMediaQuery } from '@/features/media/hooks/useMediaQuery';
import { useNarrationsQuery } from '@/features/narrations/hooks/useNarrationsQuery';
import { poisApi, type PoiDto, type PoiListFilter } from '@/features/pois/api/poisApi';

const LIFECYCLE_PENDING_REVIEW = 0;
const LIFECYCLE_PENDING_PAYMENT = 2;
const LIFECYCLE_ACTIVE = 3;
const LIFECYCLE_REJECTED = 5;

const CATEGORY_STYLES = [
  { icon: 'M', color: '#2563eb', light: '#dbeafe' },
  { icon: 'F', color: '#16a34a', light: '#dcfce7' },
  { icon: 'S', color: '#f59e0b', light: '#fef3c7' },
] as const;

export const currentLocationIcon = L.divIcon({
  className: '',
  html: '<span style="display:block;width:18px;height:18px;border-radius:9999px;background:#0ea5e9;border:4px solid #ffffff;box-shadow:0 0 0 8px rgba(14,165,233,.18),0 4px 12px rgba(14,165,233,.35);"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
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
  const [selectedPoi, setSelectedPoi] = useState<PoiMapPoint | null>(null);
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
              <PoiDashboardMap points={poiPoints} onSelect={setSelectedPoi} />
            )}
          </div>
        </Card>
        {selectedPoi ? <AdminPoiInfoPanel poi={selectedPoi} onClose={() => setSelectedPoi(null)} /> : null}
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
  const [selectedPoi, setSelectedPoi] = useState<PoiMapPoint | null>(null);
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
              <PoiDashboardMap points={poiPoints} onSelect={setSelectedPoi} />
            )}
          </div>
        </Card>
        {selectedPoi ? <AdminPoiInfoPanel poi={selectedPoi} onClose={() => setSelectedPoi(null)} /> : null}
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
  shortDescription?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  category?: string | null;
  isActive: boolean;
  isOwned: boolean;
  approvalStatus: number | string;
  lifecycleStatus: number | string;
  latitude: number;
  longitude: number;
}

function PoiDashboardMap({
  points,
  onSelect,
}: {
  points: PoiMapPoint[];
  onSelect: (poi: PoiMapPoint) => void;
}) {
  return (
    <MapContainer
      center={points[0] ? [points[0].latitude, points[0].longitude] : MAP_DEFAULT_CENTER}
      zoom={MAP_DEFAULT_ZOOM}
      maxZoom={MAP_MAX_ZOOM}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer url={MAP_TILE_URL} attribution={MAP_ATTRIBUTION} maxZoom={MAP_MAX_ZOOM} />
      <FitPoiBounds points={points} />
      {points.map((poi) => (
        <Marker
          key={poi.id}
          position={[poi.latitude, poi.longitude]}
          icon={createPoiMarkerIcon(poi)}
          eventHandlers={{ click: () => onSelect(poi) }}
        >
          <Tooltip direction="top" offset={[0, -24]} opacity={1} sticky>
            <MapHoverCard poi={poi} />
          </Tooltip>
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

function createPoiMarkerIcon(poi: PoiMapPoint) {
  const style = getCategoryStyle(poi.category);
  const border = poi.isOwned ? '#f97316' : '#ffffff';
  const shadow = poi.isOwned
    ? '0 0 0 4px rgba(249,115,22,.22),0 4px 14px rgba(0,0,0,.25)'
    : '0 4px 12px rgba(0,0,0,.25)';

  return L.divIcon({
    className: '',
    html: `
      <div style="display:flex;align-items:center;gap:6px;transform:translate(-18px,-34px);">
        <span style="display:flex;width:30px;height:30px;align-items:center;justify-content:center;border-radius:9999px;background:${style.color};border:3px solid ${border};box-shadow:${shadow};color:white;font:700 12px system-ui;">${style.icon}</span>
        <span style="max-width:132px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border-radius:6px;background:rgba(255,255,255,.94);padding:3px 7px;color:#111827;font:600 12px system-ui;box-shadow:0 2px 8px rgba(15,23,42,.18);">${escapeHtml(poi.name || poi.code)}</span>
      </div>
    `,
    iconSize: [180, 38],
    iconAnchor: [18, 34],
  });
}

function MapHoverCard({ poi }: { poi: PoiMapPoint }) {
  return (
    <div className="max-w-64 text-left">
      <p className="font-semibold text-gray-900">{poi.name || poi.code}</p>
      <p className="text-xs text-gray-500">{poi.category || 'POI'}</p>
      {poi.shortDescription ? (
        <p className="mt-1 line-clamp-3 text-xs text-gray-700">{poi.shortDescription}</p>
      ) : null}
      <p className="mt-2 text-xs font-medium text-gray-600">
        {formatLifecycleStatus(poi.lifecycleStatus)} / {poi.isActive ? 'Active' : 'Inactive'}
      </p>
    </div>
  );
}

function AdminPoiInfoPanel({ poi, onClose }: { poi: PoiMapPoint; onClose: () => void }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="grid gap-0 md:grid-cols-[220px_1fr]">
        <div className="h-44 bg-gray-100 md:h-full">
          {poi.imageUrl ? (
            <img src={poi.imageUrl} alt={poi.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">No image</div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{poi.category || 'POI'}</p>
              <h3 className="text-lg font-semibold text-gray-900">{poi.name || poi.code}</h3>
              <p className="text-xs text-gray-500">{poi.code}</p>
            </div>
            <button type="button" onClick={onClose} className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100">
              X
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-blue-50 px-2 py-1 font-medium text-blue-700">
              {formatLifecycleStatus(poi.lifecycleStatus)}
            </span>
            <span className={poi.isActive ? 'rounded-full bg-emerald-50 px-2 py-1 font-medium text-emerald-700' : 'rounded-full bg-gray-100 px-2 py-1 font-medium text-gray-600'}>
              {poi.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-gray-600">
            {poi.description || poi.shortDescription || 'No description available.'}
          </p>

          <CmsAudioPreviewPlayer poiId={poi.id} />
        </div>
      </div>
    </Card>
  );
}

function FitPoiBounds({ points }: { points: PoiMapPoint[] }) {
  const map = useMap();

  useEffect(() => {
    window.setTimeout(() => map.invalidateSize(), 0);

    if (points.length === 0) {
      map.setView(MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM);
      return;
    }

    if (points.length === 1) {
      const point = points[0]!;
      map.setView([point.latitude, point.longitude], MAP_DEFAULT_ZOOM);
      return;
    }

    const bounds = L.latLngBounds(points.map((point) => [point.latitude, point.longitude]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: MAP_DEFAULT_ZOOM });
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
      shortDescription: poi.shortDescription,
      description: poi.description,
      imageUrl: poi.imageUrl,
      category: poi.category,
      isActive: poi.isActive,
      isOwned: Boolean(currentUserId && poi.userId === currentUserId),
      approvalStatus: poi.approvalStatus,
      lifecycleStatus: poi.lifecycleStatus,
      latitude,
      longitude,
    });

    return points;
  }, []);
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

  return CATEGORY_STYLES[hash % CATEGORY_STYLES.length] ?? CATEGORY_STYLES[0];
}

function formatLifecycleStatus(status: number | string): string {
  if (status === 'PendingReview' || Number(status) === 0) return 'Pending review';
  if (status === 'Approved' || Number(status) === 1) return 'Approved';
  if (status === 'PendingPayment' || Number(status) === 2) return 'Pending payment';
  if (status === 'Active' || Number(status) === 3) return 'Active';
  if (status === 'Expired' || Number(status) === 4) return 'Expired';
  if (status === 'Rejected' || Number(status) === 5) return 'Rejected';
  return String(status || 'Unknown');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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
