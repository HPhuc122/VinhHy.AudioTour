import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { Circle, CircleMarker, MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { ApiClientError, extractApiError } from '@/api/apiError';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SecureImage } from '@/components/ui/SecureImage';
import { useToast } from '@/components/ui/Toast';
import { routes } from '@/config/routes';
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
import { poiTranslationsApi } from '@/features/pois/api/poiTranslationsApi';
import PoiTranslationModal from '@/features/pois/components/PoiTranslationModal';
import { buildPoiImageUrl } from '@/utils/assetUrl';

const LIFECYCLE_PENDING_REVIEW = 0;
const LIFECYCLE_APPROVED = 1;
const LIFECYCLE_PENDING_PAYMENT = 2;
const LIFECYCLE_ACTIVE = 3;
const LIFECYCLE_EXPIRED = 4;
const LIFECYCLE_REJECTED = 5;
const PAYMENT_PENDING = 1;

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
  const canLoadPoiMap = isAdminDashboard;

  const dashboardQuery = useDashboardStatsQuery({ enabled: canLoadAnalytics });
  const poisMapQuery = useDashboardPoiQuery(
    { page: 1, pageSize: 500 },
    canLoadPoiMap,
    'map',
  );

  if (isVendorDashboard) {
    return <VendorDashboard currentUserId={user?.userId} />;
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

function VendorDashboard({ currentUserId }: { currentUserId?: number }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [selectedPoi, setSelectedPoi] = useState<PoiMapPoint | null>(null);
  const [translationPoi, setTranslationPoi] = useState<PoiDto | null>(null);

  const vendorPoisQuery = useDashboardPoiQuery(
    { page: 1, pageSize: 100, includeDeleted: false },
    true,
    'vendor-overview',
  );
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

  const vendorPois = vendorPoisQuery.data?.items ?? [];
  const primaryPoi = useMemo(() => choosePrimaryVendorPoi(vendorPois), [vendorPois]);
  const primaryPoiId = primaryPoi?.id;
  const primaryLifecycle = getLifecycleStatusValue(primaryPoi?.lifecycleStatus);
  const primaryPayment = getPaymentStatusValue(primaryPoi?.paymentStatus);
  const canPayPrimaryPoi =
    Boolean(primaryPoi) && primaryLifecycle === LIFECYCLE_PENDING_PAYMENT && primaryPayment === PAYMENT_PENDING;

  const vendorImagesAll = useMediaQuery(
    { page: 1, pageSize: 1, fileType: 'image', approvalStatus: 'all', poiId: primaryPoiId },
    { enabled: Boolean(primaryPoiId) },
  );
  const vendorImagesPending = useMediaQuery(
    { page: 1, pageSize: 1, fileType: 'image', approvalStatus: 'Pending', poiId: primaryPoiId },
    { enabled: Boolean(primaryPoiId) },
  );
  const vendorImagesApproved = useMediaQuery(
    { page: 1, pageSize: 1, fileType: 'image', approvalStatus: 'Approved', poiId: primaryPoiId },
    { enabled: Boolean(primaryPoiId) },
  );
  const vendorImagesRejected = useMediaQuery(
    { page: 1, pageSize: 1, fileType: 'image', approvalStatus: 'Rejected', poiId: primaryPoiId },
    { enabled: Boolean(primaryPoiId) },
  );
  const vendorNarrationsAll = useNarrationsQuery(
    { page: 1, pageSize: 1, status: 'all', poiId: primaryPoiId },
    { enabled: Boolean(primaryPoiId) },
  );
  const vendorNarrationsPending = useNarrationsQuery(
    { page: 1, pageSize: 1, status: 'Pending', poiId: primaryPoiId },
    { enabled: Boolean(primaryPoiId) },
  );
  const vendorNarrationsApproved = useNarrationsQuery(
    { page: 1, pageSize: 1, status: 'Approved', poiId: primaryPoiId },
    { enabled: Boolean(primaryPoiId) },
  );
  const vendorNarrationsAudio = useNarrationsQuery(
    { page: 1, pageSize: 1, status: 'AudioGenerated', poiId: primaryPoiId },
    { enabled: Boolean(primaryPoiId) },
  );
  const vendorTranslationsQuery = useQuery({
    queryKey: ['dashboard', 'vendor-poi-translations', primaryPoiId],
    queryFn: () => poiTranslationsApi.getByPoiId(primaryPoiId!),
    enabled: Boolean(primaryPoiId),
  });

  const paymentMutation = useMutation({
    mutationFn: async (poi: PoiDto) => {
      const session = await poisApi.startPayment(poi.id);
      return poisApi.simulateMomoPayment(poi.id, session.paymentSessionId, true);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['dashboard', 'pois'] });
      await queryClient.invalidateQueries({ queryKey: ['pois'] });
      toast('Thanh toán MoMo mô phỏng thành công. Sạp đã được cập nhật trạng thái.', 'success');
    },
    onError: (error) => {
      toast(extractApiError(error), 'error');
    },
  });

  const poiPoints = useMemo(
    () => getPoiMapPoints(vendorPois, currentUserId),
    [vendorPois, currentUserId],
  );
  const contentLoading =
    vendorImagesAll.isLoading ||
    vendorNarrationsAll.isLoading ||
    vendorTranslationsQuery.isLoading;
  const dashboardLoading = vendorPoisQuery.isLoading || vendorPoisTotal.isLoading;

  const handleRegister = () => navigate(`${routes.registerPoi}?view=register`);
  const handleDetails = () => navigate(`${routes.registerPoi}?view=mine`);
  const handleImages = () => {
    if (primaryPoiId) navigate(`${routes.media}?tab=images&poiId=${primaryPoiId}`);
  };
  const handleNarrations = () => {
    if (primaryPoiId) navigate(`${routes.media}?tab=narrations&poiId=${primaryPoiId}`);
  };
  const handleTranslations = () => {
    if (primaryPoi) setTranslationPoi(primaryPoi);
  };
  const handlePayment = () => {
    if (!primaryPoi || !canPayPrimaryPoi) return;
    const ok = window.confirm(`Thanh toán MoMo mô phỏng cho ${primaryPoi.name || primaryPoi.code}?`);
    if (ok) {
      paymentMutation.mutate(primaryPoi);
    }
  };

  return (
    <section className="app-page">
      <div>
        <h1 className="app-title">Tổng quan chủ sạp</h1>
        <p className="app-subtitle">
          Theo dõi đăng ký, duyệt, thanh toán và nội dung của sạp theo từng bước rõ ràng.
        </p>
      </div>

      <DashboardErrors
        errors={[
          vendorPoisQuery.error,
          vendorPoisTotal.error,
          vendorImagesAll.error,
          vendorNarrationsAll.error,
          vendorTranslationsQuery.error,
        ]}
      />

      <VendorMainStatusCard
        poi={primaryPoi}
        totalCount={vendorPoisTotal.data?.totalCount}
        isLoading={dashboardLoading}
        onRegister={handleRegister}
        onDetails={handleDetails}
        onPayment={handlePayment}
        onImages={handleImages}
        onNarrations={handleNarrations}
        onTranslations={handleTranslations}
        canPay={canPayPrimaryPoi}
        isPaymentBusy={paymentMutation.isPending}
      />

      <VendorProgressStepper poi={primaryPoi} />

      <div className="grid gap-4 lg:grid-cols-3">
        <VendorContentCard
          title="Hình ảnh"
          description="Ảnh sau khi tải lên sẽ chờ admin duyệt trước khi hiển thị công khai."
          primaryMetric={`${formatStat(vendorImagesApproved.data?.totalCount)} đã duyệt`}
          secondaryMetrics={[
            `${formatStat(vendorImagesPending.data?.totalCount)} chờ duyệt`,
            `${formatStat(vendorImagesRejected.data?.totalCount)} bị từ chối`,
          ]}
          isLoading={contentLoading}
          actionLabel="Thêm hình ảnh"
          disabled={!primaryPoi}
          onAction={handleImages}
        />
        <VendorContentCard
          title="Bản thuyết minh"
          description="Tạo bản thuyết minh nháp để admin duyệt và gắn MP3 bảo vệ."
          primaryMetric={`${formatStat(vendorNarrationsApproved.data?.totalCount)} đã duyệt`}
          secondaryMetrics={[
            `${formatStat(vendorNarrationsPending.data?.totalCount)} chờ duyệt`,
            `${formatStat(vendorNarrationsAudio.data?.totalCount)} đã có audio`,
          ]}
          isLoading={contentLoading}
          actionLabel="Tạo bản thuyết minh"
          disabled={!primaryPoi}
          onAction={handleNarrations}
        />
        <VendorContentCard
          title="Bản dịch"
          description="Bổ sung bản dịch thủ công hoặc bản dịch mô phỏng cho POI/sạp."
          primaryMetric={`${formatStat(Array.isArray(vendorTranslationsQuery.data) ? vendorTranslationsQuery.data.length : undefined)} bản dịch`}
          secondaryMetrics={[primaryPoi ? 'Mở theo sạp đang chọn' : 'Chưa có sạp để dịch']}
          isLoading={contentLoading}
          actionLabel="Tạo bản dịch"
          disabled={!primaryPoi}
          onAction={handleTranslations}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <DashboardCard label="Tổng sạp" value={vendorPoisTotal.data?.totalCount} isLoading={dashboardLoading} />
        <DashboardCard label="Chờ duyệt" value={vendorPoisPendingReview.data?.totalCount} isLoading={dashboardLoading} />
        <DashboardCard label="Chờ thanh toán" value={vendorPoisPendingPayment.data?.totalCount} isLoading={dashboardLoading} />
        <DashboardCard label="Đang hoạt động" value={vendorPoisActive.data?.totalCount} isLoading={dashboardLoading} />
        <DashboardCard label="Bị từ chối" value={vendorPoisRejected.data?.totalCount} isLoading={dashboardLoading} />
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Bản đồ sạp của tôi</h2>
          <p className="text-sm text-gray-500">
            Các điểm ghim thể hiện sạp/địa điểm thuộc tài khoản của bạn có tọa độ hợp lệ.
          </p>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="relative h-[360px] w-full">
            {vendorPoisQuery.isLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                Đang tải bản đồ sạp...
              </div>
            ) : poiPoints.length === 0 ? (
              <VendorMapEmptyState onRegister={handleRegister} />
            ) : (
              <PoiDashboardMap points={poiPoints} onSelect={setSelectedPoi} />
            )}
          </div>
        </Card>
        {selectedPoi ? <AdminPoiInfoPanel poi={selectedPoi} onClose={() => setSelectedPoi(null)} /> : null}
      </section>

      <PoiTranslationModal
        isOpen={Boolean(translationPoi)}
        onClose={() => setTranslationPoi(null)}
        poi={translationPoi}
      />
    </section>
  );
}

function VendorMainStatusCard({
  poi,
  totalCount,
  isLoading,
  onRegister,
  onDetails,
  onPayment,
  onImages,
  onNarrations,
  onTranslations,
  canPay,
  isPaymentBusy,
}: {
  poi?: PoiDto | null;
  totalCount?: number | null;
  isLoading: boolean;
  onRegister: () => void;
  onDetails: () => void;
  onPayment: () => void;
  onImages: () => void;
  onNarrations: () => void;
  onTranslations: () => void;
  canPay: boolean;
  isPaymentBusy: boolean;
}) {
  const flow = getVendorFlowModel(poi);
  const publicStatus = getVendorPublicVisibilityStatus(poi);
  const lifecycleStatus = getLifecycleStatusValue(poi?.lifecycleStatus);
  const canEdit = Boolean(poi) && [LIFECYCLE_PENDING_REVIEW, LIFECYCLE_REJECTED].includes(lifecycleStatus);
  const canWorkOnContent = Boolean(poi) && lifecycleStatus === LIFECYCLE_ACTIVE;

  return (
    <Card className="p-5">
      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Sạp của tôi</p>
              <h2 className="mt-1 text-2xl font-bold text-gray-900">
                {isLoading ? 'Đang tải...' : poi?.name || poi?.displayName || poi?.code || 'Chưa có sạp'}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {poi ? `${poi.code} · ${poi.category || 'Chưa phân loại'}` : `${formatStat(totalCount)} sạp đã đăng ký`}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${flow.badgeClassName}`}>
              {flow.lifecycleLabel}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <StatusMiniCard label="Vòng đời" value={flow.lifecycleLabel} />
            <StatusMiniCard label="Thanh toán" value={flow.paymentLabel} />
            <StatusMiniCard label="Công khai" value={publicStatus.label} />
          </div>

          <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-sm font-semibold text-blue-950">Việc cần làm tiếp theo</p>
            <p className="mt-1 text-sm leading-6 text-blue-800">{flow.nextAction}</p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-sm font-semibold text-gray-900">Hành động nhanh</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {!poi ? (
              <Button onClick={onRegister}>Đăng ký địa điểm/sạp</Button>
            ) : (
              <>
                <Button variant="secondary" onClick={onDetails}>
                  Xem chi tiết sạp
                </Button>
                {canEdit ? (
                  <Button onClick={onDetails}>
                    Chỉnh sửa sạp
                  </Button>
                ) : null}
                {canPay ? (
                  <Button onClick={onPayment} isLoading={isPaymentBusy}>
                    Thanh toán
                  </Button>
                ) : null}
                {canWorkOnContent ? (
                  <>
                    <Button variant="secondary" onClick={onImages}>
                      Thêm hình ảnh
                    </Button>
                    <Button variant="secondary" onClick={onNarrations}>
                      Tạo bản thuyết minh
                    </Button>
                    <Button variant="secondary" onClick={onTranslations}>
                      Tạo bản dịch
                    </Button>
                  </>
                ) : null}
              </>
            )}
          </div>
          {poi && !canWorkOnContent ? (
            <p className="mt-4 text-sm leading-6 text-gray-600">
              Hình ảnh, bản thuyết minh và bản dịch sẽ rõ ràng nhất khi sạp đã hoạt động. Nếu cần chỉnh hồ sơ,
              hãy vào chi tiết sạp để xem trạng thái hiện tại.
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function VendorProgressStepper({ poi }: { poi?: PoiDto | null }) {
  const flow = getVendorFlowModel(poi);
  const isBlocked = flow.lifecycleStatus === LIFECYCLE_REJECTED || flow.lifecycleStatus === LIFECYCLE_EXPIRED;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Tiến trình đăng ký</h2>
          <p className="mt-1 text-sm text-gray-500">Luồng sạp: đăng ký, duyệt, thanh toán, hoạt động, hoàn thiện nội dung.</p>
        </div>
        {isBlocked ? (
          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
            {flow.lifecycleLabel}
          </span>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-6">
        {vendorFlowSteps.map((step, index) => {
          const done = poi ? index < flow.currentStepIndex || (flow.lifecycleStatus === LIFECYCLE_ACTIVE && index <= 4) : false;
          const current = poi ? index === flow.currentStepIndex : index === 0;
          return (
            <div
              key={step}
              className={`rounded-lg border px-3 py-3 ${
                current
                  ? 'border-blue-200 bg-blue-50'
                  : done
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-100 bg-gray-50'
              }`}
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  done
                    ? 'bg-green-600 text-white'
                    : current
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-400'
                }`}
              >
                {done ? '✓' : index + 1}
              </div>
              <p className="mt-2 text-sm font-medium text-gray-900">{step}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function VendorContentCard({
  title,
  description,
  primaryMetric,
  secondaryMetrics,
  isLoading,
  actionLabel,
  disabled,
  onAction,
}: {
  title: string;
  description: string;
  primaryMetric: string;
  secondaryMetrics: string[];
  isLoading: boolean;
  actionLabel: string;
  disabled?: boolean;
  onAction: () => void;
}) {
  return (
    <Card className="p-5">
      <div className="flex h-full flex-col">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
          <p className="mt-4 text-2xl font-bold text-gray-900">{isLoading ? '...' : primaryMetric}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {secondaryMetrics.map((metric) => (
              <span key={metric} className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                {isLoading ? 'Đang tải' : metric}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-5">
          <Button variant="secondary" disabled={disabled} onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function StatusMiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white px-3 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function VendorMapEmptyState({ onRegister }: { onRegister: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <div>
        <p className="text-base font-semibold text-gray-900">Chưa có vị trí sạp</p>
        <p className="mt-1 max-w-md text-sm text-gray-500">
          Khi bạn gửi đăng ký có tọa độ hợp lệ, vị trí sạp sẽ hiển thị trên bản đồ này.
        </p>
      </div>
      <Button onClick={onRegister}>Đăng ký địa điểm/sạp</Button>
    </div>
  );
}

const vendorFlowSteps = [
  'Gửi đăng ký',
  'Chờ duyệt',
  'Chờ yêu cầu thanh toán',
  'Thanh toán',
  'Đang hoạt động',
  'Hoàn thiện nội dung',
];

function choosePrimaryVendorPoi(pois: PoiDto[]): PoiDto | null {
  if (pois.length === 0) return null;

  const priorityByStatus: Record<number, number> = {
    [LIFECYCLE_PENDING_PAYMENT]: 0,
    [LIFECYCLE_PENDING_REVIEW]: 1,
    [LIFECYCLE_APPROVED]: 2,
    [LIFECYCLE_ACTIVE]: 3,
    [LIFECYCLE_REJECTED]: 4,
    [LIFECYCLE_EXPIRED]: 5,
  };

  return [...pois].sort((a, b) => {
    const left = priorityByStatus[getLifecycleStatusValue(a.lifecycleStatus)] ?? 99;
    const right = priorityByStatus[getLifecycleStatusValue(b.lifecycleStatus)] ?? 99;
    return left - right;
  })[0] ?? null;
}

function getVendorFlowModel(poi?: PoiDto | null) {
  if (!poi) {
    return {
      lifecycleStatus: LIFECYCLE_PENDING_REVIEW,
      currentStepIndex: 0,
      lifecycleLabel: 'Chưa đăng ký',
      paymentLabel: '-',
      nextAction: 'Bạn chưa có sạp/địa điểm. Hãy gửi đăng ký để admin bắt đầu duyệt hồ sơ.',
      badgeClassName: 'bg-gray-100 text-gray-700',
    };
  }

  const lifecycleStatus = getLifecycleStatusValue(poi.lifecycleStatus);
  const paymentStatus = getPaymentStatusValue(poi.paymentStatus);
  const paymentLabel = getPaymentStatusLabel(paymentStatus);

  switch (lifecycleStatus) {
    case LIFECYCLE_APPROVED:
      return {
        lifecycleStatus,
        currentStepIndex: 2,
        lifecycleLabel: 'Đã duyệt',
        paymentLabel,
        nextAction: 'Hồ sơ đã được duyệt. Vui lòng chờ admin gửi yêu cầu thanh toán nếu sạp cần phí kích hoạt.',
        badgeClassName: 'bg-sky-50 text-sky-700',
      };
    case LIFECYCLE_PENDING_PAYMENT:
      return {
        lifecycleStatus,
        currentStepIndex: 3,
        lifecycleLabel: 'Chờ thanh toán',
        paymentLabel,
        nextAction: 'Bạn có thể thanh toán để kích hoạt sạp. Sau khi thanh toán thành công, admin/backend sẽ cập nhật trạng thái.',
        badgeClassName: 'bg-amber-50 text-amber-700',
      };
    case LIFECYCLE_ACTIVE:
      return {
        lifecycleStatus,
        currentStepIndex: 4,
        lifecycleLabel: 'Đang hoạt động',
        paymentLabel,
        nextAction: 'Sạp đang hoạt động. Hãy hoàn thiện hình ảnh, bản thuyết minh và bản dịch để khách nghe tour dễ hơn.',
        badgeClassName: 'bg-green-50 text-green-700',
      };
    case LIFECYCLE_EXPIRED:
      return {
        lifecycleStatus,
        currentStepIndex: 4,
        lifecycleLabel: 'Hết hạn',
        paymentLabel,
        nextAction: 'Sạp đã hết hạn. Vui lòng liên hệ admin để gia hạn hoặc kiểm tra lại thời gian hiệu lực.',
        badgeClassName: 'bg-gray-100 text-gray-700',
      };
    case LIFECYCLE_REJECTED:
      return {
        lifecycleStatus,
        currentStepIndex: 1,
        lifecycleLabel: 'Bị từ chối',
        paymentLabel,
        nextAction: 'Đăng ký bị từ chối. Hãy xem lý do trong chi tiết sạp và chỉnh sửa hồ sơ nếu hệ thống cho phép.',
        badgeClassName: 'bg-red-50 text-red-700',
      };
    default:
      return {
        lifecycleStatus,
        currentStepIndex: 1,
        lifecycleLabel: 'Chờ duyệt',
        paymentLabel,
        nextAction: 'Hồ sơ đã gửi. Vui lòng chờ admin duyệt trước khi thanh toán hoặc hiển thị công khai.',
        badgeClassName: 'bg-yellow-50 text-yellow-700',
      };
  }
}

function getLifecycleStatusValue(status: unknown): number {
  if (status === 'Approved') return LIFECYCLE_APPROVED;
  if (status === 'PendingPayment') return LIFECYCLE_PENDING_PAYMENT;
  if (status === 'Active') return LIFECYCLE_ACTIVE;
  if (status === 'Expired') return LIFECYCLE_EXPIRED;
  if (status === 'Rejected') return LIFECYCLE_REJECTED;

  const value = Number(status);
  return value >= 0 && value <= 5 ? value : LIFECYCLE_PENDING_REVIEW;
}

function getPaymentStatusValue(status: unknown): number {
  if (status === 'PendingPayment') return PAYMENT_PENDING;
  if (status === 'Paid') return 2;
  if (status === 'Waived') return 3;

  const value = Number(status);
  return value === 1 || value === 2 || value === 3 ? value : 0;
}

function getPaymentStatusLabel(status: number): string {
  switch (status) {
    case PAYMENT_PENDING:
      return 'Chờ thanh toán';
    case 2:
      return 'Đã thanh toán';
    case 3:
      return 'Miễn thanh toán';
    default:
      return 'Không yêu cầu';
  }
}

function getVendorPublicVisibilityStatus(poi?: PoiDto | null): { label: string; reason: string } {
  if (!poi) {
    return { label: 'Chưa công khai', reason: 'Chưa có sạp/địa điểm.' };
  }

  const now = Date.now();
  const lifecycleStatus = getLifecycleStatusValue(poi.lifecycleStatus);
  const validFromOk = !poi.validFrom || new Date(poi.validFrom).getTime() <= now;
  const validUntilOk = !poi.validUntil || new Date(poi.validUntil).getTime() >= now;
  const deletedAt = (poi as PoiDto & { deletedAt?: string | null }).deletedAt;
  const isPublic = !deletedAt && lifecycleStatus === LIFECYCLE_ACTIVE && poi.isActive && validFromOk && validUntilOk;

  if (isPublic) return { label: 'Đang công khai', reason: 'Đủ điều kiện hiển thị công khai.' };
  if (deletedAt) return { label: 'Đã xóa', reason: 'Sạp đã bị xóa mềm.' };
  if (lifecycleStatus !== LIFECYCLE_ACTIVE) return { label: 'Chưa công khai', reason: 'Sạp chưa ở trạng thái hoạt động.' };
  if (!poi.isActive) return { label: 'Tạm tắt', reason: 'Sạp đang bị tạm tắt.' };
  if (!validFromOk) return { label: 'Chưa đến hiệu lực', reason: 'Chưa đến thời gian hiển thị.' };
  if (!validUntilOk) return { label: 'Hết hiệu lực', reason: 'Đã quá thời gian hiển thị.' };
  return { label: 'Chưa công khai', reason: 'Chưa đủ điều kiện hiển thị.' };
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

interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 8000,
  maximumAge: 30000,
};

function PoiDashboardMap({
  points,
  onSelect,
}: {
  points: PoiMapPoint[];
  onSelect: (poi: PoiMapPoint) => void;
}) {
  const locationWatchIdRef = useRef<number | null>(null);
  const shouldFollowUserRef = useRef(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    let cancelled = false;
    shouldFollowUserRef.current = true;

    if (locationWatchIdRef.current !== null) return;

    locationWatchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        if (cancelled || !shouldFollowUserRef.current) return;

        setUserLocation(toUserLocation(position));
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
  }, []);

  return (
    <MapContainer
      center={
        userLocation
          ? [userLocation.latitude, userLocation.longitude]
          : points[0]
            ? [points[0].latitude, points[0].longitude]
            : MAP_DEFAULT_CENTER
      }
      zoom={MAP_DEFAULT_ZOOM}
      maxZoom={MAP_MAX_ZOOM}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer url={MAP_TILE_URL} attribution={MAP_ATTRIBUTION} maxZoom={MAP_MAX_ZOOM} />
      <FitPoiBounds points={points} disabled={Boolean(userLocation)} />
      {userLocation ? <FollowUserLocation location={userLocation} shouldFollowRef={shouldFollowUserRef} /> : null}
      {userLocation ? <UserLocationOverlay location={userLocation} /> : null}
      {points.map((poi) => (
        <Marker
          key={poi.id}
          position={[poi.latitude, poi.longitude]}
          icon={createPoiMarkerIcon(poi)}
          eventHandlers={{
            click: () => {
              shouldFollowUserRef.current = false;
              onSelect(poi);
            },
          }}
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

function FollowUserLocation({
  location,
  shouldFollowRef,
}: {
  location: UserLocation;
  shouldFollowRef: { current: boolean };
}) {
  const map = useMap();

  useEffect(() => {
    if (!shouldFollowRef.current) return;

    map.setView([location.latitude, location.longitude], map.getZoom() || MAP_DEFAULT_ZOOM);
    map.invalidateSize();
  }, [location.latitude, location.longitude, map, shouldFollowRef]);

  return null;
}

function UserLocationOverlay({ location }: { location: UserLocation }) {
  return (
    <>
      <CircleMarker
        center={[location.latitude, location.longitude]}
        radius={8}
        pathOptions={{
          color: '#ffffff',
          fillColor: '#0ea5e9',
          fillOpacity: 0.95,
          weight: 3,
        }}
      >
        <Tooltip direction="top" offset={[0, -10]} opacity={1}>
          Vị trí của bạn
        </Tooltip>
      </CircleMarker>
      {location.accuracy ? (
        <Circle
          center={[location.latitude, location.longitude]}
          radius={location.accuracy}
          pathOptions={{
            color: '#0ea5e9',
            fillColor: '#38bdf8',
            fillOpacity: 0.08,
            weight: 1,
          }}
        />
      ) : null}
    </>
  );
}

function toUserLocation(position: GeolocationPosition): UserLocation {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
  };
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
        {formatLifecycleStatus(poi.lifecycleStatus)} / {poi.isActive ? 'Đang bật' : 'Tạm tắt'}
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
            <SecureImage
              src={buildPoiImageUrl(poi.id, poi.imageUrl)}
              alt={poi.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">Chưa có ảnh</div>
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
                {poi.isActive ? 'Hoạt động' : 'Tạm tắt'}
            </span>
          </div>

          <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-gray-600">
            {poi.description || poi.shortDescription || 'Chưa có mô tả.'}
          </p>

          <CmsAudioPreviewPlayer poiId={poi.id} />
        </div>
      </div>
    </Card>
  );
}

function FitPoiBounds({ points, disabled }: { points: PoiMapPoint[]; disabled?: boolean }) {
  const map = useMap();

  useEffect(() => {
    window.setTimeout(() => map.invalidateSize(), 0);

    if (disabled) {
      return;
    }

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
  }, [disabled, map, points]);

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
      isOwned: Boolean(currentUserId && (!poi.userId || poi.userId === currentUserId)),
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
  if (status === 'PendingReview' || Number(status) === 0) return 'Chờ duyệt';
  if (status === 'Approved' || Number(status) === 1) return 'Đã duyệt';
  if (status === 'PendingPayment' || Number(status) === 2) return 'Chờ thanh toán';
  if (status === 'Active' || Number(status) === 3) return 'Đang hoạt động';
  if (status === 'Expired' || Number(status) === 4) return 'Hết hạn';
  if (status === 'Rejected' || Number(status) === 5) return 'Bị từ chối';
  return String(status || 'Không rõ');
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
