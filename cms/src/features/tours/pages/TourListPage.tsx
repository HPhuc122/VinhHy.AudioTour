import { Link } from 'react-router-dom';
import { ApiClientError } from '@/api/apiError';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { routes } from '@/config/routes';
import type { TourDto } from '@/features/tours/api/tourApi';
import { TourTable } from '@/features/tours/components/TourTable';
import { useDeleteTourMutation } from '@/features/tours/hooks/useDeleteTourMutation';
import { useToursQuery } from '@/features/tours/hooks/useToursQuery';

export function TourListPage() {
  const toursQuery = useToursQuery({ page: 1, pageSize: 100 });
  const deleteTourMutation = useDeleteTourMutation();
  const deletingTourId =
    typeof deleteTourMutation.variables === 'number' ? deleteTourMutation.variables : null;

  const handleDelete = (tour: TourDto) => {
    const confirmed = window.confirm(`Delete tour ${tour.code}?`);
    if (!confirmed) {
      return;
    }

    deleteTourMutation.mutate(tour.id);
  };

  const queryError = getErrorMessage(toursQuery.error);
  const deleteError = getErrorMessage(deleteTourMutation.error);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Tours</h1>
          <p className="mt-1 text-sm text-slate-600">Manage CMS tour records.</p>
        </div>
        <Link
          to={routes.tourCreate}
          className="inline-flex items-center justify-center rounded-lg bg-sky-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-900"
        >
          Create tour
        </Link>
      </div>

      {queryError ? <Alert variant="error" message={queryError} /> : null}
      {deleteError ? <Alert variant="error" message={deleteError} /> : null}

      {toursQuery.isLoading ? <Spinner label="Loading tours..." /> : null}

      {toursQuery.data ? (
        <TourTable
          tours={toursQuery.data.items}
          deletingTourId={deletingTourId}
          onDelete={handleDelete}
        />
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

  return 'Unable to load tours.';
}
