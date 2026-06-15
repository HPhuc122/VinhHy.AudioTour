import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { qrApi } from '../../api/qrApi';
import { Spinner } from '../../components/ui/Spinner';
import { ROUTES } from '../../routes/routeConstants';
import type { Lang } from '../../hooks/useLanguage';

interface Props { lang: Lang; }

export function QrLandingPage({ lang }: Props) {
  const { code } = useParams<{ code: string }>();

  const { data: poi, isLoading, isError } = useQuery({
    queryKey: ['qr', code, lang],
    queryFn: () => qrApi.scan(code!, lang),
    enabled: !!code,
    retry: false,
  });

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Spinner />
        <p className="text-gray-400 mt-4 text-sm">Đang tải thông tin địa điểm...</p>
      </div>
    </div>
  );

  if (isError || !poi) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-xl font-bold text-white mb-2">Mã QR không hợp lệ</h1>
        <p className="text-gray-400 text-sm mb-6">Mã QR này đã hết hạn hoặc không tồn tại.</p>
        <Link to={ROUTES.HOME} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm transition-colors">
          Về trang chủ
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header badge */}
        <div className="text-center mb-6">
          <span className="inline-block bg-emerald-500/20 text-emerald-400 text-xs font-medium px-3 py-1 rounded-full border border-emerald-500/30">
            📱 Quét QR thành công
          </span>
        </div>

        {/* POI card */}
        <div className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 shadow-2xl">
          {poi.imageUrl ? (
            <img src={poi.imageUrl} alt={poi.name} className="w-full h-52 object-cover" />
          ) : (
            <div className="w-full h-52 bg-gradient-to-br from-emerald-900/50 to-gray-800 flex items-center justify-center text-7xl">
              📍
            </div>
          )}

          <div className="p-6">
            <h1 className="text-2xl font-bold text-white mb-2">{poi.name}</h1>

            {poi.shortDescription && (
              <p className="text-emerald-300 text-sm mb-4">{poi.shortDescription}</p>
            )}

            <p className="text-gray-400 text-sm leading-relaxed mb-6">{poi.description}</p>

            {/* Audio player */}
            {poi.audioUrl && (
              <div className="bg-gray-900 rounded-xl p-4 mb-5">
                <p className="text-xs text-gray-400 mb-2 font-medium">🎙️ Nghe thuyết minh</p>
                <audio
                  controls
                  src={poi.audioUrl}
                  className="w-full"
                  style={{ height: '36px' }}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Link
                to={ROUTES.POI_DETAIL.replace(':id', String(poi.poiId))}
                className="block text-center bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-sm font-medium transition-colors"
              >
                Xem thêm thông tin
              </Link>
              <Link
                to={`${ROUTES.MAP}?lat=${poi.latitude}&lng=${poi.longitude}&poi=${poi.poiId}`}
                className="block text-center bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl text-sm font-medium transition-colors"
              >
                🗾 Xem trên bản đồ
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link to={ROUTES.HOME} className="text-gray-500 hover:text-gray-300 text-xs transition-colors">
            Về trang chủ VinhHy AudioTour
          </Link>
        </div>
      </div>
    </div>
  );
}
