import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { qrApi } from '../../api/qrApi';
import { Spinner } from '../../components/ui/Spinner';
import { ROUTES } from '../../routes/routeConstants';
import type { Lang } from '../../hooks/useLanguage';

interface Props {
  lang: Lang;
}

export function QrLandingPage({ lang }: Props) {
  const { code } = useParams<{ code: string }>();

  const { data: result, isLoading, isError } = useQuery({
    queryKey: ['qr', code, lang],
    queryFn: () => qrApi.scan(code!, lang),
    enabled: !!code,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Spinner />
          <p className="mt-4 text-sm text-gray-400">Loading QR details...</p>
        </div>
      </div>
    );
  }

  if (isError || !result) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <div className="mb-4 text-6xl">!</div>
          <h1 className="mb-2 text-xl font-bold text-white">Invalid QR code</h1>
          <p className="mb-6 text-sm text-gray-400">This QR code is inactive or does not exist.</p>
          <Link
            to={ROUTES.HOME}
            className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm text-white transition-colors hover:bg-emerald-700"
          >
            Home
          </Link>
        </div>
      </div>
    );
  }

  const poi = result.poi;
  const tour = result.tour;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="inline-block rounded-full border border-emerald-500/30 bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
            QR resolved
          </span>
        </div>

        {tour ? (
          <div className="overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 shadow-2xl">
            <div className="flex h-52 items-center justify-center bg-gradient-to-br from-emerald-900/50 to-gray-800 text-7xl">
              T
            </div>
            <div className="p-6">
              <p className="mb-2 text-sm font-medium text-emerald-300">Tour</p>
              <h1 className="mb-2 text-2xl font-bold text-white">{tour.name}</h1>
              {tour.description ? (
                <p className="mb-6 text-sm leading-relaxed text-gray-400">{tour.description}</p>
              ) : null}
              <div className="flex flex-col gap-2">
                <Link
                  to={ROUTES.TOUR_DETAIL.replace(':id', String(tour.id))}
                  className="block rounded-xl bg-emerald-600 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  View tour details
                </Link>
                <Link
                  to={ROUTES.TOUR_ROUTE.replace(':id', String(tour.id))}
                  className="block rounded-xl bg-gray-700 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-gray-600"
                >
                  View route
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        {poi ? (
          <div className="overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 shadow-2xl">
            {poi.imageUrl ? (
              <img src={poi.imageUrl} alt={poi.name} className="h-52 w-full object-cover" />
            ) : (
              <div className="flex h-52 items-center justify-center bg-gradient-to-br from-emerald-900/50 to-gray-800 text-7xl">
                P
              </div>
            )}
            <div className="p-6">
              <h1 className="mb-2 text-2xl font-bold text-white">{poi.name}</h1>
              {poi.shortDescription ? (
                <p className="mb-4 text-sm text-emerald-300">{poi.shortDescription}</p>
              ) : null}
              {poi.description ? (
                <p className="mb-6 text-sm leading-relaxed text-gray-400">{poi.description}</p>
              ) : null}
              {poi.audioUrl ? (
                <div className="mb-5 rounded-xl bg-gray-900 p-4">
                  <p className="mb-2 text-xs font-medium text-gray-400">Audio narration</p>
                  <audio controls src={poi.audioUrl} className="w-full" style={{ height: '36px' }} />
                </div>
              ) : null}
              <Link
                to={ROUTES.POI_DETAIL.replace(':id', String(poi.poiId))}
                className="block rounded-xl bg-emerald-600 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-emerald-700"
              >
                View POI details
              </Link>
            </div>
          </div>
        ) : null}

        <div className="mt-6 text-center">
          <Link to={ROUTES.HOME} className="text-xs text-gray-500 transition-colors hover:text-gray-300">
            Back to VinhHy AudioTour
          </Link>
        </div>
      </div>
    </div>
  );
}
