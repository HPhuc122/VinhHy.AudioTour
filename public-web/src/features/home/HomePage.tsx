import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { poisApi } from '../../api/poisApi';
import { toursApi } from '../../api/toursApi';
import { PoiCard } from '../../components/ui/PoiCard';
import { ROUTES } from '../../routes/routeConstants';
import type { Lang } from '../../hooks/useLanguage';

interface Props { lang: Lang; }

export function HomePage({ lang }: Props) {
  const { data: poisData } = useQuery({
    queryKey: ['pois', lang, 1, 6],
    queryFn: () => poisApi.getAll(1, 6, lang),
  });

  const { data: tours } = useQuery({
    queryKey: ['tours', lang],
    queryFn: () => toursApi.getAll(lang),
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[90vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-emerald-900/30 to-gray-900" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative text-center px-4 max-w-3xl mx-auto">
          <span className="inline-block bg-emerald-500/20 text-emerald-400 text-xs font-medium px-3 py-1 rounded-full mb-4 border border-emerald-500/30">
            🎧 Audio Tour Thông Minh
          </span>
          <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6 leading-tight">
            Khám phá<br />
            <span className="text-emerald-400">Phố Ẩm Thực Vĩnh Hy</span>
          </h1>
          <p className="text-gray-300 text-lg mb-8 leading-relaxed">
            Trải nghiệm hướng dẫn viên ảo đa ngôn ngữ — tự động thuyết minh khi bạn đến gần mỗi địa điểm
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to={ROUTES.TOURS}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-3 rounded-xl transition-colors"
            >
              Bắt đầu tour ngay
            </Link>
            <Link
              to={ROUTES.MAP}
              className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-6 py-3 rounded-xl border border-gray-700 transition-colors"
            >
              Xem bản đồ
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-500 animate-bounce text-xs flex flex-col items-center gap-1">
          <span>Cuộn xuống</span>
          <span>↓</span>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gray-800/50 border-y border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: poisData?.totalCount ?? '—', label: 'Địa điểm', icon: '📍' },
            { value: tours?.length ?? '—', label: 'Tour', icon: '🗺️' },
            { value: '6', label: 'Ngôn ngữ', icon: '🌐' },
            { value: '24/7', label: 'Hoạt động', icon: '⏰' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold text-emerald-400">{String(s.value)}</div>
              <div className="text-gray-400 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-white text-center mb-10">Tính năng nổi bật</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: '🎙️', title: 'Thuyết minh tự động', desc: 'GPS tự nhận diện vị trí và phát audio thuyết minh ngay khi bạn đến gần địa điểm' },
            { icon: '📱', title: 'Quét mã QR', desc: 'Quét QR tại mỗi địa điểm để nghe thuyết minh ngay lập tức, không cần kết nối internet' },
            { icon: '🌐', title: 'Đa ngôn ngữ', desc: 'Hỗ trợ 6 ngôn ngữ: Tiếng Việt, English, 中文, 한국어, 日本語, Français' },
          ].map((f) => (
            <div key={f.title} className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 text-center">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* POIs */}
      {poisData && poisData.items.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-8 pb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">Địa điểm nổi bật</h2>
            <Link to={ROUTES.POIS} className="text-emerald-400 hover:text-emerald-300 text-sm transition-colors">
              Xem tất cả →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {poisData.items.map((poi) => (
              <PoiCard key={poi.id} poi={poi} />
            ))}
          </div>
        </section>
      )}

      {/* Tours */}
      {tours && tours.length > 0 && (
        <section className="bg-gray-800/30 border-y border-gray-800">
          <div className="max-w-6xl mx-auto px-4 py-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white">Tour khám phá</h2>
              <Link to={ROUTES.TOURS} className="text-emerald-400 hover:text-emerald-300 text-sm transition-colors">
                Xem tất cả →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {tours.slice(0, 3).map((tour) => (
                <Link
                  key={tour.id}
                  to={ROUTES.TOUR_DETAIL.replace(':id', String(tour.id))}
                  className="bg-gray-800 border border-gray-700 hover:border-emerald-500/50 rounded-xl p-5 transition-all hover:-translate-y-0.5 group"
                >
                  <div className="text-3xl mb-3">🗺️</div>
                  <h3 className="font-semibold text-white mb-1 group-hover:text-emerald-400 transition-colors">
                    {tour.name}
                  </h3>
                  {tour.estimatedMinutes && (
                    <p className="text-gray-400 text-xs mb-2">⏱ ~{tour.estimatedMinutes} phút</p>
                  )}
                  {tour.description && (
                    <p className="text-gray-400 text-sm line-clamp-2">{tour.description}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Sẵn sàng khám phá?</h2>
        <p className="text-gray-400 mb-8">Tải app VinhHy AudioTour và bắt đầu hành trình của bạn</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link to={ROUTES.MAP} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-medium transition-colors">
            Xem bản đồ
          </Link>
          <Link to={ROUTES.POIS} className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-xl font-medium border border-gray-700 transition-colors">
            Khám phá địa điểm
          </Link>
        </div>
      </section>
    </div>
  );
}
