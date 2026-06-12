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
      <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-600">
        No QR codes found.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Code</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">POI ID</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Tour ID</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Created</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {qrs.map((qr) => (
              <tr key={qr.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                  {qr.code}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                  <TargetValue id={qr.poiId} code={qr.poiCode} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                  <TargetValue id={qr.tourId} code={qr.tourCode} />
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      qr.isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {qr.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                  {formatDate(qr.createdAt)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      to={routes.qrEdit.replace(':id', String(qr.id))}
                      className="inline-flex items-center justify-center rounded-lg bg-transparent px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
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
      {code ? <span className="text-xs text-slate-500">{code}</span> : null}
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
