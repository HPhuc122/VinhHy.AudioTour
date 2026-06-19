import type { AxiosInstance } from 'axios';
import { httpClient } from '@/api/httpClient';
import { toApiClientError } from '@/api/apiError';
import type { ApiResponse, PagedResult } from '@/types/api';

const POIS_BASE = '/api/v1/pois';
const POI_TRANSLATION_TIMEOUT_MS = 120_000;

export interface PoiDto {
  id: number;
  code: string;
  name: string;
  shortDescription?: string | null;
  description?: string | null;
  approvalStatus: number | string;
  userId?: number | null;
  displayName?: string | null;
  isActive: boolean;
  category?: string | null;
  imageUrl?: string | null;
  audioUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  radiusMeters?: number | null;
  priority?: number | null;
  cooldownSeconds?: number | null;
  minDwellSeconds?: number | null;
  imageUrls?: string[];
}

export interface PoiLanguageSelection {
  selectedLanguageCodes?: string[];
}

export interface PoiListFilter {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  isActive?: boolean | string;
  approvalStatus?: number | string;
  includeDeleted?: boolean;
}

export interface TranslateTextRequest {
  text: string;
  targetLanguage: string;
}

export interface TranslateTextResponse {
  translatedText: string;
}

export function createPoisApi(client: AxiosInstance) {
  return {
    async getPois(filter: PoiListFilter = {}): Promise<PagedResult<PoiDto>> {
      const response = await client.get<ApiResponse<PagedResult<PoiDto>>>(POIS_BASE, {
        params: {
          page: filter.page ?? 1,
          pageSize: filter.pageSize ?? 100,
          search: filter.search || undefined,
          category: filter.category || undefined,
          isActive: filter.isActive,
          approvalStatus: filter.approvalStatus,
          includeDeleted: filter.includeDeleted,
        },
      });

      return unwrapApiResponse(response.data);
    },
  };
}

export const poisApi = {
  async getAll(params: PoiListFilter = {}): Promise<PagedResult<PoiDto>> {
    const { page = 1, pageSize = 20, ...rest } = params;
    const response = await httpClient.get<ApiResponse<PagedResult<PoiDto>>>(POIS_BASE, {
      params: { page, pageSize, ...rest },
    });

    return unwrapApiResponse(response.data);
  },

  async create(data: FormData): Promise<PoiDto> {
    const response = await httpClient.post<ApiResponse<PoiDto>>(POIS_BASE, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: POI_TRANSLATION_TIMEOUT_MS,
    });

    return unwrapApiResponse(response.data);
  },

  async update(id: number, data: FormData): Promise<PoiDto> {
    const response = await httpClient.put<ApiResponse<PoiDto>>(`${POIS_BASE}/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: POI_TRANSLATION_TIMEOUT_MS,
    });

    return unwrapApiResponse(response.data);
  },

  async updateApprovalStatus(id: number, approvalStatus: number): Promise<PoiDto> {
    const response = await httpClient.put<ApiResponse<PoiDto>>(
      `${POIS_BASE}/${id}/approval-status`,
      { approvalStatus },
    );

    return unwrapApiResponse(response.data);
  },

  async delete(id: number): Promise<void> {
    await httpClient.delete(`${POIS_BASE}/${id}`);
  },

  async restore(id: number): Promise<void> {
    await httpClient.put(`${POIS_BASE}/${id}/restore`);
  },

  async translateText(text: string, targetLanguage: string): Promise<string> {
    const response = await httpClient.post<ApiResponse<TranslateTextResponse>>(
      `${POIS_BASE}/translate`,
      { text, targetLanguage } satisfies TranslateTextRequest,
    );

    return unwrapApiResponse(response.data).translatedText;
  },
};

function unwrapApiResponse<T>(body: ApiResponse<T>): T {
  if (!body.success || body.data === null) {
    throw toApiClientError(new Error(body.message || 'Request failed'));
  }

  return body.data;
}

export type PoisApi = ReturnType<typeof createPoisApi>;

export default poisApi;
