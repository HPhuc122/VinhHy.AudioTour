import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toursApi } from '../../api/toursApi';
import { Spinner } from '../../components/ui/Spinner';
import { ROUTES } from '../../routes/routeConstants';
import type { Lang } from '../../hooks/useLanguage';

interface Props { lang: Lang; }

export function ToursPage({ lang }: Props) {
  const { data: tours, isLoading, isError } = useQuery({
    queryKey: ['tours', lang],
    queryFn: () => toursApi.getAll(lang),
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Tour khám phá</h1>
        <p className="text-gray-400">Chọn tour phù hợp và bắt đầu hành trình của bạn</p>
      </div>

      {isLoading ? <Spinner /> : isError ? (
        <div className="text-center py-20 text-gray-500">Không thể tải danh sách tour</div>
      ) : !tours?.length ? (
        <div className="text-center py-20 text-gray-500">Chưa có tour nào</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tours.map((tour) => (
            <Link
              key={tour.id}
              to={ROUTES.TOUR_DETAIL.replace(':id', String(tour.id))}
              className="group bg-gray-800 border border-gray-700 hover:border-emerald-500/50 rounded-xl overflow-hidden transition-all hover:-translate-y-0.5"
            >
              {/* Tour header */}
              <div className="bg-gradient-to-br from-emerald-900/50 to-gray-800 p-8 flex items-center justify-center">
                <span className="text-6xl">🗺️</span>
              </div>

              <div className="p-5">
                <h3 className="font-bold text-white text-lg mb-2 group-hover:text-emerald-400 transition-colors">
                  {tour.name}
                </h3>

                <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                  {tour.estimatedMinutes && (
                    <span className="flex items-center gap-1">⏱ ~{tour.estimatedMinutes} phút</span>
                  )}
                  <span className="flex items-center gap-1">🌐 {tour.defaultLanguage.toUpperCase()}</span>
                </div>

                {tour.description && (
                  <p className="text-gray-400 text-sm line-clamp-3 leading-relaxed">{tour.description}</p>
                )}

                <div className="mt-4 text-emerald-500 text-sm flex items-center gap-1">
                  Xem chi tiết <span>→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
