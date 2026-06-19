import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { extractApiError } from '@/api/apiError';
import { SecureImage } from '@/components/ui/SecureImage';
import { Button } from '../../../components/ui/Button';
import usePois from '../hooks/usePois';
import { poisApi } from '../api/poisApi';
import { useToast } from '../../../components/ui/Toast';
import { buildPoiImageUrl } from '../../../utils/assetUrl';
import PoiTranslationModal from './PoiTranslationModal';

type LifecycleStatusValue = 0 | 1 | 2 | 3 | 4 | 5;
type PaymentStatusValue = 0 | 1 | 2 | 3;
type AdminLifecycleAction = 'approve' | 'reject' | 'request-payment';
type DetailTab = 'overview' | 'images' | 'narrations' | 'translations' | 'payment' | 'history';

interface Props {
  filters?: any;
  onEdit?: (poi: any) => void;
  isVendorMode?: boolean;
}

const detailTabs: Array<{ key: DetailTab; label: string }> = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'images', label: 'Hình ảnh' },
  { key: 'narrations', label: 'Bản thuyết minh' },
  { key: 'translations', label: 'Bản dịch' },
  { key: 'payment', label: 'Thanh toán' },
  { key: 'history', label: 'Lịch sử / Trạng thái' },
];

export function PoiTable({ filters, onEdit, isVendorMode = false }: Props) {
  const { data, isLoading, isError, error } = usePois(filters);
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const [selectedPoi, setSelectedPoi] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [updatingLifecycleId, setUpdatingLifecycleId] = useState<number | null>(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<number | null>(null);
  const [viewingImages, setViewingImages] = useState<string[] | null>(null);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [translatingPoi, setTranslatingPoi] = useState<any>(null);

  const pois = data?.items ?? [];
  const summary = useMemo(() => buildSummary(pois), [pois]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => poisApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pois'] }),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: number) => poisApi.restore(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pois'] }),
  });

  const approveReviewMutation = useMutation({
    mutationFn: (id: number) => poisApi.approveReview(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pois'] }),
  });

  const requestPaymentMutation = useMutation({
    mutationFn: (id: number) => poisApi.requestPayment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pois'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => poisApi.reject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pois'] }),
  });

  const markPaidMutation = useMutation({
    mutationFn: (id: number) => poisApi.markPaid(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pois'] }),
  });

  const waivePaymentMutation = useMutation({
    mutationFn: (id: number) => poisApi.waivePayment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pois'] }),
  });

  const vendorMomoPaymentMutation = useMutation({
    mutationFn: async (id: number) => {
      const session = await poisApi.startPayment(id);
      return poisApi.simulateMomoPayment(id, session.paymentSessionId, true);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pois'] }),
  });

  const openDetails = (poi: any, tab: DetailTab = 'overview') => {
    setSelectedPoi(poi);
    setActiveTab(tab);
  };

  const closeDetails = () => {
    setSelectedPoi(null);
    setActiveTab('overview');
  };

  const handleLifecycleAction = async (poi: any, action: AdminLifecycleAction) => {
    const label = getLifecycleActionLabel(action);
    const ok = window.confirm(`Xác nhận "${label}" cho ${poi.name || poi.code}?`);
    if (!ok) return;

    try {
      setUpdatingLifecycleId(poi.id);
      if (action === 'approve') {
        await approveReviewMutation.mutateAsync(poi.id);
      } else if (action === 'request-payment') {
        await requestPaymentMutation.mutateAsync(poi.id);
      } else {
        await rejectMutation.mutateAsync(poi.id);
      }
      toast('Đã cập nhật vòng đời POI.', 'success');
    } catch (err: unknown) {
      toast(extractApiError(err), 'error');
    } finally {
      setUpdatingLifecycleId(null);
    }
  };

  const handlePaymentAction = async (poi: any, action: 'paid' | 'waived') => {
    const label = action === 'paid' ? 'đã thanh toán' : 'miễn thanh toán';
    const ok = window.confirm(`Xác nhận ${poi.name || poi.code} là "${label}" và kích hoạt POI?`);
    if (!ok) return;

    try {
      setUpdatingPaymentId(poi.id);
      if (action === 'paid') {
        await markPaidMutation.mutateAsync(poi.id);
      } else {
        await waivePaymentMutation.mutateAsync(poi.id);
      }
      toast('Đã kích hoạt POI.', 'success');
    } catch (err: unknown) {
      toast(extractApiError(err), 'error');
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  const handleVendorMomoPayment = async (poi: any) => {
    const ok = window.confirm(`Thanh toán MoMo mô phỏng cho ${poi.name || poi.code}?`);
    if (!ok) return;

    try {
      setUpdatingPaymentId(poi.id);
      await vendorMomoPaymentMutation.mutateAsync(poi.id);
      toast('Thanh toán MoMo mô phỏng thành công. POI đã được kích hoạt.', 'success');
    } catch (err: unknown) {
      toast(extractApiError(err), 'error');
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  const handleRestore = async (poi: any) => {
    const ok = window.confirm(`Khôi phục ${poi.name || poi.code}?`);
    if (!ok) return;

    try {
      setRestoringId(poi.id);
      await restoreMutation.mutateAsync(poi.id);
      toast('Đã khôi phục địa điểm.', 'success');
    } catch (err: unknown) {
      toast(extractApiError(err), 'error');
    } finally {
      setRestoringId(null);
    }
  };

  const handleDelete = async (poi: any) => {
    const ok = window.confirm(`Xóa ${poi.name || poi.code}?`);
    if (!ok) return;

    try {
      setDeletingId(poi.id);
      await deleteMutation.mutateAsync(poi.id);
      toast('Đã xóa địa điểm.', 'success');
      closeDetails();
    } catch (err: unknown) {
      toast(extractApiError(err), 'error');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return <div className="rounded-xl border border-gray-100 bg-white p-6 text-sm text-gray-600 shadow-sm">Đang tải danh sách POI...</div>;
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
        {extractApiError(error) || 'Không thể tải danh sách POI.'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SummaryCards summary={summary} totalCount={data?.totalCount ?? pois.length} />

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">
            {isVendorMode ? 'Danh sách sạp của tôi' : 'Danh sách POI'}
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Thao tác duyệt, thanh toán, bản dịch và nội dung đã được chuyển vào màn hình chi tiết.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">POI / Sạp</th>
                <th className="px-4 py-3">Danh mục</th>
                {!isVendorMode ? <th className="px-4 py-3">Chủ sở hữu / Vendor</th> : null}
                <th className="px-4 py-3">Trạng thái lifecycle</th>
                <th className="px-4 py-3">Thanh toán</th>
                <th className="px-4 py-3">Hiển thị công khai</th>
                <th className="px-4 py-3">Cập nhật gần nhất</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pois.length === 0 ? (
                <tr>
                  <td colSpan={isVendorMode ? 7 : 8} className="px-4 py-8 text-center text-gray-500">
                    Không có POI phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                pois.map((poi: any) => {
                  const lifecycleStatus = getLifecycleStatusValue(poi.lifecycleStatus);
                  const paymentStatus = getPaymentStatusValue(poi.paymentStatus);
                  const publicStatus = getPublicVisibilityStatus(poi);

                  return (
                    <tr key={poi.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <PoiThumb poi={poi} onClick={() => openImagePreview(poi, setViewingImages, setCurrentImgIndex)} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-gray-900">{poi.name || 'Chưa cập nhật tên'}</p>
                            <p className="text-xs text-gray-500">{poi.code || `#${poi.id}`}</p>
                            {isVendorMode ? <VendorNextAction poi={poi} compact /> : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{poi.category || '-'}</td>
                      {!isVendorMode ? (
                        <td className="px-4 py-3 text-gray-600">
                          {poi.ownerName || poi.username || poi.vendorName || poi.userName || (poi.userId ? `User #${poi.userId}` : 'Hệ thống')}
                        </td>
                      ) : null}
                      <td className="px-4 py-3">
                        <StatusBadge className={getLifecycleStatusBadgeClassName(lifecycleStatus)}>
                          {getLifecycleStatusLabel(lifecycleStatus)}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge className={getPaymentStatusBadgeClassName(paymentStatus)}>
                          {getPaymentStatusLabel(paymentStatus)}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge className={publicStatus.public ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-600'}>
                          {publicStatus.label}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDateTime(poi.updatedAt ?? poi.modifiedAt ?? poi.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="secondary" onClick={() => openDetails(poi)}>
                          Xem chi tiết
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPoi ? (
        <PoiDetailDrawer
          poi={selectedPoi}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isVendorMode={isVendorMode}
          onClose={closeDetails}
          onEdit={(poi) => onEdit?.(poi)}
          onPreviewImages={(poi) => openImagePreview(poi, setViewingImages, setCurrentImgIndex)}
          onTranslate={(poi) => setTranslatingPoi(poi)}
          onNarrations={(poi) => navigate(`/media?tab=narrations&poiId=${poi.id}`)}
          onImages={(poi) => navigate(`/media?tab=images&poiId=${poi.id}`)}
          onLifecycleAction={handleLifecycleAction}
          onPaymentAction={handlePaymentAction}
          onVendorPay={handleVendorMomoPayment}
          onRestore={handleRestore}
          onDelete={handleDelete}
          busy={{
            deletingId,
            restoringId,
            updatingLifecycleId,
            updatingPaymentId,
          }}
        />
      ) : null}

      {translatingPoi ? (
        <PoiTranslationModal
          isOpen={Boolean(translatingPoi)}
          onClose={() => setTranslatingPoi(null)}
          poi={translatingPoi}
        />
      ) : null}

      <ImagePreviewModal
        imageUrls={viewingImages}
        currentImgIndex={currentImgIndex}
        setCurrentImgIndex={setCurrentImgIndex}
        onClose={() => setViewingImages(null)}
      />
    </div>
  );
}

function SummaryCards({ summary, totalCount }: { summary: ReturnType<typeof buildSummary>; totalCount: number }) {
  const cards = [
    { label: 'Tổng POI', value: totalCount, tone: 'text-gray-900' },
    { label: 'Chờ duyệt', value: summary.pendingReview, tone: 'text-yellow-700' },
    { label: 'Chờ thanh toán', value: summary.pendingPayment, tone: 'text-amber-700' },
    { label: 'Đang hoạt động', value: summary.active, tone: 'text-green-700' },
    { label: 'Bị từ chối', value: summary.rejected, tone: 'text-red-700' },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{card.label}</p>
          <p className={`mt-2 text-2xl font-bold ${card.tone}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}

function PoiDetailDrawer({
  poi,
  activeTab,
  setActiveTab,
  isVendorMode,
  onClose,
  onEdit,
  onPreviewImages,
  onTranslate,
  onNarrations,
  onImages,
  onLifecycleAction,
  onPaymentAction,
  onVendorPay,
  onRestore,
  onDelete,
  busy,
}: {
  poi: any;
  activeTab: DetailTab;
  setActiveTab: (tab: DetailTab) => void;
  isVendorMode: boolean;
  onClose: () => void;
  onEdit: (poi: any) => void;
  onPreviewImages: (poi: any) => void;
  onTranslate: (poi: any) => void;
  onNarrations: (poi: any) => void;
  onImages: (poi: any) => void;
  onLifecycleAction: (poi: any, action: AdminLifecycleAction) => void;
  onPaymentAction: (poi: any, action: 'paid' | 'waived') => void;
  onVendorPay: (poi: any) => void;
  onRestore: (poi: any) => void;
  onDelete: (poi: any) => void;
  busy: {
    deletingId: number | null;
    restoringId: number | null;
    updatingLifecycleId: number | null;
    updatingPaymentId: number | null;
  };
}) {
  const lifecycleStatus = getLifecycleStatusValue(poi.lifecycleStatus);
  const paymentStatus = getPaymentStatusValue(poi.paymentStatus);
  const publicStatus = getPublicVisibilityStatus(poi);
  const isDeleted = Boolean(poi.deletedAt);
  const canVendorEdit = isVendorMode && !isDeleted && ![1, 2, 3].includes(lifecycleStatus);
  const canAdminApprove = !isVendorMode && !isDeleted && lifecycleStatus === 0;
  const canAdminReject = !isVendorMode && !isDeleted && (lifecycleStatus === 0 || lifecycleStatus === 1);
  const canRequestPayment = !isVendorMode && !isDeleted && lifecycleStatus === 1;
  const canActivatePayment = !isVendorMode && !isDeleted && lifecycleStatus === 2 && paymentStatus === 1;
  const canVendorPay = isVendorMode && !isDeleted && lifecycleStatus === 2 && paymentStatus === 1;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-gray-950/40" role="dialog" aria-modal="true">
      <button className="flex-1 cursor-default" aria-label="Đóng chi tiết" onClick={onClose} />
      <aside className="flex h-full w-full max-w-4xl flex-col bg-white shadow-2xl">
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{poi.code || `POI #${poi.id}`}</p>
              <h2 className="mt-1 text-xl font-bold text-gray-900">{poi.name || 'Chưa cập nhật tên'}</h2>
              <p className="mt-1 text-sm text-gray-500">{poi.category || 'Chưa phân loại'}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            >
              Đóng
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge className={getLifecycleStatusBadgeClassName(lifecycleStatus)}>
              {getLifecycleStatusLabel(lifecycleStatus)}
            </StatusBadge>
            <StatusBadge className={getPaymentStatusBadgeClassName(paymentStatus)}>
              {getPaymentStatusLabel(paymentStatus)}
            </StatusBadge>
            <StatusBadge className={publicStatus.public ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-600'}>
              {publicStatus.label}
            </StatusBadge>
            {isDeleted ? <StatusBadge className="border-red-200 bg-red-50 text-red-700">Đã xóa</StatusBadge> : null}
          </div>
        </div>

        <div className="border-b border-gray-100 px-6">
          <div className="flex gap-2 overflow-x-auto py-3">
            {detailTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isVendorMode ? <VendorChecklist poi={poi} /> : null}
          {activeTab === 'overview' ? (
            <OverviewTab poi={poi} publicStatus={publicStatus} onPreviewImages={onPreviewImages} isVendorMode={isVendorMode} />
          ) : null}
          {activeTab === 'images' ? (
            <LinkedWorkspace
              title="Hình ảnh"
              description="Xem và quản lý ảnh trong thư viện theo ngữ cảnh POI này."
              primaryLabel="Mở thư viện ảnh"
              onPrimary={() => onImages(poi)}
              secondaryLabel="Xem ảnh hiện có"
              onSecondary={() => onPreviewImages(poi)}
            />
          ) : null}
          {activeTab === 'narrations' ? (
            <LinkedWorkspace
              title="Bản thuyết minh"
              description="Mở workspace thuyết minh để tạo bản nháp, duyệt nội dung và gắn MP3."
              primaryLabel="Mở bản thuyết minh"
              onPrimary={() => onNarrations(poi)}
            />
          ) : null}
          {activeTab === 'translations' ? (
            <LinkedWorkspace
              title="Bản dịch"
              description="Quản lý bản dịch thủ công hoặc tạo bản dịch mô phỏng cho POI này."
              primaryLabel="Mở bản dịch"
              onPrimary={() => onTranslate(poi)}
            />
          ) : null}
          {activeTab === 'payment' ? (
            <PaymentTab poi={poi} lifecycleStatus={lifecycleStatus} paymentStatus={paymentStatus} />
          ) : null}
          {activeTab === 'history' ? (
            <HistoryTab poi={poi} publicStatus={publicStatus} />
          ) : null}
        </div>

        <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
          <div className="flex flex-wrap justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {(!isVendorMode || canVendorEdit) && !isDeleted ? (
                <Button variant="secondary" onClick={() => onEdit(poi)}>
                  Sửa thông tin
                </Button>
              ) : null}
              {!isVendorMode && isDeleted ? (
                <Button
                  onClick={() => onRestore(poi)}
                  isLoading={busy.restoringId === poi.id}
                >
                  Khôi phục
                </Button>
              ) : null}
              {!isVendorMode && !isDeleted ? (
                <Button
                  variant="danger"
                  onClick={() => onDelete(poi)}
                  isLoading={busy.deletingId === poi.id}
                >
                  Xóa
                </Button>
              ) : null}
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              {canAdminApprove ? (
                <Button isLoading={busy.updatingLifecycleId === poi.id} onClick={() => onLifecycleAction(poi, 'approve')}>
                  Duyệt
                </Button>
              ) : null}
              {canAdminReject ? (
                <Button variant="danger" isLoading={busy.updatingLifecycleId === poi.id} onClick={() => onLifecycleAction(poi, 'reject')}>
                  Từ chối
                </Button>
              ) : null}
              {canRequestPayment ? (
                <Button isLoading={busy.updatingLifecycleId === poi.id} onClick={() => onLifecycleAction(poi, 'request-payment')}>
                  Yêu cầu thanh toán
                </Button>
              ) : null}
              {canActivatePayment ? (
                <>
                  <Button isLoading={busy.updatingPaymentId === poi.id} onClick={() => onPaymentAction(poi, 'paid')}>
                    Đã thanh toán
                  </Button>
                  <Button variant="secondary" disabled={busy.updatingPaymentId === poi.id} onClick={() => onPaymentAction(poi, 'waived')}>
                    Miễn thanh toán
                  </Button>
                </>
              ) : null}
              {canVendorPay ? (
                <Button isLoading={busy.updatingPaymentId === poi.id} onClick={() => onVendorPay(poi)}>
                  Thanh toán MoMo
                </Button>
              ) : null}
              {isVendorMode && lifecycleStatus === 1 ? (
                <span className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  Chờ admin yêu cầu thanh toán.
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function OverviewTab({
  poi,
  publicStatus,
  onPreviewImages,
  isVendorMode,
}: {
  poi: any;
  publicStatus: { public: boolean; label: string; reason: string };
  onPreviewImages: (poi: any) => void;
  isVendorMode: boolean;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <div>
          <PoiThumb poi={poi} size="lg" onClick={() => onPreviewImages(poi)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoItem label="Mã POI" value={poi.code || `#${poi.id}`} />
          <InfoItem label="Danh mục" value={poi.category || '-'} />
          {!isVendorMode ? (
            <InfoItem label="Chủ sở hữu / Vendor" value={poi.ownerName || poi.username || poi.vendorName || poi.userName || (poi.userId ? `User #${poi.userId}` : 'Hệ thống')} />
          ) : null}
          <InfoItem label="Tọa độ" value={formatCoordinates(poi)} />
          <InfoItem label="Bán kính" value={poi.radiusMeters ? `${poi.radiusMeters} m` : '-'} />
          <InfoItem label="Hiển thị công khai" value={publicStatus.reason} />
          <InfoItem label="Hiệu lực từ" value={formatDateTime(poi.validFrom)} />
          <InfoItem label="Hiệu lực đến" value={formatDateTime(poi.validUntil)} />
        </div>
      </div>

      <div className="rounded-lg border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-gray-900">Mô tả ngắn</h3>
        <p className="mt-2 text-sm leading-6 text-gray-600">{poi.shortDescription || 'Chưa có mô tả ngắn.'}</p>
      </div>

      <div className="rounded-lg border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-gray-900">Mô tả chi tiết</h3>
        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-600">{poi.description || 'Chưa có mô tả chi tiết.'}</p>
      </div>
    </div>
  );
}

function LinkedWorkspace({
  title,
  description,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
}: {
  title: string;
  description: string;
  primaryLabel: string;
  secondaryLabel?: string;
  onPrimary: () => void;
  onSecondary?: () => void;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">{description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={onPrimary}>{primaryLabel}</Button>
        {secondaryLabel && onSecondary ? (
          <Button variant="secondary" onClick={onSecondary}>{secondaryLabel}</Button>
        ) : null}
      </div>
    </div>
  );
}

function PaymentTab({
  poi,
  lifecycleStatus,
  paymentStatus,
}: {
  poi: any;
  lifecycleStatus: LifecycleStatusValue;
  paymentStatus: PaymentStatusValue;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <InfoItem label="Trạng thái lifecycle" value={getLifecycleStatusLabel(lifecycleStatus)} />
      <InfoItem label="Trạng thái thanh toán" value={getPaymentStatusLabel(paymentStatus)} />
      <InfoItem label="Có yêu cầu thanh toán" value={poi.paymentRequired ? 'Có' : 'Không'} />
      <InfoItem label="Ngày kích hoạt" value={formatDateTime(poi.activatedAt)} />
      <InfoItem label="Người kích hoạt" value={poi.activatedByUserId ? `User #${poi.activatedByUserId}` : '-'} />
      <InfoItem label="Gợi ý bước tiếp theo" value={getPaymentNextAction(lifecycleStatus, paymentStatus)} />
    </div>
  );
}

function HistoryTab({
  poi,
  publicStatus,
}: {
  poi: any;
  publicStatus: { public: boolean; label: string; reason: string };
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <InfoItem label="Ngày tạo" value={formatDateTime(poi.createdAt)} />
      <InfoItem label="Cập nhật gần nhất" value={formatDateTime(poi.updatedAt ?? poi.modifiedAt)} />
      <InfoItem label="Đã xóa" value={poi.deletedAt ? formatDateTime(poi.deletedAt) : 'Không'} />
      <InfoItem label="Hiển thị công khai" value={publicStatus.reason} />
      <InfoItem label="Trạng thái hoạt động" value={poi.isActive ? 'Đang bật' : 'Tạm tắt'} />
      <InfoItem label="Ghi chú" value="Chưa có lịch sử thao tác chi tiết từ API hiện tại." />
    </div>
  );
}

function VendorChecklist({ poi }: { poi: any }) {
  const lifecycleStatus = getLifecycleStatusValue(poi.lifecycleStatus);
  const steps = [
    { label: 'Đã gửi đăng ký', done: lifecycleStatus >= 0 },
    { label: 'Chờ duyệt', done: lifecycleStatus !== 0 },
    { label: 'Chờ yêu cầu thanh toán', done: lifecycleStatus >= 2 || lifecycleStatus === 3 },
    { label: 'Chờ thanh toán', done: lifecycleStatus === 3 },
    { label: 'Đang hoạt động', done: lifecycleStatus === 3 },
  ];

  return (
    <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
      <h3 className="text-sm font-semibold text-blue-950">Tiến trình sạp của tôi</h3>
      <div className="mt-3 grid gap-2 sm:grid-cols-5">
        {steps.map((step) => (
          <div key={step.label} className="flex items-center gap-2 text-xs text-blue-900">
            <span className={`flex h-5 w-5 items-center justify-center rounded-full ${step.done ? 'bg-blue-600 text-white' : 'bg-white text-blue-500'}`}>
              {step.done ? '✓' : '•'}
            </span>
            <span>{step.label}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm text-blue-800">{getVendorNextActionText(lifecycleStatus)}</p>
    </div>
  );
}

function VendorNextAction({ poi, compact = false }: { poi: any; compact?: boolean }) {
  const text = getVendorNextActionText(getLifecycleStatusValue(poi.lifecycleStatus));
  return <p className={`${compact ? 'mt-1 text-[11px]' : 'text-sm'} text-amber-700`}>{text}</p>;
}

function InfoItem({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-gray-900">{value || '-'}</p>
    </div>
  );
}

function PoiThumb({
  poi,
  size = 'sm',
  onClick,
}: {
  poi: any;
  size?: 'sm' | 'lg';
  onClick: () => void;
}) {
  const sizeClass = size === 'lg' ? 'h-40 w-full' : 'h-12 w-12';
  const imageUrl = getPoiImageUrls(poi)[0];

  if (!imageUrl) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${sizeClass} flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-400`}
      >
        Không ảnh
      </button>
    );
  }

  return (
    <button type="button" onClick={onClick} className={`${sizeClass} overflow-hidden rounded-lg border border-gray-200 bg-gray-50`}>
      <SecureImage src={imageUrl} alt={`POI ${poi.code ?? ''}`} className="h-full w-full object-cover" />
    </button>
  );
}

function ImagePreviewModal({
  imageUrls,
  currentImgIndex,
  setCurrentImgIndex,
  onClose,
}: {
  imageUrls: string[] | null;
  currentImgIndex: number;
  setCurrentImgIndex: (updater: number | ((index: number) => number)) => void;
  onClose: () => void;
}) {
  if (!imageUrls?.length) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Xem ảnh địa điểm"
    >
      <div className="relative flex max-h-full max-w-full items-center justify-center" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute -right-4 -top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-2xl text-white transition-colors hover:bg-white/40"
          aria-label="Đóng ảnh"
        >
          x
        </button>
        {imageUrls.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => setCurrentImgIndex((index) => index === 0 ? imageUrls.length - 1 : index - 1)}
              className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-3xl text-white shadow-lg transition-colors hover:bg-black/70"
              aria-label="Ảnh trước"
            >
              &lt;
            </button>
            <button
              type="button"
              onClick={() => setCurrentImgIndex((index) => index >= imageUrls.length - 1 ? 0 : index + 1)}
              className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-3xl text-white shadow-lg transition-colors hover:bg-black/70"
              aria-label="Ảnh tiếp theo"
            >
              &gt;
            </button>
          </>
        ) : null}
        <SecureImage
          src={imageUrls[currentImgIndex]}
          alt="Ảnh địa điểm phóng to"
          className="block max-h-[90vh] max-w-[95vw] rounded-lg border-2 border-white/20 object-contain shadow-2xl"
        />
        {imageUrls.length > 1 ? (
          <div className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm font-medium text-white shadow">
            {currentImgIndex + 1} / {imageUrls.length}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatusBadge({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${className}`}>{children}</span>;
}

function buildSummary(pois: any[]) {
  return pois.reduce(
    (acc, poi) => {
      const status = getLifecycleStatusValue(poi.lifecycleStatus);
      if (status === 0) acc.pendingReview += 1;
      if (status === 2) acc.pendingPayment += 1;
      if (status === 3) acc.active += 1;
      if (status === 5) acc.rejected += 1;
      return acc;
    },
    { pendingReview: 0, pendingPayment: 0, active: 0, rejected: 0 },
  );
}

function getLifecycleStatusValue(status: unknown): LifecycleStatusValue {
  if (status === 'Approved') return 1;
  if (status === 'PendingPayment') return 2;
  if (status === 'Active') return 3;
  if (status === 'Expired') return 4;
  if (status === 'Rejected') return 5;

  const value = Number(status);
  return value >= 0 && value <= 5 ? value as LifecycleStatusValue : 0;
}

function getLifecycleStatusLabel(status: LifecycleStatusValue): string {
  switch (status) {
    case 1:
      return 'Đã duyệt';
    case 2:
      return 'Chờ thanh toán';
    case 3:
      return 'Đang hoạt động';
    case 4:
      return 'Hết hạn';
    case 5:
      return 'Bị từ chối';
    default:
      return 'Chờ duyệt';
  }
}

function getLifecycleStatusBadgeClassName(status: LifecycleStatusValue): string {
  switch (status) {
    case 1:
      return 'border-sky-200 bg-sky-50 text-sky-800';
    case 2:
      return 'border-amber-200 bg-amber-50 text-amber-800';
    case 3:
      return 'border-green-200 bg-green-50 text-green-800';
    case 4:
      return 'border-gray-300 bg-gray-50 text-gray-700';
    case 5:
      return 'border-red-200 bg-red-50 text-red-800';
    default:
      return 'border-yellow-200 bg-yellow-50 text-yellow-800';
  }
}

function getLifecycleActionLabel(action: AdminLifecycleAction): string {
  switch (action) {
    case 'approve':
      return 'Duyệt';
    case 'reject':
      return 'Từ chối';
    case 'request-payment':
      return 'Yêu cầu thanh toán';
  }
}

function getPaymentStatusValue(status: unknown): PaymentStatusValue {
  if (status === 'NotRequired') return 0;
  if (status === 'PendingPayment') return 1;
  if (status === 'Paid') return 2;
  if (status === 'Waived') return 3;

  const value = Number(status);
  return value === 1 || value === 2 || value === 3 ? value : 0;
}

function getPaymentStatusLabel(status: PaymentStatusValue): string {
  switch (status) {
    case 1:
      return 'Chờ thanh toán';
    case 2:
      return 'Đã thanh toán';
    case 3:
      return 'Miễn thanh toán';
    default:
      return 'Không yêu cầu';
  }
}

function getPaymentStatusBadgeClassName(status: PaymentStatusValue): string {
  switch (status) {
    case 1:
      return 'border-amber-200 bg-amber-50 text-amber-800';
    case 2:
      return 'border-green-200 bg-green-50 text-green-800';
    case 3:
      return 'border-blue-200 bg-blue-50 text-blue-800';
    default:
      return 'border-gray-200 bg-gray-50 text-gray-700';
  }
}

function getPublicVisibilityStatus(poi: any): { public: boolean; label: string; reason: string } {
  const now = Date.now();
  const lifecycleStatus = getLifecycleStatusValue(poi.lifecycleStatus);
  const validFromOk = !poi.validFrom || new Date(poi.validFrom).getTime() <= now;
  const validUntilOk = !poi.validUntil || new Date(poi.validUntil).getTime() >= now;
  const isPublic = !poi.deletedAt && lifecycleStatus === 3 && poi.isActive && validFromOk && validUntilOk;

  if (isPublic) return { public: true, label: 'Đang công khai', reason: 'Đủ điều kiện hiển thị công khai.' };
  if (poi.deletedAt) return { public: false, label: 'Đã xóa', reason: 'POI đã bị xóa mềm.' };
  if (lifecycleStatus !== 3) return { public: false, label: 'Chưa công khai', reason: `Lifecycle hiện tại: ${getLifecycleStatusLabel(lifecycleStatus)}.` };
  if (!poi.isActive) return { public: false, label: 'Tạm tắt', reason: 'POI đang tạm tắt.' };
  if (!validFromOk) return { public: false, label: 'Chưa đến hiệu lực', reason: 'ValidFrom chưa tới thời điểm hiện tại.' };
  if (!validUntilOk) return { public: false, label: 'Hết hiệu lực', reason: 'ValidUntil đã qua.' };
  return { public: false, label: 'Chưa công khai', reason: 'Chưa đủ điều kiện hiển thị.' };
}

function getVendorNextActionText(status: LifecycleStatusValue): string {
  switch (status) {
    case 0:
      return 'Đã gửi đăng ký. Vui lòng chờ admin duyệt.';
    case 1:
      return 'Đã duyệt. Vui lòng chờ admin yêu cầu thanh toán nếu cần.';
    case 2:
      return 'Đang chờ thanh toán. Bạn có thể thanh toán khi nút thanh toán khả dụng.';
    case 3:
      return 'Sạp đang hoạt động và có thể hiển thị công khai nếu còn hiệu lực.';
    case 4:
      return 'Sạp đã hết hạn. Vui lòng liên hệ admin để gia hạn.';
    case 5:
      return 'Đăng ký bị từ chối. Hãy chỉnh sửa thông tin nếu hệ thống cho phép.';
    default:
      return 'Theo dõi trạng thái đăng ký tại đây.';
  }
}

function getPaymentNextAction(lifecycleStatus: LifecycleStatusValue, paymentStatus: PaymentStatusValue): string {
  if (lifecycleStatus === 0) return 'Admin cần duyệt hoặc từ chối POI.';
  if (lifecycleStatus === 1) return 'Admin có thể yêu cầu thanh toán nếu POI cần phí kích hoạt.';
  if (lifecycleStatus === 2 && paymentStatus === 1) return 'Vendor thanh toán, hoặc Admin đánh dấu đã thanh toán/miễn thanh toán.';
  if (lifecycleStatus === 3) return 'POI đã kích hoạt.';
  if (lifecycleStatus === 5) return 'POI đã bị từ chối.';
  return 'Không có hành động thanh toán tiếp theo.';
}

function formatDateTime(value?: string | null): string {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function formatCoordinates(poi: any): string {
  if (poi.latitude === undefined || poi.latitude === null || poi.longitude === undefined || poi.longitude === null) {
    return '-';
  }

  return `${poi.latitude}, ${poi.longitude}`;
}

function getPoiImageUrls(poi: any): string[] {
  const imageUrls = Array.isArray(poi.imageUrls) ? poi.imageUrls : [];
  const sourceUrls = imageUrls.length > 0 ? imageUrls : poi.imageUrl ? [poi.imageUrl] : [];

  return sourceUrls
    .map((url: string) => buildPoiImageUrl(poi.id, url))
    .filter((url: string | null): url is string => Boolean(url));
}

function openImagePreview(
  poi: any,
  setViewingImages: (urls: string[] | null) => void,
  setCurrentImgIndex: (index: number) => void,
) {
  const urls = getPoiImageUrls(poi);
  if (urls.length === 0) {
    setViewingImages(null);
    return;
  }

  setViewingImages(urls);
  setCurrentImgIndex(0);
}

export default PoiTable;
