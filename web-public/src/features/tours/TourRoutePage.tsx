import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { publicAudioTourApi } from '../../api/publicAudioTourApi';
import { Spinner } from '../../components/ui/Spinner';
import type { Lang } from '../../hooks/useLanguage';
import { ROUTES } from '../../routes/routeConstants';
import { ProtectedAudioPlayer } from '../audio/ProtectedAudioPlayer';
import { AccessCountdown } from '../access/AccessCountdown';
import { AccessExpiredPanel } from '../access/AccessExpiredPanel';
import { AccessRequiredPanel } from '../access/AccessRequiredPanel';
import { guestAccessStore, type GuestAccessRecord } from '../access/guestAccessStore';

interface Props {
  lang: Lang;
}

export function TourRoutePage({ lang }: Props) {
  const { id } = useParams<{ id: string }>();
  const tourId = Number(id);
  const [accessRecord, setAccessRecord] = useState<GuestAccessRecord | null>(() =>
    Number.isInteger(tourId) ? guestAccessStore.getForTour(tourId) ?? guestAccessStore.getAnyActive() : null,
  );
  const [clientExpired, setClientExpired] = useState(false);

  const audioTourQuery = useQuery({
    queryKey: ['public-audio-tour', 'tour', tourId, lang, accessRecord?.accessToken],
    queryFn: () => publicAudioTourApi.getTour(tourId, accessRecord!.accessToken, lang),
    enabled: Number.isInteger(tourId) && tourId > 0 && !!accessRecord?.accessToken && !clientExpired,
    retry: false,
  });

  const handleExpired = () => {
    if (accessRecord) {
      guestAccessStore.remove(accessRecord.qrCode);
    }
    setAccessRecord(null);
    setClientExpired(true);
  };

  if (!Number.isInteger(tourId) || tourId <= 0) {
    return (
      <div className="py-32 text-center text-gray-500">
        <p>Không tìm thấy lộ trình tour này.</p>
        <Link to={ROUTES.TOURS} className="mt-4 inline-block text-emerald-400">
          Quay lại danh sách tour
        </Link>
      </div>
    );
  }

  if (clientExpired) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24">
        <AccessExpiredPanel />
      </div>
    );
  }

  if (!accessRecord?.accessToken) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24">
        <AccessRequiredPanel
          title="Cần vé để mở lộ trình AudioTour"
          message="Lộ trình phát thuyết minh chỉ mở sau khi quét QR và nhận GuestAccessPass còn hiệu lực."
        />
      </div>
    );
  }

  if (audioTourQuery.isLoading) {
    return <Spinner />;
  }

  if (audioTourQuery.isError || !audioTourQuery.data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24">
        <AccessExpiredPanel message="GuestAccessPass không hợp lệ, đã hết hạn hoặc không thuộc tour này. Vui lòng quét lại mã QR phù hợp." />
      </div>
    );
  }

  const tour = audioTourQuery.data;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Link
        to={ROUTES.TOUR_DETAIL.replace(':id', String(tour.id))}
        className="mb-6 inline-flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300"
      >
        Quay lại chi tiết tour
      </Link>

      <div className="mb-4">
        <AccessCountdown expiresAt={accessRecord.expiresAt} onExpired={handleExpired} />
      </div>

      <div className="mb-8 rounded-2xl border border-gray-700 bg-gradient-to-br from-emerald-900/40 to-gray-800 p-8">
        <p className="mb-2 text-sm font-medium uppercase tracking-wide text-emerald-400">
          {tour.code}
        </p>
        <h1 className="text-3xl font-bold text-white">{tour.name}</h1>
        <p className="mt-3 text-gray-300">Lộ trình gồm {tour.pois.length} điểm dừng.</p>
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
                      {poi.narrationText || poi.shortDescription || 'Nội dung thuyết minh đang được cập nhật.'}
                    </p>
                    <div className="mt-3 grid gap-2 text-xs text-gray-500 sm:grid-cols-2">
                      <span>Mã: {poi.code}</span>
                      <span>Vĩ độ: {poi.latitude}</span>
                      <span>Kinh độ: {poi.longitude}</span>
                      <span>Audio: {poi.audioTracks.some((track) => track.isAvailable) ? `${poi.audioTracks.length} track` : 'Đang cập nhật'}</span>
                    </div>
                    {poi.audioTracks.some((track) => track.isAvailable) ? (
                      <div className="mt-4 space-y-3">
                        {poi.audioTracks
                          .filter((track) => track.isAvailable)
                          .map((track) => (
                            <ProtectedAudioPlayer
                              key={track.audioTrackId ?? track.id}
                              track={track}
                              accessToken={accessRecord.accessToken}
                              onUnauthorized={handleExpired}
                            />
                          ))}
                      </div>
                    ) : null}
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
