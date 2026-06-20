import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { publicAudioTourApi, type PublicAudioTourAudioDto } from '../../api/publicAudioTourApi';
import { ROUTES } from '../../routes/routeConstants';

interface ProtectedAudioPlayerProps {
  track: PublicAudioTourAudioDto;
  accessToken: string;
  poiName?: string;
  onUnauthorized?: () => void;
}

export function ProtectedAudioPlayer({
  track,
  accessToken,
  poiName,
  onUnauthorized,
}: ProtectedAudioPlayerProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'required' | 'expired' | 'forbidden' | 'missing' | 'invalid' | 'unknown'>('loading');

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
        if (cancelled) {
          return;
        }

        objectUrl = URL.createObjectURL(blob);
        setAudioUrl(objectUrl);
        setStatus('ready');
      } catch (error) {
        if (cancelled) {
          return;
        }

        const statusCode = axios.isAxiosError(error) ? error.response?.status : undefined;
        if (statusCode === 401) {
          setStatus('expired');
          onUnauthorized?.();
        } else if (statusCode === 403) {
          setStatus('forbidden');
        } else if (statusCode === 404) {
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
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [accessToken, track.audioTrackId, track.id, track.isAvailable]);

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900 p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {poiName ? <p className="text-xs font-medium text-emerald-300">{poiName}</p> : null}
          <p className="font-semibold text-gray-100">{track.title || `Thuyết minh ${formatLanguage(track)}`}</p>
          <p className="mt-1 text-xs text-gray-500">{formatLanguage(track)}</p>
        </div>
        {formatDuration(track.duration ?? track.durationSeconds) ? (
          <span className="rounded-full bg-gray-800 px-2 py-1 text-xs text-gray-300">
            {formatDuration(track.duration ?? track.durationSeconds)}
          </span>
        ) : null}
      </div>
      {status === 'ready' && audioUrl ? (
        <audio controls src={audioUrl} className="w-full" />
      ) : (
        <div className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-3">
          <p className="text-sm text-gray-300">{getStatusMessage(status)}</p>
          {(status === 'required' || status === 'expired' || status === 'forbidden') ? (
            <Link
              to={ROUTES.PACKAGES}
              className="mt-3 inline-flex rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
            >
              Chọn gói nghe / quét QR
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}

function getStatusMessage(status: string): string {
  switch (status) {
    case 'loading':
      return 'Đang tải audio bảo vệ...';
    case 'required':
      return 'Cần gói nghe hoặc mã QR để phát audio.';
    case 'expired':
      return 'Không thể phát audio vì mã nghe đã hết hạn.';
    case 'forbidden':
      return 'Mã nghe hiện tại không áp dụng cho điểm này.';
    case 'missing':
      return 'Điểm này chưa có bản thuyết minh hoặc không còn khả dụng.';
    case 'invalid':
      return 'File audio của điểm này chưa phát được. Vui lòng thử lại sau.';
    case 'unknown':
      return 'Không thể tải audio. Vui lòng thử lại sau.';
    default:
      return 'Audio đang được cập nhật.';
  }
}

function formatLanguage(track: PublicAudioTourAudioDto): string {
  return track.language || track.languageCode?.toUpperCase() || 'Ngôn ngữ chưa rõ';
}

function formatDuration(duration?: number | null): string {
  if (!duration || duration <= 0) {
    return '';
  }

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
