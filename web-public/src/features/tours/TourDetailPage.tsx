import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { toursApi } from '../../api/toursApi';
import { Spinner } from '../../components/ui/Spinner';
import { ROUTES } from '../../routes/routeConstants';
import type { Lang } from '../../hooks/useLanguage';

interface Props { lang: Lang; }

export function TourDetailPage({ lang }: Props) {
  const { id } = useParams<{ id: string }>();

  const { data: tour, isLoading, isError } = useQuery({
    queryKey: ['tour', id, lang],
    queryFn: () => toursApi.getById(Number(id), lang),
    enabled: !!id,
  });

  if (isLoading) return <Spinner />;
  if (isError || !tour) return (
    <div className="text-center py-32 text-gray-500">
      <div className="text-5xl mb-4">😕</div>
      <p>Không tìm thấy tour này</p>
      <Link to={ROUTES.TOURS} className="text-emerald-400 mt-4 inline-block">← Quay lại</Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link to={ROUTES.TOURS} className="text-emerald-400 hover:text-emerald-300 text-sm mb-6 inline-flex items-center gap-1">
        ← Tất cả tour
      </Link>

      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-900/40 to-gray-800 rounded-2xl p-8 mb-8 border border-gray-700">
        <div className="text-5xl mb-4">🗺️</div>
        <h1 className="text-3xl font-bold text-white mb-3">{tour.name}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-300">
          {tour.estimatedMinutes && (
            <span className="flex items-center gap-1.5 bg-gray-800/60 px-3 py-1 rounded-full">
              ⏱ ~{tour.estimatedMinutes} phút
            </span>
          )}
          <span className="flex items-center gap-1.5 bg-gray-800/60 px-3 py-1 rounded-full">
            📍 {tour.pois?.length ?? 0} địa điểm
          </span>
          <span className="flex items-center gap-1.5 bg-gray-800/60 px-3 py-1 rounded-full">
            🌐 {tour.defaultLanguage.toUpperCase()}
          </span>
        </div>
        {tour.description && (
          <p className="text-gray-300 mt-4 leading-relaxed">{tour.description}</p>
        )}
      </div>

      {/* POI Route */}
      {tour.pois && tour.pois.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-6">Lộ trình tour</h2>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-emerald-800" />

            <div className="space-y-4">
              {tour.pois.map((poi, index) => (
                <div key={poi.id} className="flex gap-4 relative">
                  {/* Step number */}
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white text-sm font-bold flex items-center justify-center shrink-0 z-10 border-2 border-gray-900">
                    {index + 1}
                  </div>

                  {/* POI card */}
                  <Link
                    to={ROUTES.POI_DETAIL.replace(':id', String(poi.id))}
                    className="flex-1 bg-gray-800 border border-gray-700 hover:border-emerald-500/50 rounded-xl p-4 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      {poi.imageUrl ? (
                        <img src={poi.imageUrl} alt={poi.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-700 flex items-center justify-center text-2xl shrink-0">📍</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-sm group-hover:text-emerald-400 transition-colors">
                          {poi.name}
                        </h3>
                        {poi.category && (
                          <span className="text-xs text-emerald-500">{poi.category}</span>
                        )}
                        {poi.shortDescription && (
                          <p className="text-gray-400 text-xs mt-1 line-clamp-2">{poi.shortDescription}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* View on map */}
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link
              to={ROUTES.TOUR_ROUTE.replace(':id', String(tour.id))}
              className="block text-center bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-medium transition-colors"
            >
              Xem lộ trình từng bước
            </Link>
            <Link
              to={`${ROUTES.MAP}?tour=${tour.id}`}
              className="block text-center bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-medium border border-gray-700 transition-colors"
            >
              🗾 Xem lộ trình trên bản đồ
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
