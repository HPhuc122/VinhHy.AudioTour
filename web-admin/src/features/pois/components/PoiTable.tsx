import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import usePois from '../hooks/usePois';
import { poisApi } from '../api/poisApi';
import { useToast } from '../../../components/ui/Toast';
import { buildAssetUrl } from '../../../utils/assetUrl';
import PoiTranslationModal from './PoiTranslationModal';

type LifecycleStatusValue = 0 | 1 | 2 | 3 | 4 | 5;
type PaymentStatusValue = 0 | 1 | 2 | 3;
type AdminLifecycleAction = 'approve' | 'reject' | 'request-payment';

interface Props {
  filters?: any;
  onEdit?: (poi: any) => void;
  onAddTranslate?: (poi: any) => void;
  isVendorMode?: boolean;
}

export function PoiTable({ filters, onEdit, isVendorMode = false }: Props) {
  const { data, isLoading, isError } = usePois(filters);
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [updatingLifecycleId, setUpdatingLifecycleId] = useState<number | null>(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<number | null>(null);
  const [viewingImages, setViewingImages] = useState<string[] | null>(null);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [translatingPoi, setTranslatingPoi] = useState<any>(null);

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

  const handleLifecycleAction = async (poi: any, action: AdminLifecycleAction) => {
    const label = getLifecycleActionLabel(action);
    const ok = window.confirm(`Xác nhận "${label}" cho ${poi.name || poi.code}?`);
    if (!ok) {
      return;
    }

    try {
      setUpdatingLifecycleId(poi.id);
      if (action === 'approve') {
        await approveReviewMutation.mutateAsync(poi.id);
      } else if (action === 'request-payment') {
        await requestPaymentMutation.mutateAsync(poi.id);
      } else {
        await rejectMutation.mutateAsync(poi.id);
      }
      toast('Đã cập nhật vòng đời POI', 'success');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Lỗi khi cập nhật vòng đời POI';
      toast(msg, 'error');
    } finally {
      setUpdatingLifecycleId(null);
    }
  };

  const handlePaymentAction = async (poi: any, action: 'paid' | 'waived') => {
    const label = action === 'paid' ? 'đã thanh toán' : 'miễn/thanh toán trực tiếp';
    const ok = window.confirm(`Xác nhận ${poi.name || poi.code} là "${label}" và kích hoạt POI?`);
    if (!ok) {
      return;
    }

    try {
      setUpdatingPaymentId(poi.id);
      if (action === 'paid') {
        await markPaidMutation.mutateAsync(poi.id);
      } else {
        await waivePaymentMutation.mutateAsync(poi.id);
      }
      toast('Đã kích hoạt POI', 'success');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Lỗi khi cập nhật thanh toán POI';
      toast(msg, 'error');
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  const handleVendorMomoPayment = async (poi: any) => {
    const ok = window.confirm(`Thanh toán MoMo mô phỏng cho ${poi.name || poi.code}?`);
    if (!ok) {
      return;
    }

    try {
      setUpdatingPaymentId(poi.id);
      await vendorMomoPaymentMutation.mutateAsync(poi.id);
      toast('Thanh toán MoMo mô phỏng thành công. POI đã được kích hoạt.', 'success');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Thanh toán MoMo mô phỏng thất bại';
      toast(msg, 'error');
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  if (isLoading) {
    return <div>Đang tải dữ liệu...</div>;
  }

  if (isError) {
    return <div className="text-red-500">Có lỗi xảy ra khi tải dữ liệu</div>;
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-[1420px] bg-white divide-y divide-gray-100">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3 text-left">Mã địa điểm</th>
            <th className="px-4 py-3 text-left">Tên địa điểm</th>
            <th className="px-4 py-3 text-left">Ảnh</th>
            <th className="px-4 py-3 text-left">Phân loại</th>
            <th className="px-4 py-3 text-left">Tọa độ</th>
            <th className="px-4 py-3 text-left">Vòng đời</th>
            <th className="px-4 py-3 text-left">Thanh toán</th>
            <th className="px-4 py-3 text-left">Hiệu lực</th>
            <th className="px-4 py-3 text-left">Hoạt động</th>
            <th className="px-4 py-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-sm">
          {data?.items.length === 0 ? (
            <tr>
              <td colSpan={10} className="px-4 py-6 text-center text-gray-500">
                Không có địa điểm
              </td>
            </tr>
          ) : (
            data?.items.map((poi: any) => {
              const isDeleted = !!poi.deletedAt;
              const lifecycleStatus = getLifecycleStatusValue(poi.lifecycleStatus);
              const paymentStatus = getPaymentStatusValue(poi.paymentStatus);
              const canVendorEdit = isVendorMode
                && lifecycleStatus !== 1
                && lifecycleStatus !== 2
                && lifecycleStatus !== 3
                && !isDeleted;
              const canAdminApprove = !isVendorMode && !isDeleted && lifecycleStatus === 0;
              const canAdminReject = !isVendorMode && !isDeleted && (lifecycleStatus === 0 || lifecycleStatus === 1);
              const canRequestPayment = !isVendorMode && !isDeleted && lifecycleStatus === 1;
              const canActivatePayment = !isVendorMode && !isDeleted && lifecycleStatus === 2 && paymentStatus === 1;
              const canVendorPay = isVendorMode && !isDeleted && lifecycleStatus === 2 && paymentStatus === 1;
              const isPaying = updatingPaymentId === poi.id;
              const isLifecycleUpdating = updatingLifecycleId === poi.id;

              return (
                <tr key={poi.id} className={`hover:bg-gray-50 transition-colors ${isDeleted ? 'bg-red-50 opacity-80' : ''}`}>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <span>{poi.code}</span>
                      {isDeleted ? (
                        <span className="inline-block text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">Đã xóa</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-900">
                    <div className="max-w-[220px] truncate" title={poi.name || undefined}>
                      {poi.name?.trim() ? poi.name : <span className="italic text-gray-400">Chưa cập nhật</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {poi.imageUrl ? (
                      <div
                        className="relative h-16 w-16 cursor-pointer"
                        onClick={() => {
                          const imageUrls = getPoiImageUrls(poi);
                          if (imageUrls.length === 0) {
                            return;
                          }

                          setViewingImages(imageUrls);
                          setCurrentImgIndex(0);
                        }}
                      >
                        <img
                          src={buildAssetUrl(poi.imageUrl) || ''}
                          alt={`POI ${poi.code ?? ''}`}
                          className={`h-16 w-16 rounded-md border object-cover transition-opacity hover:opacity-80 ${isDeleted ? 'filter grayscale' : ''}`}
                        />
                        {getPoiImageCount(poi) > 1 ? (
                          <span className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow">
                            +{getPoiImageCount(poi) - 1}
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Trống</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{poi.category}</td>
                  <td className="px-4 py-3 text-gray-500">{poi.latitude}, {poi.longitude}</td>
                  <td className="px-4 py-3">
                    <div className="flex min-w-[190px] flex-col items-start gap-2">
                      <span className={`inline-block rounded-full border px-2 py-1 text-xs font-medium ${getLifecycleStatusBadgeClassName(lifecycleStatus)}`}>
                        {isPaying ? 'Đang thanh toán' : getLifecycleStatusLabel(lifecycleStatus)}
                      </span>
                      {!isVendorMode ? (
                        <div className="flex flex-wrap gap-1">
                          {canAdminApprove ? (
                            <Button
                              size="sm"
                              variant="primary"
                              disabled={isLifecycleUpdating}
                              loading={isLifecycleUpdating}
                              onClick={() => void handleLifecycleAction(poi, 'approve')}
                            >
                              Duyệt
                            </Button>
                          ) : null}
                          {canAdminReject ? (
                            <Button
                              size="sm"
                              variant="danger"
                              disabled={isLifecycleUpdating}
                              loading={isLifecycleUpdating}
                              onClick={() => void handleLifecycleAction(poi, 'reject')}
                            >
                              Từ chối
                            </Button>
                          ) : null}
                          {canRequestPayment ? (
                            <Button
                              size="sm"
                              variant="primary"
                              disabled={isLifecycleUpdating}
                              loading={isLifecycleUpdating}
                              onClick={() => void handleLifecycleAction(poi, 'request-payment')}
                            >
                              Yêu cầu thanh toán
                            </Button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex min-w-[170px] flex-col items-start gap-2">
                      <span className={`inline-block rounded-full border px-2 py-1 text-xs font-medium ${getPaymentStatusBadgeClassName(paymentStatus)}`}>
                        {getPaymentStatusLabel(paymentStatus)}
                      </span>
                      {canActivatePayment ? (
                        <div className="flex flex-wrap gap-1">
                          <Button
                            size="sm"
                            variant="primary"
                            disabled={updatingPaymentId === poi.id}
                            loading={updatingPaymentId === poi.id}
                            onClick={() => void handlePaymentAction(poi, 'paid')}
                          >
                            Đã thanh toán
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={updatingPaymentId === poi.id}
                            onClick={() => void handlePaymentAction(poi, 'waived')}
                          >
                            Miễn/Trực tiếp
                          </Button>
                        </div>
                      ) : null}
                      {canVendorPay ? (
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={isPaying}
                          loading={isPaying}
                          onClick={() => void handleVendorMomoPayment(poi)}
                        >
                          Thanh toán MoMo
                        </Button>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    <div className="min-w-[160px] space-y-1">
                      <div>Từ: {formatDateTime(poi.validFrom)}</div>
                      <div>Đến: {formatDateTime(poi.validUntil)}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex min-w-[90px] flex-col items-start gap-1">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${poi.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {poi.isActive ? 'Hoạt động' : 'Tạm tắt'}
                      </span>
                      {isDeleted ? (
                        <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">Đã xóa</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      {!isVendorMode ? (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => setTranslatingPoi(poi)}
                        >
                          + Dịch thuật
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate(`/media?tab=narrations&poiId=${poi.id}`)}
                      >
                        Thuyết minh
                      </Button>
                      {isVendorMode ? (
                        canVendorEdit ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onEdit?.(poi)}
                          >
                            Sửa
                          </Button>
                        ) : null
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onEdit?.(poi)}
                        >
                          Sửa
                        </Button>
                      )}
                      {!isVendorMode && isDeleted ? (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={async () => {
                            const ok = window.confirm('Bạn có chắc muốn khôi phục địa điểm này?');
                            if (!ok) return;
                            try {
                              setRestoringId(poi.id);
                              await restoreMutation.mutateAsync(poi.id);
                              toast('Đã khôi phục địa điểm', 'success');
                            } catch (err: any) {
                              const msg = err?.response?.data?.message ?? 'Lỗi khi khôi phục địa điểm';
                              toast(msg, 'error');
                            } finally {
                              setRestoringId(null);
                            }
                          }}
                          disabled={restoringId === poi.id}
                          loading={restoringId === poi.id}
                        >
                          Khôi phục
                        </Button>
                      ) : null}
                      {!isVendorMode && !isDeleted ? (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={async () => {
                            const ok = window.confirm('Bạn có chắc muốn xóa địa điểm này?');
                            if (!ok) return;
                            try {
                              setDeletingId(poi.id);
                              await deleteMutation.mutateAsync(poi.id);
                              toast('Đã xóa địa điểm', 'success');
                            } catch (err: any) {
                              const msg = err?.response?.data?.message ?? 'Lỗi khi xóa địa điểm';
                              toast(msg, 'error');
                            } finally {
                              setDeletingId(null);
                            }
                          }}
                          disabled={deletingId === poi.id}
                          loading={deletingId === poi.id}
                          className={`${deletingId === poi.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          Xóa
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {!isVendorMode && translatingPoi && (
        <PoiTranslationModal
          isOpen={!!translatingPoi}
          onClose={() => setTranslatingPoi(null)}
          poi={translatingPoi}
        />
      )}

      {viewingImages && viewingImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setViewingImages(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Xem ảnh địa điểm"
        >
          <div
            className="relative max-w-full max-h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setViewingImages(null);
              }}
              className="absolute -right-4 -top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-3xl text-white transition-colors hover:bg-white/40"
              aria-label="Đóng ảnh"
            >
              x
            </button>

            {viewingImages.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setCurrentImgIndex((index) =>
                      index === 0 ? viewingImages.length - 1 : index - 1,
                    );
                  }}
                  className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-3xl text-white shadow-lg transition-colors hover:bg-black/70"
                  aria-label="Ảnh trước"
                >
                  &lt;
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setCurrentImgIndex((index) =>
                      index >= viewingImages.length - 1 ? 0 : index + 1,
                    );
                  }}
                  className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-3xl text-white shadow-lg transition-colors hover:bg-black/70"
                  aria-label="Ảnh tiếp theo"
                >
                  &gt;
                </button>
              </>
            ) : null}

            <img
              src={viewingImages[currentImgIndex]}
              alt="Ảnh địa điểm phóng to"
              className="block max-w-[95vw] max-h-[90vh] object-contain rounded-lg border-2 border-white/20 shadow-2xl"
            />
            {viewingImages.length > 1 ? (
              <div className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm font-medium text-white shadow">
                {currentImgIndex + 1} / {viewingImages.length}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function getLifecycleStatusValue(status: unknown): LifecycleStatusValue {
  if (status === 'Approved') {
    return 1;
  }

  if (status === 'PendingPayment') {
    return 2;
  }

  if (status === 'Active') {
    return 3;
  }

  if (status === 'Expired') {
    return 4;
  }

  if (status === 'Rejected') {
    return 5;
  }

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
      return 'Từ chối';
    default:
      return 'Chờ duyệt';
  }
}

function getLifecycleStatusBadgeClassName(status: LifecycleStatusValue): string {
  switch (status) {
    case 1:
      return 'border-sky-200 bg-sky-100 text-sky-800';
    case 2:
      return 'border-amber-200 bg-amber-100 text-amber-800';
    case 3:
      return 'border-green-200 bg-green-100 text-green-800';
    case 4:
      return 'border-gray-300 bg-gray-100 text-gray-700';
    case 5:
      return 'border-red-200 bg-red-100 text-red-800';
    default:
      return 'border-yellow-200 bg-yellow-100 text-yellow-800';
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
  if (status === 'NotRequired') {
    return 0;
  }

  if (status === 'PendingPayment') {
    return 1;
  }

  if (status === 'Paid') {
    return 2;
  }

  if (status === 'Waived') {
    return 3;
  }

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
      return 'Miễn/Trực tiếp';
    default:
      return 'Không yêu cầu';
  }
}

function getPaymentStatusBadgeClassName(status: PaymentStatusValue): string {
  switch (status) {
    case 1:
      return 'border-amber-200 bg-amber-100 text-amber-800';
    case 2:
      return 'border-green-200 bg-green-100 text-green-800';
    case 3:
      return 'border-blue-200 bg-blue-100 text-blue-800';
    default:
      return 'border-gray-200 bg-gray-100 text-gray-700';
  }
}

function formatDateTime(value?: string | null): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function getPoiImageUrls(poi: any): string[] {
  const imageUrls = Array.isArray(poi.imageUrls)
    ? poi.imageUrls
    : [];

  const sourceUrls = imageUrls.length > 0
    ? imageUrls
    : poi.imageUrl
      ? [poi.imageUrl]
      : [];

  return sourceUrls
    .map((url: string) => buildAssetUrl(url))
    .filter((url: string | null): url is string => Boolean(url));
}

function getPoiImageCount(poi: any): number {
  if (Array.isArray(poi.imageUrls) && poi.imageUrls.length > 0) {
    return poi.imageUrls.length;
  }

  return poi.imageUrl ? 1 : 0;
}

export default PoiTable;
