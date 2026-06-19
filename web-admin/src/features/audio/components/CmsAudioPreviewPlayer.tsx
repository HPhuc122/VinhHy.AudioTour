import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import {
  createCmsAudioPreviewApi,
  type CmsAudioPreviewTrackDto,
} from '@/features/audio/api/cmsAudioPreviewApi';

interface CmsAudioPreviewPlayerProps {
  poiId: number;
}

export function CmsAudioPreviewPlayer({ poiId }: CmsAudioPreviewPlayerProps) {
  const { httpClient } = useAuth();
  const cmsAudioPreviewApi = useMemo(() => createCmsAudioPreviewApi(httpClient), [httpClient]);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);

  const tracksQuery = useQuery({
    queryKey: ['cms-audio-preview', 'poi', poiId],
    queryFn: () => cmsAudioPreviewApi.getByPoi(poiId),
  });

  const tracks = tracksQuery.data ?? [];

  useEffect(() => {
    if (!selectedTrackId && tracks.length > 0) {
      setSelectedTrackId(tracks[0]!.id);
    }
  }, [selectedTrackId, tracks]);

  if (tracksQuery.isLoading) {
    return <p className="text-xs text-gray-400">Đang tải audio preview...</p>;
  }

  if (tracksQuery.isError) {
    return <p className="text-xs text-red-500">Không thể tải audio preview.</p>;
  }

  if (tracks.length === 0) {
    return <p className="text-xs text-gray-400">Chưa có audio preview.</p>;
  }

  const selectedTrack = tracks.find((track) => track.id === selectedTrackId) ?? tracks[0]!;

  return (
    <div className="mt-4 rounded-lg bg-gray-50 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-gray-500">Nghe thử audio</p>
        {tracks.length > 1 ? (
          <select
            value={selectedTrack.id}
            onChange={(event) => setSelectedTrackId(Number(event.target.value))}
            className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700"
          >
            {tracks.map((track) => (
              <option key={track.id} value={track.id}>
                {getTrackLabel(track)}
              </option>
            ))}
          </select>
        ) : null}
      </div>
      <CmsAudioTrackPlayer track={selectedTrack} getAudioBlob={cmsAudioPreviewApi.getAudioBlob} />
    </div>
  );
}

function CmsAudioTrackPlayer({
  track,
  getAudioBlob,
}: {
  track: CmsAudioPreviewTrackDto;
  getAudioBlob: (audioTrackId: number) => Promise<Blob>;
}) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading');

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    async function loadAudio() {
      setStatus('loading');
      setAudioUrl(null);

      try {
        const blob = await getAudioBlob(track.id);
        if (cancelled) {
          return;
        }

        objectUrl = URL.createObjectURL(blob);
        setAudioUrl(objectUrl);
        setStatus('ready');
      } catch {
        if (!cancelled) {
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
  }, [getAudioBlob, track.id]);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-xs text-gray-500">
        <span>{getTrackLabel(track)}</span>
        <span>{formatDuration(track.durationSeconds)}</span>
      </div>
      {status === 'ready' && audioUrl ? (
        <audio controls src={audioUrl} className="w-full" />
      ) : (
        <p className="text-xs text-gray-400">
          {status === 'loading' ? 'Đang tải preview bảo vệ...' : 'Audio preview chưa khả dụng.'}
        </p>
      )}
    </div>
  );
}

function getTrackLabel(track: CmsAudioPreviewTrackDto): string {
  return track.title || `Audio ${track.languageCode}`;
}

function formatDuration(duration?: number | null): string {
  if (!duration || duration <= 0) {
    return '';
  }

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
