import type { AxiosInstance } from 'axios';
import { toApiClientError } from '@/api/apiError';
import type { ApiResponse } from '@/types/api';

const CMS_AUDIO_PREVIEW_BASE = '/api/v1/cms/audio-preview';

export interface CmsAudioPreviewTrackDto {
  id: number;
  poiId: number;
  languageCode: string;
  title?: string | null;
  audioType: string;
  durationSeconds?: number | null;
  fileSizeBytes?: number | null;
  mimeType?: string | null;
  isActive: boolean;
  version: number;
  updatedAt: string;
}

export function createCmsAudioPreviewApi(httpClient: AxiosInstance) {
  return {
    async getByPoi(poiId: number): Promise<CmsAudioPreviewTrackDto[]> {
      const response = await httpClient.get<ApiResponse<CmsAudioPreviewTrackDto[]>>(
        `${CMS_AUDIO_PREVIEW_BASE}/by-poi/${poiId}`,
      );

      return unwrapApiResponse(response.data);
    },

    async getAudioBlob(audioTrackId: number, revision?: string): Promise<Blob> {
      const response = await httpClient.get<Blob>(
        `${CMS_AUDIO_PREVIEW_BASE}/${audioTrackId}/stream`,
        {
          responseType: 'blob',
          params: revision ? { _v: revision } : undefined,
        },
      );

      if (!isPlayableAudioBlob(response.data)) {
        throw toApiClientError(new Error('File audio không hợp lệ hoặc không phát được. Vui lòng tải lại MP3.'));
      }

      return response.data;
    },
  };
}

function unwrapApiResponse<T>(body: ApiResponse<T>): T {
  if (!body.success || body.data === null || typeof body.data === 'undefined') {
    throw toApiClientError(new Error(body.message || 'Thao tác thất bại'));
  }

  return body.data;
}

function isPlayableAudioBlob(blob: Blob): boolean {
  if (!blob || blob.size <= 0) {
    return false;
  }

  return !blob.type || blob.type.startsWith('audio/');
}

export type CmsAudioPreviewApi = ReturnType<typeof createCmsAudioPreviewApi>;
