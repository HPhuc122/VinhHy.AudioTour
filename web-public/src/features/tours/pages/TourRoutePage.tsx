import { Link, useParams } from 'react-router-dom';
import { Alert } from '@/components/Alert';
import { ApiClientError } from '@/api/apiError';
import { selectTourTranslation } from '@/features/tours/api/toursApi';
import { usePublicTourQuery } from '@/features/tours/hooks/usePublicToursQuery';

export function TourRoutePage() {
  const id = Number(useParams().id);
  const tourQuery = usePublicTourQuery(id);
  const tour = tourQuery.data;
  const errorMessage = getErrorMessage(tourQuery.error);
  const translation = tour ? selectTourTranslation(tour) : null;

  return (
    <section className="space-y-5">
      {errorMessage ? <Alert variant="error" message={errorMessage} /> : null}
      {tourQuery.isLoading ? <Alert message="Loading route..." /> : null}

      {tour ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-sky-800">{tour.code}</p>
              <h1 className="mt-1 text-3xl font-semibold text-slate-950">
                {translation?.name ?? tour.code} Route
              </h1>
            </div>
            <Link
              to={`/tours/${tour.id}`}
              className="inline-flex rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Back to detail
            </Link>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Ordered stops</h2>
            <div className="mt-4 grid gap-4">
              {tour.pois.map((poi, index) => (
                <article key={poi.id} className="rounded-md border border-slate-200 p-4">
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-800 text-sm font-semibold text-white">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-950">{poi.poiName ?? poi.poiCode}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {poi.poiDescription ?? poi.poiShortDescription ?? 'POI details coming soon.'}
                      </p>
                      <div className="mt-3 grid gap-2 text-xs font-medium text-slate-500 sm:grid-cols-2">
                        <span>Code: {poi.poiCode ?? '-'}</span>
                        <span>Category: {poi.category ?? '-'}</span>
                        <span>Latitude: {poi.latitude}</span>
                        <span>Longitude: {poi.longitude}</span>
                        <span>Audio: {poi.hasAudio ? 'Available' : 'Not available yet'}</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </>
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

  return 'Unable to load route.';
}
