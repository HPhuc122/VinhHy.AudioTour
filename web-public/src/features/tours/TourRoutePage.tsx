import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { toursApi } from '../../api/toursApi';
import { Spinner } from '../../components/ui/Spinner';
import type { Lang } from '../../hooks/useLanguage';
import { ROUTES } from '../../routes/routeConstants';

interface Props {
  lang: Lang;
}

export function TourRoutePage({ lang }: Props) {
  const { id } = useParams<{ id: string }>();

  const { data: tour, isLoading, isError } = useQuery({
    queryKey: ['tour-route', id, lang],
    queryFn: () => toursApi.getById(Number(id), lang),
    enabled: !!id,
  });

  if (isLoading) return <Spinner />;

  if (isError || !tour) {
    return (
      <div className="py-32 text-center text-gray-500">
        <div className="mb-4 text-5xl">?</div>
        <p>Khong tim thay lo trinh tour nay</p>
        <Link to={ROUTES.TOURS} className="mt-4 inline-block text-emerald-400">
          Back to tours
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Link
        to={ROUTES.TOUR_DETAIL.replace(':id', String(tour.id))}
        className="mb-6 inline-flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300"
      >
        Back to tour detail
      </Link>

      <div className="mb-8 rounded-2xl border border-gray-700 bg-gradient-to-br from-emerald-900/40 to-gray-800 p-8">
        <p className="mb-2 text-sm font-medium uppercase tracking-wide text-emerald-400">
          {tour.code}
        </p>
        <h1 className="text-3xl font-bold text-white">{tour.name}</h1>
        <p className="mt-3 text-gray-300">Route includes {tour.pois.length} stops.</p>
      </div>

      <div className="relative">
        <div className="absolute bottom-6 left-5 top-6 w-0.5 bg-emerald-800" />
        <div className="space-y-4">
          {tour.pois.map((poi, index) => (
            <div key={`${poi.id}-${index}`} className="relative flex gap-4">
              <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-gray-950 bg-emerald-600 text-sm font-bold text-white">
                {index + 1}
              </div>
              <div className="flex-1 rounded-xl border border-gray-700 bg-gray-800 p-4">
                <div className="flex items-start gap-3">
                  {poi.imageUrl ? (
                    <img
                      src={poi.imageUrl}
                      alt={poi.name}
                      className="h-16 w-16 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-700 text-2xl">
                      P
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-white">{poi.name}</h2>
                    {poi.category ? (
                      <p className="mt-1 text-xs text-emerald-500">{poi.category}</p>
                    ) : null}
                    <p className="mt-2 text-sm leading-relaxed text-gray-400">
                      {poi.description || poi.shortDescription || 'Stop details are being updated.'}
                    </p>
                    <div className="mt-3 grid gap-2 text-xs text-gray-500 sm:grid-cols-2">
                      <span>Code: {poi.code}</span>
                      <span>Latitude: {poi.latitude}</span>
                      <span>Longitude: {poi.longitude}</span>
                      <span>Audio: {poi.audioUrl ? 'Available' : 'Coming soon'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
