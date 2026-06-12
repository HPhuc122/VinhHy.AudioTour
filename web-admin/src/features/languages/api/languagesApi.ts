import type { AxiosInstance } from 'axios';
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

export function createLanguagesApi(httpClient: AxiosInstance) {
  return {
    async getLanguages(activeOnly = true): Promise<LanguageDto[]> {
      const response = await httpClient.get<ApiResponse<LanguageDto[]>>(LANGUAGES_BASE, {
        params: { activeOnly },
      });

      return unwrapApiResponse(response.data);
    },
  };
}

function unwrapApiResponse<T>(body: ApiResponse<T>): T {
  if (!body.success || body.data === null) {
    throw toApiClientError(new Error(body.message || 'Request failed'));
  }

  return body.data;
}

export type LanguagesApi = ReturnType<typeof createLanguagesApi>;
