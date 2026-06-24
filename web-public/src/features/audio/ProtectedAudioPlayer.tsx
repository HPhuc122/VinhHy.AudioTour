import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { publicAudioTourApi, type PublicAudioTourAudioDto } from '../../api/publicAudioTourApi';
import { ROUTES } from '../../routes/routeConstants';
import { useI18n } from '../../i18n/I18nContext';

type Status = 'loading' | 'ready' | 'required' | 'expired' | 'forbidden' | 'missing' | 'invalid' | 'unknown';

interface ProtectedAudioPlayerProps {
  track: PublicAudioTourAudioDto;
  accessToken: string;
  poiName?: string;
  autoPlay?: boolean;
  autoPlayKey?: string | number | null;
  onUnauthorized?: () => void;
  onAutoPlayBlocked?: () => void;
  onAutoPlayStarted?: () => void;
}

export function ProtectedAudioPlayer({
  track,
  accessToken,
  poiName,
  autoPlay = false,
  autoPlayKey = null,
  onUnauthorized,
  onAutoPlayBlocked,
  onAutoPlayStarted,
}: ProtectedAudioPlayerProps) {
  const { t } = useI18n();
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const lastAutoPlayKeyRef = useRef<string | number | null>(null);
  const onUnauthorizedRef = useRef(onUnauthorized);
  const onAutoPlayBlockedRef = useRef(onAutoPlayBlocked);
  const onAutoPlayStartedRef = useRef(onAutoPlayStarted);

  useEffect(() => {
    onUnauthorizedRef.current = onUnauthorized;
  }, [onUnauthorized]);

  useEffect(() => {
    onAutoPlayBlockedRef.current = onAutoPlayBlocked;
  }, [onAutoPlayBlocked]);

  useEffect(() => {
    onAutoPlayStartedRef.current = onAutoPlayStarted;
  }, [onAutoPlayStarted]);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    async function loadAudio() {
      if (!accessToken) {
        setStatus('required');
        return;
      }

      if (!track.isAvailable) {
        setStatus('missing');
        return;
      }

      setStatus('loading');
      setAudioUrl(null);

      try {
        const blob = await publicAudioTourApi.getAudioBlob(track.audioTrackId ?? track.id, accessToken);
        if (cancelled) return;

        objectUrl = URL.createObjectURL(blob);
        setAudioUrl(objectUrl);
        setStatus('ready');
      } catch (error) {
        if (cancelled) return;

        const code = axios.isAxiosError(error) ? error.response?.status : undefined;
        if (code === 401) {
          setStatus('expired');
          onUnauthorizedRef.current?.();
        } else if (code === 403) {
          setStatus('forbidden');
        } else if (code === 404) {
          setStatus('missing');
        } else if (error instanceof Error && error.message === 'invalid-audio') {
          setStatus('invalid');
        } else {
          setStatus('unknown');
        }
      }
    }

    void loadAudio();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [accessToken, track.audioTrackId, track.id, track.isAvailable]);

  useEffect(() => {
    if (!autoPlay || status !== 'ready' || !audioUrl || !audioElementRef.current) {
      return;
    }

    const nextAutoPlayKey = autoPlayKey ?? `${track.audioTrackId ?? track.id}:${audioUrl}`;
    if (lastAutoPlayKeyRef.current === nextAutoPlayKey) {
      return;
    }

    lastAutoPlayKeyRef.current = nextAutoPlayKey;

    void audioElementRef.current.play()
      .then(() => {
        onAutoPlayStartedRef.current?.();
      })
      .catch(() => {
        onAutoPlayBlockedRef.current?.();
      });
  }, [audioUrl, autoPlay, autoPlayKey, status, track.audioTrackId, track.id]);

  const statusMessage =
    status === 'loading'
      ? t('loading')
      : status === 'expired'
        ? t('accessExpired')
        : status === 'required' || status === 'forbidden'
          ? t('accessRequiredMessage')
          : t('audioUnavailable');

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900 p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          {poiName ? <p className="text-xs font-medium text-emerald-300">{poiName}</p> : null}
          <p className="font-semibold text-gray-100">{track.title || t('narration')}</p>
          <p className="mt-1 text-xs text-gray-500">{track.language || track.languageCode.toUpperCase()}</p>
        </div>
        {formatDuration(track.duration ?? track.durationSeconds) ? (
          <span className="rounded-full bg-gray-800 px-2 py-1 text-xs text-gray-300">
            {formatDuration(track.duration ?? track.durationSeconds)}
          </span>
        ) : null}
      </div>

      {status === 'ready' && audioUrl ? (
        <audio ref={audioElementRef} controls preload="auto" src={audioUrl} className="w-full" />
      ) : (
        <div className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-3">
          <p className="text-sm text-gray-300">{statusMessage}</p>
          {status === 'required' || status === 'expired' || status === 'forbidden' ? (
            <Link to={ROUTES.PACKAGES} className="mt-3 inline-flex rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white">
              {t('choosePass')}
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}

function formatDuration(duration?: number | null): string {
  if (!duration || duration <= 0) return '';

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
