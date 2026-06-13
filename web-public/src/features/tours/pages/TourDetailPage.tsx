import { Link, useParams } from 'react-router-dom';
import { Alert } from '@/components/Alert';
import { ApiClientError } from '@/api/apiError';
import { selectTourTranslation } from '@/features/tours/api/toursApi';
import { usePublicTourQuery } from '@/features/tours/hooks/usePublicToursQuery';

export function TourDetailPage() {
  const id = Number(useParams().id);
  const tourQuery = usePublicTourQuery(id);
  const tour = tourQuery.data;
  const errorMessage = getErrorMessage(tourQuery.error);
  const translation = tour ? selectTourTranslation(tour) : null;

  return (
    <section className="space-y-5">
      {errorMessage ? <Alert variant="error" message={errorMessage} /> : null}
      {tourQuery.isLoading ? <Alert message="Loading tour..." /> : null}

      {tour ? (
        <>
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-sky-800">{tour.code}</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">
              {translation?.name ?? tour.code}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-700">
              {translation?.description ?? 'No description is available for this tour yet.'}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
              <span className="rounded-full bg-slate-100 px-3 py-1">
                {tour.estimatedMinutes ?? '-'} minutes
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1">
                {tour.defaultLanguage.toUpperCase()}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1">
                {tour.pois.length} stops
              </span>
            </div>
            <Link
              to={`/tours/${tour.id}/route`}
              className="mt-6 inline-flex rounded-md bg-sky-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-900"
            >
              View route
            </Link>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Available translations</h2>
            <div className="mt-3 grid gap-3">
              {tour.translations.map((item) => (
                <div key={item.id} className="rounded-md border border-slate-200 p-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {item.languageCode.toUpperCase()} - {item.name}
                  </p>
                  {item.description ? (
                    <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Tour stops</h2>
            <div className="mt-4 grid gap-3">
              {tour.pois.map((poi) => (
                <div key={poi.id} className="flex gap-3 rounded-md border border-slate-200 p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-900">
                    {poi.orderIndex}
                  </span>
                  <div>
                    <p className="font-medium text-slate-950">{poi.poiName ?? poi.poiCode}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {poi.poiShortDescription ?? poi.poiDescription ?? poi.poiCode}
                    </p>
                    <p className="mt-2 text-xs font-medium text-slate-500">
                      Audio {poi.hasAudio ? 'available' : 'not available yet'}
                    </p>
                  </div>
                </div>
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

  return 'Unable to load tour.';
}
