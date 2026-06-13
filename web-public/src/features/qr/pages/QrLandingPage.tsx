import { Link, useParams } from 'react-router-dom';
import { Alert } from '@/components/Alert';
import { ApiClientError } from '@/api/apiError';
import { selectTourTranslation } from '@/features/tours/api/toursApi';
import { useQrResolveQuery } from '@/features/qr/hooks/useQrResolveQuery';

export function QrLandingPage() {
  const code = useParams().code ?? '';
  const qrQuery = useQrResolveQuery(code);
  const result = qrQuery.data;
  const errorMessage = getErrorMessage(qrQuery.error);
  const tourTranslation = result?.tour ? selectTourTranslation(result.tour) : null;

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-medium text-sky-800">QR Landing</p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-950">{code}</h1>
      </div>

      {qrQuery.isLoading ? <Alert message="Resolving QR code..." /> : null}
      {errorMessage ? <Alert variant="error" message={errorMessage} /> : null}

      {result?.tour ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Tour</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            {tourTranslation?.name ?? result.tour.code}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            {tourTranslation?.description ?? 'Open this tour to view details and route order.'}
          </p>
          <Link
            to={`/tours/${result.tour.id}`}
            className="mt-5 inline-flex rounded-md bg-sky-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-900"
          >
            Open tour
          </Link>
        </div>
      ) : null}

      {result?.poi ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Point of interest</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            {result.poi.displayName ?? result.poi.code}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            POI details coming soon.
          </p>
          <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            <span>Code: {result.poi.code}</span>
            <span>Category: {result.poi.category ?? '-'}</span>
            <span>Latitude: {result.poi.latitude}</span>
            <span>Longitude: {result.poi.longitude}</span>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function getErrorMessage(error: unknown): string | null {
  if (!error) {
    return null;
  }

  if (error instanceof ApiClientError) {
    if (error.status === 404) {
      return 'This QR code is not active or could not be found.';
    }

    return error.message;
  }

  return 'Unable to resolve this QR code.';
}
