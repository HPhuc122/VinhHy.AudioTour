import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { publicAudioTourApi, type PublicAudioTourAudioDto } from '../../api/publicAudioTourApi';

interface ProtectedAudioPlayerProps {
  track: PublicAudioTourAudioDto;
  accessToken: string;
  onUnauthorized?: () => void;
}

export function ProtectedAudioPlayer({
  track,
  accessToken,
  onUnauthorized,
}: ProtectedAudioPlayerProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'required' | 'expired' | 'forbidden' | 'missing'>('loading');

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

        const statusCode = error instanceof AxiosError ? error.response?.status : undefined;
        if (statusCode === 401) {
          setStatus('expired');
          onUnauthorized?.();
        } else if (statusCode === 403) {
          setStatus('forbidden');
        } else {
          setStatus('missing');
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
    <div className="rounded-lg bg-gray-900 p-3">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs text-gray-400">
        <span className="font-medium text-gray-200">{track.title || `Audio ${track.languageCode}`}</span>
        <span>{formatDuration(track.duration ?? track.durationSeconds)}</span>
      </div>
      {status === 'ready' && audioUrl ? (
        <audio controls src={audioUrl} className="w-full" />
      ) : (
        <p className="text-xs text-gray-400">{getStatusMessage(status)}</p>
      )}
    </div>
  );
}

function getStatusMessage(status: string): string {
  switch (status) {
    case 'loading':
      return 'Đang tải audio...';
    case 'required':
      return 'Cần GuestAccessPass để phát audio.';
    case 'expired':
      return 'GuestAccessPass đã hết hạn hoặc không hợp lệ.';
    case 'forbidden':
      return 'GuestAccessPass không thuộc POI này.';
    default:
      return 'Audio đang được cập nhật.';
  }
}

function formatDuration(duration?: number | null): string {
  if (!duration || duration <= 0) {
    return '';
  }

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
