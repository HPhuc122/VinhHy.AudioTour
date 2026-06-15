import type { AxiosInstance } from 'axios';
import { httpClient } from '@/api/httpClient';
import { toApiClientError } from '@/api/apiError';
import type { ApiResponse } from '@/types/api';

const LANGUAGES_BASE = '/api/v1/languages';

export interface LanguageDto {
  code: string;
  name: string;
  nativeName: string;
  isActive: boolean;
  sortOrder: number;
}

export interface CreateLanguageRequest {
  code: string;
  name: string;
  nativeName: string;
  isActive: boolean;
  sortOrder: number;
}

export interface UpdateLanguageRequest {
  name: string;
  nativeName: string;
  isActive: boolean;
  sortOrder: number;
}

export function createLanguagesApi(client: AxiosInstance) {
  return {
    async getLanguages(activeOnly = true): Promise<LanguageDto[]> {
      const response = await client.get<ApiResponse<LanguageDto[]>>(LANGUAGES_BASE, {
        params: { activeOnly },
      });

      return unwrapApiResponse(response.data);
    },
  };
}

export const languagesApi = {
  async getAll(): Promise<LanguageDto[]> {
    const response = await httpClient.get<ApiResponse<LanguageDto[]>>(LANGUAGES_BASE, {
      params: { activeOnly: false },
    });

    return unwrapApiResponse(response.data);
  },

  async getById(code: string): Promise<LanguageDto> {
    const response = await httpClient.get<ApiResponse<LanguageDto>>(`${LANGUAGES_BASE}/${code}`);
    return unwrapApiResponse(response.data);
  },

  async create(data: CreateLanguageRequest): Promise<LanguageDto> {
    const response = await httpClient.post<ApiResponse<LanguageDto>>(LANGUAGES_BASE, data);
    return unwrapApiResponse(response.data);
  },

  async update(code: string, data: UpdateLanguageRequest): Promise<LanguageDto> {
    const response = await httpClient.put<ApiResponse<LanguageDto>>(`${LANGUAGES_BASE}/${code}`, data);
    return unwrapApiResponse(response.data);
  },

  async delete(code: string): Promise<void> {
    await httpClient.delete(`${LANGUAGES_BASE}/${code}`);
  },
};

function unwrapApiResponse<T>(body: ApiResponse<T>): T {
  if (!body.success || body.data === null) {
    throw toApiClientError(new Error(body.message || 'Request failed'));
  }

  return body.data;
}

export type LanguagesApi = ReturnType<typeof createLanguagesApi>;

export default languagesApi;
