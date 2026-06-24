import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { publicAudioTourApi } from '../../api/publicAudioTourApi';
import { poisApi } from '../../api/poisApi';
import { Spinner } from '../../components/ui/Spinner';
import { ROUTES } from '../../routes/routeConstants';
import type { Lang } from '../../hooks/useLanguage';
import { useI18n } from '../../i18n/I18nContext';
import { ProtectedAudioPlayer } from '../audio/ProtectedAudioPlayer';
import { AccessCountdown } from '../access/AccessCountdown';
import { AccessExpiredPanel } from '../access/AccessExpiredPanel';
import { AccessRequiredPanel } from '../access/AccessRequiredPanel';
import { guestAccessStore, type GuestAccessRecord } from '../access/guestAccessStore';
import { getAudioTourErrorKind, getAudioTourErrorMessage } from '../../utils/audioTourErrors';

export function PoiDetailPage({ lang }: { lang: Lang }) {
  const { id } = useParams<{ id: string }>();
  const poiId = Number(id);
  const { t } = useI18n();
  const [accessRecord, setAccessRecord] = useState<GuestAccessRecord | null>(() => Number.isInteger(poiId) ? guestAccessStore.getForPoi(poiId) ?? guestAccessStore.getAnyActive() : null);
  const [clientExpired, setClientExpired] = useState(false);
  const [autoPlayBlocked, setAutoPlayBlocked] = useState(false);
  const { data: poi, isLoading, isError } = useQuery({ queryKey: ['poi', id, lang], queryFn: () => poisApi.getById(poiId, lang), enabled: !!id });
  const audioTourQuery = useQuery({
    queryKey: ['public-audio-tour', 'poi', poiId, lang, accessRecord?.accessToken],
    queryFn: () => publicAudioTourApi.getPoi(poiId, accessRecord!.accessToken, lang),
    enabled: Number.isInteger(poiId) && poiId > 0 && !!accessRecord?.accessToken && !clientExpired,
    retry: false,
  });
  const handleExpired = () => { if (accessRecord) guestAccessStore.remove(accessRecord.qrCode); setAccessRecord(null); setClientExpired(true); };
  if (isLoading) return <Spinner />;
  if (isError || !poi) return <div className="py-32 text-center text-gray-500"><p>{t('notFoundPlace')}</p><Link to={ROUTES.POIS} className="mt-4 inline-block text-emerald-400">{t('backToPlaces')}</Link></div>;
  const availableTracks = audioTourQuery.data?.audioTracks.filter((track) => track.isAvailable && track.languageCode.toLowerCase() === lang) ?? [];
  const heroImageUrl = poi.imageUrl ?? poi.imageUrls?.[0] ?? null;
  return <div className="mx-auto max-w-4xl px-4 py-12"><Link to={ROUTES.POIS} className="mb-6 inline-flex text-sm text-emerald-400">← {t('backToPlaces')}</Link>
    {heroImageUrl ? <div className="mb-8 h-72 overflow-hidden rounded-2xl sm:h-96"><img src={heroImageUrl} alt={poi.name} className="h-full w-full object-cover" /></div> : null}
    <div className="grid gap-8 lg:grid-cols-3"><div className="lg:col-span-2"><h1 className="text-3xl font-bold text-white">{poi.name}</h1>{poi.shortDescription ? <p className="mb-4 mt-3 text-lg text-emerald-300">{poi.shortDescription}</p> : null}<p className="whitespace-pre-line leading-relaxed text-gray-300">{poi.description || t('narrationUpdating')}</p><div className="mt-6 flex flex-wrap gap-3"><Link to={`${ROUTES.MAP}?lat=${poi.latitude}&lng=${poi.longitude}&poi=${poi.id}`} className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white">{t('viewMap')}</Link><Link to={accessRecord?.accessToken && !clientExpired ? '#audio' : ROUTES.PACKAGES} className="rounded-xl border border-gray-700 bg-gray-800 px-5 py-3 text-sm font-semibold text-white">{accessRecord?.accessToken && !clientExpired ? t('listen') : t('choosePass')}</Link></div></div>
      <div className="space-y-4"><div className="rounded-xl border border-gray-700 bg-gray-800 p-4"><h3 className="mb-2 text-sm font-semibold text-white">{t('location')}</h3><p className="text-xs text-gray-400">{poi.latitude.toFixed(6)}, {poi.longitude.toFixed(6)}</p></div>
        <div id="audio" className="rounded-xl border border-gray-700 bg-gray-800 p-4"><h3 className="mb-3 text-sm font-semibold text-white">{t('selectedLanguageAudio')}</h3>
          {clientExpired ? <AccessExpiredPanel /> : !accessRecord?.accessToken ? <AccessRequiredPanel title={t('accessRequired')} message={t('accessRequiredMessage')} /> : audioTourQuery.isLoading ? <Spinner /> : audioTourQuery.isError ? <div className="rounded-lg bg-gray-900 p-3 text-xs text-gray-400">{getAudioTourErrorMessage(getAudioTourErrorKind(audioTourQuery.error))}</div> : <div className="space-y-4"><AccessCountdown expiresAt={accessRecord.expiresAt} onExpired={handleExpired} />{audioTourQuery.data?.narrationText ? <p className="text-sm leading-relaxed text-gray-300">{audioTourQuery.data.narrationText}</p> : <p className="text-sm text-gray-400">{t('narrationUpdating')}</p>}{autoPlayBlocked ? <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-5 text-amber-100">Trình duyệt đã chặn tự động phát. Vui lòng bấm Play để nghe thuyết minh.</div> : null}<div className="space-y-3">{availableTracks.length ? availableTracks.map((track, index) => <ProtectedAudioPlayer key={track.audioTrackId ?? track.id} track={track} poiName={poi.name} accessToken={accessRecord.accessToken} autoPlay={index === 0} autoPlayKey={`${poi.id}:${track.audioTrackId ?? track.id}:${accessRecord.accessToken}`} onUnauthorized={handleExpired} onAutoPlayBlocked={() => setAutoPlayBlocked(true)} onAutoPlayStarted={() => setAutoPlayBlocked(false)} />) : <div className="rounded-lg bg-gray-900 p-3 text-xs text-gray-400">{t('audioUnavailable')}</div>}</div></div>}
        </div>
      </div>
    </div>
    <PoiImageSection title="Menu" urls={poi.menuImageUrls ?? []} altPrefix={poi.name} />
    <PoiImageSection title="Highlights" urls={poi.highlightImageUrls ?? []} altPrefix={poi.name} />
  </div>;
}

function PoiImageSection({ title, urls, altPrefix }: { title: string; urls: string[]; altPrefix: string }) {
  if (!urls.length) return null;

  return (
    <section className="mt-10 border-t border-gray-800 pt-6">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {urls.map((url, index) => (
          <div key={url} className="aspect-[4/3] overflow-hidden rounded-xl bg-gray-900">
            <img
              src={url}
              alt={`${altPrefix} - ${title} ${index + 1}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
