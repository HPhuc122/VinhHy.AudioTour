import type { AxiosInstance } from 'axios';
import { toApiClientError } from '@/api/apiError';
import type { ApiResponse, PagedResult } from '@/types/api';

const POIS_BASE = '/api/v1/pois';

export interface PoiDto {
  id: number;
  code: string;
  displayName?: string | null;
  isActive: boolean;
  category?: string | null;
}

export interface PoiListFilter {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
}

export function createPoisApi(httpClient: AxiosInstance) {
  return {
    async getPois(filter: PoiListFilter = {}): Promise<PagedResult<PoiDto>> {
      const response = await httpClient.get<ApiResponse<PagedResult<PoiDto>>>(POIS_BASE, {
        params: {
          page: filter.page ?? 1,
          pageSize: filter.pageSize ?? 100,
          search: filter.search || undefined,
          isActive: filter.isActive,
        },
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

export type PoisApi = ReturnType<typeof createPoisApi>;
