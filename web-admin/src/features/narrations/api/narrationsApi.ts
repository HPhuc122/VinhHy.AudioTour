import type { AxiosInstance } from 'axios';
import { toApiClientError } from '@/api/apiError';
import type { ApiResponse, PagedResult } from '@/types/api';
import type { ApprovalStatusFilter } from '@/features/media/api/mediaApi';

const NARRATIONS_BASE = '/api/v1/narrations';

export type NarrationStatus = 'Pending' | 'Approved' | 'Rejected' | 'AudioGenerated';
export type NarrationStatusFilter = ApprovalStatusFilter | 'AudioGenerated';

export interface NarrationDraftDto {
  id: number;
  title: string;
  languageCode: string;
  textContent: string;
  voice: string;
  poiId: number;
  poiCode?: string | null;
  poiName?: string | null;
  status: NarrationStatus;
  submittedByUserId: number;
  submittedByUsername?: string | null;
  submittedAt: string;
  reviewedByUserId?: number | null;
  reviewedByUsername?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  generatedAudioTrackId?: number | null;
  generatedAudioDurationSeconds?: number | null;
  audioGeneratedAt?: string | null;
  simulatedAudioUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NarrationSearchFilter {
  page?: number;
  pageSize?: number;
  status?: NarrationStatusFilter;
  search?: string;
  poiId?: number;
}

export interface CreateNarrationDraftRequest {
  poiId: number;
  title: string;
  languageCode: string;
  textContent: string;
  voice: string;
}

export interface UploadNarrationAudioRequest {
  file: File;
  title?: string;
  durationSeconds?: number;
}

export interface GenerateNarrationTranslationsRequest {
  targetLanguageCodes: string[];
  overwriteExisting: boolean;
}

export interface GenerateNarrationTranslationsResponse {
  narrations: NarrationDraftDto[];
  skippedLanguageCodes: string[];
}

export function createNarrationsApi(httpClient: AxiosInstance) {
  return {
    async searchNarrations(filter: NarrationSearchFilter = {}): Promise<PagedResult<NarrationDraftDto>> {
      const response = await httpClient.get<ApiResponse<PagedResult<NarrationDraftDto>>>(
        NARRATIONS_BASE,
        {
          params: {
            page: filter.page ?? 1,
            pageSize: filter.pageSize ?? 20,
            status: filter.status && filter.status !== 'all' ? filter.status : undefined,
            search: filter.search || undefined,
            poiId: filter.poiId,
          },
        },
      );

      return unwrapApiResponse(response.data);
    },

    async getNarrationsByPoi(poiId: number, filter: NarrationSearchFilter = {}): Promise<PagedResult<NarrationDraftDto>> {
      const response = await httpClient.get<ApiResponse<PagedResult<NarrationDraftDto>>>(
        `${NARRATIONS_BASE}/by-poi/${poiId}`,
        {
          params: {
            page: filter.page ?? 1,
            pageSize: filter.pageSize ?? 20,
            status: filter.status && filter.status !== 'all' ? filter.status : undefined,
            search: filter.search || undefined,
          },
        },
      );

      return unwrapApiResponse(response.data);
    },

    async createNarration(request: CreateNarrationDraftRequest): Promise<NarrationDraftDto> {
      const response = await httpClient.post<ApiResponse<NarrationDraftDto>>(
        NARRATIONS_BASE,
        request,
      );

      return unwrapApiResponse(response.data);
    },

    async approveNarration(id: number): Promise<NarrationDraftDto> {
      const response = await httpClient.post<ApiResponse<NarrationDraftDto>>(
        `${NARRATIONS_BASE}/${id}/approve`,
      );

      return unwrapApiResponse(response.data);
    },

    async rejectNarration(id: number, reason: string): Promise<NarrationDraftDto> {
      const response = await httpClient.post<ApiResponse<NarrationDraftDto>>(
        `${NARRATIONS_BASE}/${id}/reject`,
        { reason },
      );

      return unwrapApiResponse(response.data);
    },

    async generateTranslations(
      id: number,
      request: GenerateNarrationTranslationsRequest,
    ): Promise<GenerateNarrationTranslationsResponse> {
      const response = await httpClient.post<ApiResponse<GenerateNarrationTranslationsResponse>>(
        `${NARRATIONS_BASE}/${id}/translations`,
        request,
      );

      return unwrapApiResponse(response.data);
    },

    async generateAudio(id: number): Promise<NarrationDraftDto> {
      const response = await httpClient.post<ApiResponse<NarrationDraftDto>>(
        `${NARRATIONS_BASE}/${id}/generate-audio`,
      );

      return unwrapApiResponse(response.data);
    },

    async uploadAudio(id: number, request: UploadNarrationAudioRequest): Promise<NarrationDraftDto> {
      const formData = new FormData();
      formData.append('file', request.file);
      if (request.title?.trim()) {
        formData.append('title', request.title.trim());
      }
      if (typeof request.durationSeconds === 'number') {
        formData.append('durationSeconds', String(request.durationSeconds));
      }

      const response = await httpClient.post<ApiResponse<NarrationDraftDto>>(
        `${NARRATIONS_BASE}/${id}/upload-audio`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );

      return unwrapApiResponse(response.data);
    },
  };
}

function unwrapApiResponse<T>(body: ApiResponse<T>): T {
  if (!body.success || body.data === null || typeof body.data === 'undefined') {
    throw toApiClientError(new Error(body.message || 'Thao tác thất bại'));
  }

  return body.data;
}

export type NarrationsApi = ReturnType<typeof createNarrationsApi>;
