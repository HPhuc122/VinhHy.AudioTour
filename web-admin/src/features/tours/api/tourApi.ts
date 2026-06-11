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
  };
}

function unwrapApiResponse<T>(body: ApiResponse<T>, allowNull = false): T {
  if (!body.success || (!allowNull && body.data === null)) {
    throw toApiClientError(new Error(body.message || 'Request failed'));
  }

  return body.data as T;
}

export type TourApi = ReturnType<typeof createTourApi>;
