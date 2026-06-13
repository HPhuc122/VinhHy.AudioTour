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
      <div className="rounded-md border border-dashed border-[var(--app-border)] bg-white px-4 py-10 text-center text-sm text-[var(--app-text)]">
        No QR codes found.
      </div>
    );
  }

  return (
    <div className="app-table-shell">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--app-border)] text-sm">
          <thead className="app-table-head">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Code</th>
              <th className="px-4 py-3 text-left font-semibold">POI ID</th>
              <th className="px-4 py-3 text-left font-semibold">Tour ID</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Created</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--app-border)] bg-white">
            {qrs.map((qr) => (
              <tr key={qr.id} className="hover:bg-[var(--app-surface-muted)]">
                <td className="whitespace-nowrap px-4 py-3 font-medium text-[var(--app-heading)]">
                  {qr.code}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[var(--app-text)]">
                  <TargetValue id={qr.poiId} code={qr.poiCode} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[var(--app-text)]">
                  <TargetValue id={qr.tourId} code={qr.tourCode} />
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      qr.isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-[var(--app-surface-muted)] text-[var(--app-text)]'
                    }`}
                  >
                    {qr.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[var(--app-text)]">
                  {formatDate(qr.createdAt)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      to={routes.qrEdit.replace(':id', String(qr.id))}
                      className="inline-flex items-center justify-center rounded-md bg-transparent px-3 py-2 text-sm font-medium text-[var(--app-text)] transition hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-heading)]"
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
      {code ? <span className="text-xs text-[var(--app-text)]">{code}</span> : null}
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
