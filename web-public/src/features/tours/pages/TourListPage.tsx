import { useState } from 'react';
import { Alert } from '@/components/Alert';
import { ApiClientError } from '@/api/apiError';
import { TourCard } from '@/features/tours/components/TourCard';
import { usePublicToursQuery } from '@/features/tours/hooks/usePublicToursQuery';

export function TourListPage() {
  const [search, setSearch] = useState('');
  const toursQuery = usePublicToursQuery({ page: 1, pageSize: 50, search: search.trim() });
  const errorMessage = getErrorMessage(toursQuery.error);
  const tours = toursQuery.data?.items ?? [];

  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-950">Explore Vinh Hy Tours</h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-600">
          Choose an active audio route, review its stops, and follow the ordered tour sequence.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <label htmlFor="tour-search" className="text-sm font-medium text-slate-700">
          Search tours
        </label>
        <input
          id="tour-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by tour code, name, or description"
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-700 focus:ring-2 focus:ring-sky-100"
        />
      </div>

      {errorMessage ? <Alert variant="error" message={errorMessage} /> : null}

      {toursQuery.isLoading ? <Alert message="Loading tours..." /> : null}

      {!toursQuery.isLoading && tours.length === 0 ? (
        <Alert message="No active tours found." />
      ) : null}

      <div className="grid gap-4">
        {tours.map((tour) => (
          <TourCard key={tour.id} tour={tour} />
        ))}
      </div>
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
