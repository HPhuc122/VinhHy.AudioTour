import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { routes } from '@/config/routes';
import type { QrDto } from '@/features/qr/api/qrApi';
import { drawQrCode } from '@/utils/qrCodeCanvas';
import { formatVietnamDate } from '@/utils/dateTime';

interface QrTableProps {
  qrs: QrDto[];
  deletingQrId?: number | null;
  onDelete: (qr: QrDto) => void;
}

export function QrTable({ qrs, deletingQrId = null, onDelete }: QrTableProps) {
  if (qrs.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-gray-100 bg-white px-4 py-10 text-center text-sm text-gray-600">
        Không có mã QR nào.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">QR</th>
              <th className="px-4 py-3 text-left font-semibold">Mã</th>
              <th className="px-4 py-3 text-left font-semibold">Loại</th>
              <th className="px-4 py-3 text-left font-semibold">Giá</th>
              <th className="px-4 py-3 text-left font-semibold">Thời lượng</th>
              <th className="px-4 py-3 text-left font-semibold">Trạng thái</th>
              <th className="px-4 py-3 text-left font-semibold">Ngày tạo</th>
              <th className="px-4 py-3 text-right font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {qrs.map((qr) => {
              const publicUrl = qr.publicUrl;

              return (
                <tr key={qr.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <QrCanvas value={publicUrl} code={qr.code} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                    <div>{qr.name}</div>
                    <div className="text-xs font-normal text-gray-500">{qr.code}</div>
                    <button
                      type="button"
                      className="mt-1 max-w-[220px] truncate text-xs text-blue-700 underline"
                      onClick={() => void navigator.clipboard.writeText(publicUrl)}
                      title={publicUrl}
                    >
                      {publicUrl}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    <QrType qr={qr} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {qr.qrKind === 'AudioPackage' ? (qr.requiresPayment ? formatCurrency(qr.priceAmount) : 'Miễn phí') : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {qr.qrKind === 'AudioPackage' ? `${qr.accessDurationMinutes} phút` : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        qr.isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-gray-50 text-gray-600'
                      }`}
                    >
                      {qr.isActive ? 'Hoạt động' : 'Tạm tắt'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {formatVietnamDate(qr.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={routes.qrEdit.replace(':id', String(qr.id))}
                        className="inline-flex items-center justify-center rounded-md bg-transparent px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                      >
                        Sửa
                      </Link>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => void navigator.clipboard.writeText(publicUrl)}
                      >
                        Sao chép link
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-700 hover:bg-red-50"
                        isLoading={deletingQrId === qr.id}
                        onClick={() => onDelete(qr)}
                      >
                        Xóa
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function QrCanvas({ value, code }: { value: string; code: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileName = useMemo(() => `qr-${code}.png`, [code]);

  useEffect(() => {
    if (canvasRef.current) {
      drawQrCode(canvasRef.current, value, 3);
    }
  }, [value]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = fileName;
    link.click();
  };

  return (
    <div className="flex w-24 flex-col items-center gap-2">
      <canvas ref={canvasRef} className="h-20 w-20 rounded border border-gray-200 bg-white" />
      <button type="button" className="text-xs text-blue-700 underline" onClick={handleDownload}>
        Tải PNG
      </button>
    </div>
  );
}

function QrType({ qr }: { qr: QrDto }) {
  if (qr.qrKind === 'Poi') return <span>Đường dẫn POI<br/><small>{qr.poiCode ?? qr.poiId}</small></span>;
  if (qr.qrKind === 'Tour') return <span>Đường dẫn Tour<br/><small>{qr.tourCode ?? qr.tourId}</small></span>;
  return <span>Thanh toán gói Audio</span>;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}
