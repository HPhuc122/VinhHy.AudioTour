import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../../components/ui/Button';
import usePois from '../hooks/usePois';
import { poisApi } from '../api/poisApi';
import { useToast } from '../../../components/ui/Toast';
import { buildAssetUrl } from '../../../utils/assetUrl';
import PoiTranslationModal from './PoiTranslationModal';

type ApprovalStatusValue = 0 | 1 | 2;

const APPROVAL_STATUS_OPTIONS: Array<{
  value: ApprovalStatusValue;
  label: string;
  selectClassName: string;
}> = [
  {
    value: 0,
    label: 'Chờ duyệt',
    selectClassName: 'border-yellow-300 bg-yellow-50 text-yellow-800 focus:ring-yellow-400',
  },
  {
    value: 1,
    label: 'Đã duyệt',
    selectClassName: 'border-green-300 bg-green-50 text-green-800 focus:ring-green-400',
  },
  {
    value: 2,
    label: 'Từ chối',
    selectClassName: 'border-red-300 bg-red-50 text-red-800 focus:ring-red-400',
  },
];

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
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [updatingApprovalId, setUpdatingApprovalId] = useState<number | null>(null);
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

  const updateApprovalStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ApprovalStatusValue }) =>
      poisApi.updateApprovalStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pois'] }),
  });

  const handleApprovalStatusChange = async (
    poi: any,
    nextStatus: ApprovalStatusValue,
    resetSelect: () => void,
  ) => {
    const currentStatus = getApprovalStatusValue(poi.approvalStatus);
    if (nextStatus === currentStatus) {
      return;
    }

    const nextLabel = getApprovalStatusLabel(nextStatus);
    const ok = window.confirm(`Đổi trạng thái duyệt của ${poi.name || poi.code} thành "${nextLabel}"?`);
    if (!ok) {
      resetSelect();
      return;
    }

    try {
      setUpdatingApprovalId(poi.id);
      await updateApprovalStatusMutation.mutateAsync({ id: poi.id, status: nextStatus });
      toast('Đã cập nhật trạng thái duyệt', 'success');
    } catch (err: any) {
      resetSelect();
      const msg = err?.response?.data?.message ?? 'Lỗi khi cập nhật trạng thái duyệt';
      toast(msg, 'error');
    } finally {
      setUpdatingApprovalId(null);
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
      <table className="min-w-[1120px] bg-white divide-y divide-gray-100">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3 text-left">Mã địa điểm</th>
            <th className="px-4 py-3 text-left">Tên địa điểm</th>
            <th className="px-4 py-3 text-left">Ảnh</th>
            <th className="px-4 py-3 text-left">Phân loại</th>
            <th className="px-4 py-3 text-left">Tọa độ</th>
            <th className="px-4 py-3 text-left">Trạng thái duyệt</th>
            <th className="px-4 py-3 text-left">Hoạt động</th>
            <th className="px-4 py-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-sm">
          {data?.items.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                Không có địa điểm
              </td>
            </tr>
          ) : (
            data?.items.map((poi: any) => {
              const isDeleted = !!poi.deletedAt;
              return (
                <tr key={poi.id} className={`hover:bg-gray-50 transition-colors ${isDeleted ? 'bg-red-50 opacity-80' : ''}`}>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <span>{poi.code}</span>
                      {isDeleted && (
                        <span className="inline-block text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">Đã xóa</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-900">
                    <div className="max-w-[220px] truncate" title={poi.name || undefined}>
                      {poi.name?.trim() ? (
                        poi.name
                      ) : (
                        <span className="italic text-gray-400">Chưa cập nhật</span>
                      )}
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
                    <div className="min-w-[150px]">
                      {isVendorMode ? (
                        <span className={`inline-block rounded-full border px-2 py-1 text-xs font-medium ${getApprovalStatusBadgeClassName(poi.approvalStatus)}`}>
                          {getApprovalStatusLabel(getApprovalStatusValue(poi.approvalStatus))}
                        </span>
                      ) : (
                        <select
                          value={getApprovalStatusValue(poi.approvalStatus)}
                          disabled={isDeleted || updatingApprovalId === poi.id}
                          className={`w-full rounded-md border px-2 py-1 text-xs font-medium shadow-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${getApprovalStatusClassName(poi.approvalStatus)}`}
                          onChange={(event) => {
                            const currentStatus = getApprovalStatusValue(poi.approvalStatus);
                            const nextStatus = Number(event.target.value) as ApprovalStatusValue;
                            void handleApprovalStatusChange(poi, nextStatus, () => {
                              event.currentTarget.value = String(currentStatus);
                            });
                          }}
                        >
                          {APPROVAL_STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      )}
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
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setTranslatingPoi(poi)}
                        >
                          👁️ Xem bản dịch
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onEdit?.(poi)}
                      >
                        Sửa
                      </Button>
                      {isDeleted ? (
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
                      ) : (
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
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {translatingPoi && (
        <PoiTranslationModal
          isOpen={!!translatingPoi}
          onClose={() => setTranslatingPoi(null)}
          poi={translatingPoi}
          readOnly={isVendorMode}
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
              ×
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
                  ❮
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
                  ❯
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

function getApprovalStatusValue(status: unknown): ApprovalStatusValue {
  if (status === 'Approved') {
    return 1;
  }

  if (status === 'Rejected') {
    return 2;
  }

  const value = Number(status);
  return value === 1 || value === 2 ? value : 0;
}

function getApprovalStatusLabel(status: ApprovalStatusValue): string {
  return APPROVAL_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? 'Chờ duyệt';
}

function getApprovalStatusClassName(status: unknown): string {
  const value = getApprovalStatusValue(status);
  const fallbackClassName = 'border-yellow-300 bg-yellow-50 text-yellow-800 focus:ring-yellow-400';
  return APPROVAL_STATUS_OPTIONS.find((option) => option.value === value)?.selectClassName
    ?? fallbackClassName;
}

function getApprovalStatusBadgeClassName(status: unknown): string {
  const value = getApprovalStatusValue(status);

  if (value === 1) {
    return 'border-green-200 bg-green-100 text-green-800';
  }

  if (value === 2) {
    return 'border-red-200 bg-red-100 text-red-800';
  }

  return 'border-yellow-200 bg-yellow-100 text-yellow-800';
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
