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

  const heroPoi = poisData?.items.find((poi) => poi.imageUrl) ?? poisData?.items[0];

  return (
    <div>
      <section className="relative overflow-hidden border-b border-gray-800">
        {heroPoi?.imageUrl ? (
          <img
            src={heroPoi.imageUrl}
            alt={heroPoi.name}
            className="absolute inset-0 h-full w-full object-cover opacity-35"
          />
        ) : null}
        <div className="absolute inset-0 bg-gray-950/75" />
        <div className="relative mx-auto grid min-h-[calc(100vh-64px)] max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_420px] lg:items-center">
          <div>
            <p className="mb-3 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-sm font-medium text-emerald-200">
              VinhHy AudioTour
            </p>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight text-white sm:text-6xl">
              Mở bản đồ, chọn điểm, nghe thuyết minh ngay tại Vĩnh Hy
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-300">
              Quét QR hoặc chọn gói nghe để mở quyền nghe. Sau đó bạn có thể đi theo bản đồ, chọn tour,
              hoặc mở từng địa điểm để phát audio bảo vệ.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to={ROUTES.PACKAGES}
                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                Quét QR / Nhập mã truy cập
              </Link>
              <Link
                to={ROUTES.MAP}
                className="rounded-xl border border-gray-700 bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
              >
                Xem bản đồ
              </Link>
              <Link
                to={ROUTES.TOURS}
                className="rounded-xl border border-gray-700 bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
              >
                Xem tour
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-700 bg-gray-900/90 p-5 shadow-2xl">
            <h2 className="text-lg font-semibold text-white">Bắt đầu trong 3 bước</h2>
            <div className="mt-4 space-y-3">
              {[
                ['1', 'Quét QR hoặc chọn gói nghe', 'Mở quyền nghe tạm thời cho POI hoặc toàn khu.'],
                ['2', 'Mở bản đồ hoặc chọn tour', 'Xem các điểm gần bạn và đi theo lộ trình gợi ý.'],
                ['3', 'Chọn POI và nghe audio', 'Audio chỉ phát khi mã nghe còn hiệu lực.'],
              ].map(([step, title, desc]) => (
                <div key={step} className="flex gap-3 rounded-xl border border-gray-800 bg-gray-950/70 p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                    {step}
                  </span>
                  <div>
                    <p className="font-semibold text-white">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-gray-400">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { value: poisData?.totalCount ?? '—', label: 'Địa điểm công khai' },
          { value: tours?.length ?? '—', label: 'Tour đang mở' },
          { value: 'QR', label: 'Mở quyền nghe' },
          { value: 'Audio', label: 'Phát qua endpoint bảo vệ' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <p className="text-2xl font-bold text-white">{String(item.value)}</p>
            <p className="mt-1 text-sm text-gray-400">{item.label}</p>
          </div>
        ))}
      </section>

      {poisData && poisData.items.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-8">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-white">Địa điểm gần hành trình</h2>
              <p className="mt-1 text-sm text-gray-400">Chọn một điểm để xem chi tiết, vị trí và trạng thái audio.</p>
            </div>
            <Link to={ROUTES.POIS} className="text-sm text-emerald-300 hover:text-emerald-200">
              Xem tất cả
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {poisData.items.slice(0, 6).map((poi) => (
              <PoiCard key={poi.id} poi={poi} />
            ))}
          </div>
        </section>
      ) : null}

      {tours && tours.length > 0 ? (
        <section className="border-y border-gray-800 bg-gray-900/50">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-white">Đi theo tour</h2>
                <p className="mt-1 text-sm text-gray-400">Mỗi tour có danh sách điểm dừng và audio theo từng POI.</p>
              </div>
              <Link to={ROUTES.TOURS} className="text-sm text-emerald-300 hover:text-emerald-200">
                Xem tour
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {tours.slice(0, 3).map((tour) => (
                <Link
                  key={tour.id}
                  to={ROUTES.TOUR_DETAIL.replace(':id', String(tour.id))}
                  className="rounded-xl border border-gray-800 bg-gray-950 p-5 transition-colors hover:border-emerald-500/60"
                >
                  <p className="text-sm font-medium text-emerald-300">Tour</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{tour.name}</h3>
                  {tour.estimatedMinutes ? (
                    <p className="mt-2 text-sm text-gray-400">Khoảng {tour.estimatedMinutes} phút</p>
                  ) : null}
                  {tour.description ? (
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-400">{tour.description}</p>
                  ) : null}
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
