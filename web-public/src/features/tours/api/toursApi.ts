import { toApiClientError } from '@/api/apiError';
import { httpClient } from '@/api/httpClient';
import type { ApiResponse, PagedResult } from '@/types/api';

const PUBLIC_TOURS_BASE = '/api/v1/public/tours';

export interface TourTranslationDto {
  id: number;
  tourId: number;
  languageCode: string;
  name: string;
  description?: string | null;
}

export interface PublicTourPoiDto {
  id: number;
  tourId: number;
  poiId: number;
  poiCode?: string | null;
  poiName?: string | null;
  poiDescription?: string | null;
  poiShortDescription?: string | null;
  latitude: number;
  longitude: number;
  imageUrl?: string | null;
  category?: string | null;
  hasAudio: boolean;
  orderIndex: number;
}

export interface PublicTourDto {
  id: number;
  code: string;
  defaultLanguage: string;
  estimatedMinutes?: number | null;
  translations: TourTranslationDto[];
  pois: PublicTourPoiDto[];
}

export interface PublicTourFilter {
  page?: number;
  pageSize?: number;
  search?: string;
}

export async function getPublicTours(
  filter: PublicTourFilter = {},
): Promise<PagedResult<PublicTourDto>> {
  const response = await httpClient.get<ApiResponse<PagedResult<PublicTourDto>>>(
    PUBLIC_TOURS_BASE,
    {
      params: {
        page: filter.page ?? 1,
        pageSize: filter.pageSize ?? 20,
        search: filter.search || undefined,
      },
    },
  );

  return unwrapApiResponse(response.data);
}

export async function getPublicTour(id: number): Promise<PublicTourDto> {
  const response = await httpClient.get<ApiResponse<PublicTourDto>>(`${PUBLIC_TOURS_BASE}/${id}`);
  return unwrapApiResponse(response.data);
}

export function selectTourTranslation(
  tour: PublicTourDto,
  preferredLanguage = navigator.language.split('-')[0] || tour.defaultLanguage,
): TourTranslationDto | null {
  return (
    tour.translations.find((item) => item.languageCode === preferredLanguage) ??
    tour.translations.find((item) => item.languageCode === tour.defaultLanguage) ??
    tour.translations[0] ??
    null
  );
}

function unwrapApiResponse<T>(body: ApiResponse<T>): T {
  if (!body.success || body.data === null || typeof body.data === 'undefined') {
    throw toApiClientError(new Error(body.message || 'Request failed'));
  }

  return body.data;
}
