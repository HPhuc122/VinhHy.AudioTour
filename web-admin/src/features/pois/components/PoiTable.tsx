
import { Button } from '../../../components/ui/Button';
import usePois from '../hooks/usePois';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { poisApi } from '../api/poisApi';
import { useToast } from '../../../components/ui/Toast';
import { useState } from 'react';
import { buildAssetUrl } from '../../../utils/assetUrl';
import PoiTranslationModal from './PoiTranslationModal';

interface Props {
  onEdit?: (poi: any) => void;
  onAddTranslate?: (poi: any) => void;
}

export function PoiTable({ onEdit, onAddTranslate }: Props) {
  const { data, isLoading, isError, error } = usePois();
  const qc = useQueryClient();
  const toast = useToast();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [translatingPoi, setTranslatingPoi] = useState<any>(null);

  const getFullImageUrl = (url?: string | null) => {
    if (!url) return null;
    if (/^https?:\/\//i.test(url) || /^\/\//.test(url)) return url;
    const base = (import.meta as any)?.env?.VITE_API_BASE_URL ?? '';
    return base ? `${base.replace(/\/$/, '')}/${url.replace(/^\//, '')}` : url;
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) => poisApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pois'] }),
  });

  if (isLoading) {
    return <div>Đang tải dữ liệu...</div>;
  }

  if (isError) {
    return <div className="text-red-500">Có lỗi xảy ra khi tải dữ liệu</div>;
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full bg-white divide-y divide-gray-100">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3 text-left">MÃ ĐỊA ĐIỂM</th>
            <th className="px-4 py-3 text-left">ẢNH</th>
            <th className="px-4 py-3 text-left">Phân loại</th>
            <th className="px-4 py-3 text-left">Tọa độ</th>
            <th className="px-4 py-3 text-left">Trạng thái</th>
            <th className="px-4 py-3 text-right">Hành động</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-sm">
          {data?.items.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                Không có địa điểm
              </td>
            </tr>
          ) : (
            data?.items.map((poi: any) => (
              <tr key={poi.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{poi.code}</td>
                <td className="px-4 py-3">
                  {poi.imageUrl ? (
                    <img
                      src={buildAssetUrl(poi.imageUrl) || ''}
                      alt={`POI ${poi.code ?? ''}`}
                      className="w-16 h-16 object-cover rounded-md border cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedImageUrl(buildAssetUrl(poi.imageUrl) || '')}
                    />
                  ) : (
                    <span className="text-gray-400 italic">Trống</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{poi.category}</td>
                <td className="px-4 py-3 text-gray-500">{poi.latitude}, {poi.longitude}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${poi.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {poi.isActive ? 'Hoạt động' : 'Vô hiệu'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setTranslatingPoi(poi)}
                    >
                      + Dịch thuật
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onEdit?.(poi)}
                    >
                      Sửa
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={async () => {
                        const ok = window.confirm('Bạn có chắc chắn muốn xóa địa điểm này?');
                        if (!ok) return;
                        try {
                          setDeletingId(poi.id);
                          await deleteMutation.mutateAsync(poi.id);
                          toast('Đã xoá địa điểm', 'success');
                        } catch (err: any) {
                          const msg = err?.response?.data?.message ?? 'Lỗi khi xoá địa điểm';
                          toast(msg, 'error');
                        } finally {
                          setDeletingId(null);
                        }
                      }}
                      disabled={deletingId === poi.id}
                      loading={deletingId === poi.id}
                    >
                      Xoá
                    </Button>
                  </div>
      {translatingPoi && (
        <PoiTranslationModal
          isOpen={!!translatingPoi}
          onClose={() => setTranslatingPoi(null)}
          poi={translatingPoi}
        />
      )}
                </td>
              </tr>
            ))
          )}
          {/* Lightbox is rendered after the table to avoid nesting inside tbody */}
        </tbody>
      </table>
      {selectedImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedImageUrl(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
        >
          <div
            className="relative max-w-full max-h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedImageUrl(null)}
              className="absolute -top-4 -right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white text-3xl hover:bg-white/40 transition-colors"
              aria-label="Close image"
            >
              ×
            </button>

            <img
              src={selectedImageUrl}
              alt="POI large"
              className="block max-w-[95vw] max-h-[90vh] object-contain rounded-lg border-2 border-white/20 shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default PoiTable;
