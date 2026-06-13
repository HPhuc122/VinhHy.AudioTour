import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { routes } from '@/config/routes';
import type { TourDto } from '@/features/tours/api/tourApi';

interface TourTableProps {
  tours: TourDto[];
  deletingTourId?: number | null;
  onDelete: (tour: TourDto) => void;
}

export function TourTable({ tours, deletingTourId = null, onDelete }: TourTableProps) {
  if (tours.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-gray-100 bg-white px-4 py-10 text-center text-sm text-gray-600">
        No tours found.
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
              <th className="px-4 py-3 text-left font-semibold">Language</th>
              <th className="px-4 py-3 text-left font-semibold">Duration</th>
              <th className="px-4 py-3 text-left font-semibold">POIs</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Updated</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {tours.map((tour) => (
              <tr key={tour.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                  {tour.code}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                  <span className="inline-flex rounded bg-gray-50 px-2 py-1 text-xs font-medium uppercase text-gray-600">
                    {tour.defaultLanguage}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                  {tour.estimatedMinutes == null ? '-' : `${tour.estimatedMinutes} min`}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-600">{tour.pois.length}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      tour.isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-gray-50 text-gray-600'
                    }`}
                  >
                    {tour.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                  {formatDate(tour.updatedAt)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      to={routes.tourEdit.replace(':tourId', String(tour.id))}
                      className="inline-flex items-center justify-center rounded-md bg-transparent px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                    >
                      Edit
                    </Link>
                    <Button
                      variant="ghost"
                      className="text-red-700 hover:bg-red-50"
                      isLoading={deletingTourId === tour.id}
                      onClick={() => onDelete(tour)}
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
