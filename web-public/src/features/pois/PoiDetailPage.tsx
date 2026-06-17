import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { publicAudioTourApi } from '../../api/publicAudioTourApi';
import { poisApi } from '../../api/poisApi';
import { Spinner } from '../../components/ui/Spinner';
import { ROUTES } from '../../routes/routeConstants';
import type { Lang } from '../../hooks/useLanguage';
import { AccessCountdown } from '../access/AccessCountdown';
import { AccessExpiredPanel } from '../access/AccessExpiredPanel';
import { AccessRequiredPanel } from '../access/AccessRequiredPanel';
import { guestAccessStore, type GuestAccessRecord } from '../access/guestAccessStore';

interface Props { lang: Lang; }

export function PoiDetailPage({ lang }: Props) {
  const { id } = useParams<{ id: string }>();
  const poiId = Number(id);
  const [accessRecord, setAccessRecord] = useState<GuestAccessRecord | null>(() =>
    Number.isInteger(poiId) ? guestAccessStore.getForPoi(poiId) ?? guestAccessStore.getAnyActive() : null,
  );
  const [clientExpired, setClientExpired] = useState(false);

  const { data: poi, isLoading, isError } = useQuery({
    queryKey: ['poi', id, lang],
    queryFn: () => poisApi.getById(Number(id), lang),
    enabled: !!id,
  });

  const audioTourQuery = useQuery({
    queryKey: ['public-audio-tour', 'poi', poiId, lang, accessRecord?.accessToken],
    queryFn: () => publicAudioTourApi.getPoi(poiId, accessRecord!.accessToken, lang),
    enabled: Number.isInteger(poiId) && poiId > 0 && !!accessRecord?.accessToken && !clientExpired,
    retry: false,
  });

  const handleExpired = () => {
    if (accessRecord) {
      guestAccessStore.remove(accessRecord.qrCode);
    }
    setAccessRecord(null);
    setClientExpired(true);
  };

  if (isLoading) return <Spinner />;
  if (isError || !poi) return (
    <div className="text-center py-32 text-gray-500">
      <div className="text-5xl mb-4">!</div>
      <p>Không tìm thấy địa điểm này</p>
      <Link to={ROUTES.POIS} className="text-emerald-400 hover:text-emerald-300 mt-4 inline-block">Quay lại danh sách</Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link to={ROUTES.POIS} className="text-emerald-400 hover:text-emerald-300 text-sm mb-6 inline-flex items-center gap-1 transition-colors">
        Tất cả địa điểm
      </Link>

      {poi.imageUrl ? (
        <div className="rounded-2xl overflow-hidden mb-8 h-72 sm:h-96">
          <img src={poi.imageUrl} alt={poi.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="rounded-2xl bg-gray-800 h-48 flex items-center justify-center text-6xl mb-8">P</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-1">
              {poi.category && (
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 mb-2 inline-block">
                  {poi.category}
                </span>
              )}
              <h1 className="text-3xl font-bold text-white">{poi.name}</h1>
            </div>
          </div>

          {poi.shortDescription && (
            <p className="text-emerald-300 text-lg mb-4 leading-relaxed">{poi.shortDescription}</p>
          )}

          <div className="prose prose-invert prose-sm max-w-none">
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">{poi.description}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h3 className="text-white font-semibold mb-3 text-sm">Vị trí</h3>
            <div className="bg-gray-900 rounded-lg h-40 flex items-center justify-center text-gray-600 text-sm mb-3">
              <div className="text-center">
                <div className="text-2xl mb-2">Map</div>
                <p>
                  {poi.latitude.toFixed(6)}, {poi.longitude.toFixed(6)}
                </p>
              </div>
            </div>
            <Link
              to={`${ROUTES.MAP}?lat=${poi.latitude}&lng=${poi.longitude}&poi=${poi.id}`}
              className="block text-center bg-emerald-600 hover:bg-emerald-700 text-white text-sm py-2 rounded-lg transition-colors"
            >
              Xem trên bản đồ
            </Link>
          </div>

          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h3 className="text-white font-semibold mb-3 text-sm">Nghe thuyết minh</h3>
            {clientExpired ? (
              <AccessExpiredPanel />
            ) : !accessRecord?.accessToken ? (
              <AccessRequiredPanel
                title="Cần vé để nghe thuyết minh"
                message="Quét mã QR tại địa điểm để thanh toán mô phỏng và mở khóa phần thuyết minh."
              />
            ) : audioTourQuery.isLoading ? (
              <Spinner />
            ) : audioTourQuery.isError || !audioTourQuery.data ? (
              <AccessExpiredPanel message="GuestAccessPass không hợp lệ, đã hết hạn hoặc không thuộc địa điểm này." />
            ) : (
              <div className="space-y-4">
                <AccessCountdown expiresAt={accessRecord.expiresAt} onExpired={handleExpired} />
                {audioTourQuery.data.narrationText ? (
                  <p className="text-sm leading-relaxed text-gray-300">
                    {audioTourQuery.data.narrationText}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">Nội dung thuyết minh đang được cập nhật.</p>
                )}
                <div className="rounded-lg bg-gray-900 p-3 text-xs text-gray-400">
                  Audio metadata:{' '}
                  {audioTourQuery.data.audioTracks.some((track) => track.isAvailable)
                    ? `${audioTourQuery.data.audioTracks.length} track`
                    : 'đang cập nhật'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
