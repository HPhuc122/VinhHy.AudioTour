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
}

export function createCmsAudioPreviewApi(httpClient: AxiosInstance) {
  return {
    async getByPoi(poiId: number): Promise<CmsAudioPreviewTrackDto[]> {
      const response = await httpClient.get<ApiResponse<CmsAudioPreviewTrackDto[]>>(
        `${CMS_AUDIO_PREVIEW_BASE}/by-poi/${poiId}`,
      );

      return unwrapApiResponse(response.data);
    },

    async getAudioBlob(audioTrackId: number): Promise<Blob> {
      const response = await httpClient.get<Blob>(
        `${CMS_AUDIO_PREVIEW_BASE}/${audioTrackId}/stream`,
        { responseType: 'blob' },
      );

      return response.data;
    },
  };
}

function unwrapApiResponse<T>(body: ApiResponse<T>): T {
  if (!body.success || body.data === null || typeof body.data === 'undefined') {
    throw toApiClientError(new Error(body.message || 'Request failed'));
  }

  return body.data;
}

export type CmsAudioPreviewApi = ReturnType<typeof createCmsAudioPreviewApi>;
