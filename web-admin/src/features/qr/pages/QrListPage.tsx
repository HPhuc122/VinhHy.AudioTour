import { Link } from 'react-router-dom';
import { ApiClientError } from '@/api/apiError';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { routes } from '@/config/routes';
import type { QrDto } from '@/features/qr/api/qrApi';
import { QrTable } from '@/features/qr/components/QrTable';
import { useDeleteQrMutation } from '@/features/qr/hooks/useDeleteQrMutation';
import { useQrsQuery } from '@/features/qr/hooks/useQrsQuery';

export function QrListPage() {
  const qrsQuery = useQrsQuery();
  const deleteQrMutation = useDeleteQrMutation();
  const deletingQrId =
    typeof deleteQrMutation.variables === 'number' ? deleteQrMutation.variables : null;

  const handleDelete = (qr: QrDto) => {
    const confirmed = window.confirm(`Delete QR code ${qr.code}?`);
    if (!confirmed) {
      return;
    }

    deleteQrMutation.mutate(qr.id);
  };

  const queryError = getErrorMessage(qrsQuery.error);
  const deleteError = getErrorMessage(deleteQrMutation.error);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">QR codes</h1>
          <p className="mt-1 text-sm text-slate-600">Manage QR records for POIs and tours.</p>
        </div>
        <Link
          to={routes.qrCreate}
          className="inline-flex items-center justify-center rounded-lg bg-sky-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-900"
        >
          Create QR code
        </Link>
      </div>

      {queryError ? <Alert variant="error" message={queryError} /> : null}
      {deleteError ? <Alert variant="error" message={deleteError} /> : null}

      {qrsQuery.isLoading ? <Spinner label="Loading QR codes..." /> : null}

      {qrsQuery.data ? (
        <QrTable qrs={qrsQuery.data} deletingQrId={deletingQrId} onDelete={handleDelete} />
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

  return 'Unable to load QR codes.';
}
