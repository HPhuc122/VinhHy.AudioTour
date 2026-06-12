import type { AxiosInstance } from 'axios';
import { toApiClientError } from '@/api/apiError';
import type { ApiResponse } from '@/types/api';

const TOUR_BASE = '/api/v1/tours';

export interface TourTranslationDto {
  id: number;
  tourId: number;
  languageCode: string;
  name: string;
  description?: string | null;
}

export interface TourPoiDto {
  id: number;
  tourId: number;
  poiId: number;
  poiCode?: string | null;
  poiName?: string | null;
  orderIndex: number;
}

export interface TourDto {
  id: number;
  code: string;
  defaultLanguage: string;
  isActive: boolean;
  estimatedMinutes?: number | null;
  version: number;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  translations: TourTranslationDto[];
  pois: TourPoiDto[];
}

export interface TourListFilter {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface CreateTourRequest {
  code: string;
  defaultLanguage: string;
  isActive: boolean;
  estimatedMinutes?: number | null;
}

export interface UpdateTourRequest {
  defaultLanguage?: string;
  isActive?: boolean;
  estimatedMinutes?: number | null;
}

export interface CreateTourTranslationRequest {
  languageCode: string;
  name: string;
  description?: string | null;
}

export interface UpdateTourTranslationRequest {
  name?: string;
  description?: string | null;
}

export interface AddTourPoiRequest {
  poiId: number;
  orderIndex: number;
}

export interface ReorderTourPoisRequest {
  items: Array<{
    poiId: number;
    orderIndex: number;
  }>;
}

export type TourFormValues = CreateTourRequest;

export function createTourApi(httpClient: AxiosInstance) {
  return {
    async getTours(filter: TourListFilter = {}): Promise<PagedResult<TourDto>> {
      const response = await httpClient.get<ApiResponse<PagedResult<TourDto>>>(TOUR_BASE, {
        params: {
          page: filter.page ?? 1,
          pageSize: filter.pageSize ?? 50,
          search: filter.search || undefined,
          isActive: filter.isActive,
        },
      });

      return unwrapApiResponse(response.data);
    },

    async getTour(id: number): Promise<TourDto> {
      const response = await httpClient.get<ApiResponse<TourDto>>(`${TOUR_BASE}/${id}`);
      return unwrapApiResponse(response.data);
    },

    async createTour(request: CreateTourRequest): Promise<TourDto> {
      const response = await httpClient.post<ApiResponse<TourDto>>(TOUR_BASE, request);
      return unwrapApiResponse(response.data);
    },

    async updateTour(id: number, request: UpdateTourRequest): Promise<TourDto> {
      const response = await httpClient.put<ApiResponse<TourDto>>(`${TOUR_BASE}/${id}`, request);
      return unwrapApiResponse(response.data);
    },

    async deleteTour(id: number): Promise<void> {
      const response = await httpClient.delete<ApiResponse<null>>(`${TOUR_BASE}/${id}`);
      unwrapApiResponse(response.data, true);
    },

    async addTranslation(
      tourId: number,
      request: CreateTourTranslationRequest,
    ): Promise<TourTranslationDto> {
      const response = await httpClient.post<ApiResponse<TourTranslationDto>>(
        `${TOUR_BASE}/${tourId}/translations`,
        request,
      );
      return unwrapApiResponse(response.data);
    },

    async updateTranslation(
      translationId: number,
      request: UpdateTourTranslationRequest,
    ): Promise<TourTranslationDto> {
      const response = await httpClient.put<ApiResponse<TourTranslationDto>>(
        `${TOUR_BASE}/translations/${translationId}`,
        request,
      );
      return unwrapApiResponse(response.data);
    },

    async deleteTranslation(translationId: number): Promise<void> {
      const response = await httpClient.delete<ApiResponse<null>>(
        `${TOUR_BASE}/translations/${translationId}`,
      );
      unwrapApiResponse(response.data, true);
    },

    async addPoi(tourId: number, request: AddTourPoiRequest): Promise<TourPoiDto> {
      const response = await httpClient.post<ApiResponse<TourPoiDto>>(
        `${TOUR_BASE}/${tourId}/pois`,
        { poiId: request.poiId, orderIndex: request.orderIndex },
      );
      return unwrapApiResponse(response.data);
    },

    async removePoi(tourId: number, poiId: number): Promise<void> {
      const response = await httpClient.delete<ApiResponse<null>>(
        `${TOUR_BASE}/${tourId}/pois/${poiId}`,
      );
      unwrapApiResponse(response.data, true);
    },

    async reorderPois(tourId: number, request: ReorderTourPoisRequest): Promise<void> {
      const response = await httpClient.put<ApiResponse<null>>(
        `${TOUR_BASE}/${tourId}/pois/reorder`,
        { items: request.items.map((item) => ({ poiId: item.poiId, orderIndex: item.orderIndex })) },
      );
      unwrapApiResponse(response.data, true);
    },
  };
}

function unwrapApiResponse<T>(body: ApiResponse<T>, allowNull = false): T {
  if (!body.success || (!allowNull && body.data === null)) {
    throw toApiClientError(new Error(body.message || 'Request failed'));
  }

  return body.data as T;
}

export type TourApi = ReturnType<typeof createTourApi>;
