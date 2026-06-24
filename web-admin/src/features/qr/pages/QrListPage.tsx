import { Link, useSearchParams } from 'react-router-dom';
import { ApiClientError } from '@/api/apiError';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { routes } from '@/config/routes';
import type { QrDto } from '@/features/qr/api/qrApi';
import { QrTable } from '@/features/qr/components/QrTable';
import { useDeleteQrMutation } from '@/features/qr/hooks/useDeleteQrMutation';
import { useQrsQuery } from '@/features/qr/hooks/useQrsQuery';

export function QrListPage() {
  const [searchParams] = useSearchParams();
  const view = searchParams.get('view') === 'payment' ? 'payment' : 'access';
  const qrsQuery = useQrsQuery();
  const deleteQrMutation = useDeleteQrMutation();
  const deletingQrId =
    deleteQrMutation.isPending && typeof deleteQrMutation.variables === 'number'
      ? deleteQrMutation.variables
      : null;

  const handleDelete = (qr: QrDto) => {
    const confirmed = window.confirm(`Xóa mã QR ${qr.code}?`);
    if (!confirmed) {
      return;
    }

    deleteQrMutation.mutate(qr.id);
  };

  const queryError = getErrorMessage(qrsQuery.error);
  const deleteError = getErrorMessage(deleteQrMutation.error);
  const qrs = (qrsQuery.data ?? []).filter((qr) =>
    view === 'payment' ? qr.qrKind === 'AudioPackage' : qr.qrKind !== 'AudioPackage',
  );

  return (
    <section className="app-page">
      <div className="app-page-header">
        <div>
          <h1 className="app-title">{view === 'payment' ? 'QR thanh toán' : 'QR địa chỉ'}</h1>
          <p className="app-subtitle">
            {view === 'payment'
              ? 'Quản lý mã QR thanh toán và kích hoạt gói nghe.'
              : 'Quản lý mã QR mở trực tiếp trang POI hoặc tour.'}
          </p>
        </div>
        <Link
          to={`${routes.qrCreate}?view=${view}`}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Thêm mã QR
        </Link>
      </div>

      {queryError ? <Alert variant="error" message={queryError} /> : null}
      {deleteError ? <Alert variant="error" message={deleteError} /> : null}

      {qrsQuery.isLoading ? <Spinner label="Đang tải mã QR..." /> : null}

      {qrsQuery.data ? (
        <QrTable qrs={qrs} deletingQrId={deletingQrId} onDelete={handleDelete} />
      ) : null}
    </section>
  );
}

function getErrorMessage(error: unknown): string | null {
  if (!error) {
    return null;
  }

  if (error instanceof ApiClientError) {
    return error.message;
  }

  return 'Không thể tải danh sách mã QR.';
}
