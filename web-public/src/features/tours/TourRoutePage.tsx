import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { publicAudioTourApi } from '../../api/publicAudioTourApi';
import { toursApi } from '../../api/toursApi';
import { Spinner } from '../../components/ui/Spinner';
import type { Lang } from '../../hooks/useLanguage';
import { ROUTES } from '../../routes/routeConstants';
import { ProtectedAudioPlayer } from '../audio/ProtectedAudioPlayer';
import { AccessCountdown } from '../access/AccessCountdown';
import { AccessExpiredPanel } from '../access/AccessExpiredPanel';
import { AccessRequiredPanel } from '../access/AccessRequiredPanel';
import { guestAccessStore, type GuestAccessRecord } from '../access/guestAccessStore';
import { getAudioTourErrorKind, getAudioTourErrorMessage } from '../../utils/audioTourErrors';

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
  const [selectedStopIndex, setSelectedStopIndex] = useState(0);

  const publicTourQuery = useQuery({
    queryKey: ['tour-route-public', tourId, lang],
    queryFn: () => toursApi.getById(tourId, lang),
    enabled: Number.isInteger(tourId) && tourId > 0,
  });

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

  if (publicTourQuery.isLoading) {
    return <Spinner />;
  }

  if (publicTourQuery.isError || !publicTourQuery.data) {
    return (
      <div className="py-32 text-center text-gray-500">
        <p>Không tìm thấy lộ trình tour này.</p>
        <Link to={ROUTES.TOURS} className="mt-4 inline-block text-emerald-400">
          Quay lại danh sách tour
        </Link>
      </div>
    );
  }

  const publicTour = publicTourQuery.data;
  const unlockedTour = audioTourQuery.data;
  const hasAudioAccess = Boolean(accessRecord?.accessToken) && !clientExpired;
  const audioErrorKind = audioTourQuery.isError
    ? getAudioTourErrorKind(audioTourQuery.error)
    : null;
  const stops = unlockedTour?.pois ?? publicTour.pois.map((poi, index) => ({
    id: poi.id,
    code: poi.code,
    name: poi.name,
    shortDescription: poi.shortDescription,
    narrationText: null,
    latitude: poi.latitude,
    longitude: poi.longitude,
    imageUrl: poi.imageUrl,
    category: poi.category,
    orderIndex: index + 1,
    audioTracks: [],
  }));
  const selectedStop = stops[Math.min(selectedStopIndex, Math.max(stops.length - 1, 0))] ?? stops[0];

  if (hasAudioAccess && audioTourQuery.isLoading) {
    return <Spinner />;
  }

  if (hasAudioAccess && audioTourQuery.isError && audioErrorKind !== 'unauthorized') {
    const errorKind = audioTourQuery.isError
      ? getAudioTourErrorKind(audioTourQuery.error)
      : 'notfound';

    return (
      <div className="mx-auto max-w-xl px-4 py-24">
        {errorKind === 'unauthorized' ? (
          <AccessExpiredPanel />
        ) : (
          <div className="rounded-2xl border border-gray-700 bg-gray-800 p-6 text-center">
            <p className="text-sm leading-relaxed text-gray-300">
              {getAudioTourErrorMessage(errorKind)}
            </p>
          </div>
        )}
      </div>
    );
  }

  const tourName = unlockedTour?.name ?? publicTour.name;
  const tourDescription = unlockedTour?.description ?? publicTour.description;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link
        to={ROUTES.TOUR_DETAIL.replace(':id', String(publicTour.id))}
        className="mb-6 inline-flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300"
      >
        Quay lại chi tiết tour
      </Link>

      {hasAudioAccess && accessRecord ? (
        <div className="mb-4">
          <AccessCountdown expiresAt={accessRecord.expiresAt} onExpired={handleExpired} />
        </div>
      ) : null}

      <div className="mb-8 rounded-2xl border border-gray-700 bg-gray-900 p-6">
        <p className="mb-2 text-sm font-medium uppercase tracking-wide text-emerald-400">
          {unlockedTour?.code ?? publicTour.code}
        </p>
        <h1 className="text-3xl font-bold text-white">{tourName}</h1>
        {tourDescription ? <p className="mt-3 max-w-3xl text-gray-300">{tourDescription}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-300">
          <span className="rounded-full bg-gray-800 px-3 py-1">{stops.length} điểm dừng</span>
          {publicTour.estimatedMinutes ? (
            <span className="rounded-full bg-gray-800 px-3 py-1">Khoảng {publicTour.estimatedMinutes} phút</span>
          ) : null}
          <span className={`rounded-full px-3 py-1 ${hasAudioAccess ? 'bg-emerald-500/15 text-emerald-200' : 'bg-amber-500/15 text-amber-200'}`}>
            {hasAudioAccess ? 'Đã mở quyền nghe' : 'Cần gói nghe / QR để phát audio'}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="relative">
          <div className="absolute bottom-6 left-5 top-6 w-0.5 bg-emerald-800" />
          <div className="space-y-4">
            {stops.map((poi, index) => {
              const selected = selectedStop?.id === poi.id;
              return (
            <button
              key={`${poi.id}-${index}`}
              type="button"
              onClick={() => setSelectedStopIndex(index)}
              className={`relative flex w-full gap-4 text-left ${selected ? '' : ''}`}
            >
              <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-gray-950 bg-emerald-600 text-sm font-bold text-white">
                {index + 1}
              </div>
              <div className={`flex-1 rounded-xl border p-4 transition-colors ${
                selected ? 'border-emerald-500 bg-gray-800' : 'border-gray-700 bg-gray-900 hover:border-gray-600'
              }`}>
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
                      <span>Tọa độ: {poi.latitude.toFixed(5)}, {poi.longitude.toFixed(5)}</span>
                      <span>Audio: {poi.audioTracks.some((track) => track.isAvailable) ? 'Có thể nghe' : hasAudioAccess ? 'Chưa có audio' : 'Cần mở quyền nghe'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </button>
              );
            })}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-gray-700 bg-gray-900 p-4">
            <p className="text-sm font-medium text-emerald-300">Điểm đang chọn</p>
            <h2 className="mt-2 text-xl font-bold text-white">{selectedStop?.name}</h2>
            {selectedStop?.shortDescription ? (
              <p className="mt-2 text-sm leading-6 text-gray-400">{selectedStop.shortDescription}</p>
            ) : null}
            <div className="mt-4 grid gap-2">
              <Link
                to={selectedStop ? ROUTES.POI_DETAIL.replace(':id', String(selectedStop.id)) : ROUTES.POIS}
                className="rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Xem chi tiết điểm này
              </Link>
              <Link
                to={`${ROUTES.MAP}?tour=${publicTour.id}&lat=${selectedStop?.latitude ?? ''}&lng=${selectedStop?.longitude ?? ''}&poi=${selectedStop?.id ?? ''}`}
                className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-center text-sm font-semibold text-gray-100 hover:bg-gray-700"
              >
                Mở trên bản đồ
              </Link>
            </div>

            <div className="mt-5">
              <h3 className="mb-3 text-sm font-semibold text-white">Audio của điểm này</h3>
              {clientExpired || audioErrorKind === 'unauthorized' ? (
                <AccessExpiredPanel />
              ) : !hasAudioAccess ? (
                <AccessRequiredPanel
                  title="Cần mã nghe để phát tour"
                  message="Bạn vẫn có thể xem lộ trình. Hãy quét QR hoặc chọn gói thuyết minh để nghe audio."
                />
              ) : selectedStop?.audioTracks.some((track) => track.isAvailable) ? (
                <div className="space-y-3">
                  {selectedStop.audioTracks
                    .filter((track) => track.isAvailable)
                    .map((track) => (
                      <ProtectedAudioPlayer
                        key={track.audioTrackId ?? track.id}
                        track={track}
                        poiName={selectedStop.name}
                        accessToken={accessRecord!.accessToken}
                        onUnauthorized={handleExpired}
                      />
                    ))}
                </div>
              ) : (
                <div className="rounded-xl border border-gray-800 bg-gray-950 p-4 text-sm text-gray-400">
                  Điểm này chưa có bản thuyết minh.
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
