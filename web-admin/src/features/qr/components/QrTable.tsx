import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { routes } from '@/config/routes';
import type { QrDto } from '@/features/qr/api/qrApi';

interface QrTableProps {
  qrs: QrDto[];
  deletingQrId?: number | null;
  onDelete: (qr: QrDto) => void;
}

export function QrTable({ qrs, deletingQrId = null, onDelete }: QrTableProps) {
  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
  };

  if (qrs.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-gray-100 bg-white px-4 py-10 text-center text-sm text-gray-600">
        No QR codes found.
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Code</th>
              <th className="px-4 py-3 text-left font-semibold">POI ID</th>
              <th className="px-4 py-3 text-left font-semibold">Tour ID</th>
              <th className="px-4 py-3 text-left font-semibold">Payment</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Created</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {qrs.map((qr) => (
              <tr key={qr.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                  {qr.code}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                  <TargetValue id={qr.poiId} code={qr.poiCode} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                  <TargetValue id={qr.tourId} code={qr.tourCode} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                  {qr.requiresPayment ? (
                    <span className="inline-flex flex-col">
                      <span>{formatCurrency(qr.priceAmount)}</span>
                      <span className="text-xs text-gray-500">{qr.accessDurationMinutes} min</span>
                    </span>
                  ) : (
                    <span className="text-gray-500">Free</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      qr.isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-gray-50 text-gray-600'
                    }`}
                  >
                    {qr.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                  {formatDate(qr.createdAt)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      to={routes.qrEdit.replace(':id', String(qr.id))}
                      className="inline-flex items-center justify-center rounded-md bg-transparent px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                    >
                      Edit
                    </Link>
                    <Button size="sm" variant="secondary" onClick={() => void copyCode(qr.code)}>
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-700 hover:bg-red-50"
                      isLoading={deletingQrId === qr.id}
                      onClick={() => onDelete(qr)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TargetValue({ id, code }: { id?: number | null; code?: string | null }) {
  if (id == null) {
    return <span>-</span>;
  }

  return (
    <span className="inline-flex flex-col">
      <span>{id}</span>
      {code ? <span className="text-xs text-gray-600">{code}</span> : null}
    </span>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}
