import { httpClient } from './httpClient';
import type {
  ApiResponse,
  PagedResult,
  PublicPoiDto,
  PublicTourDto,
  TourDetailDto,
  TourDto,
  TourTranslationDto,
} from '../types/api';

function selectTranslation(tour: PublicTourDto, lang: string): TourTranslationDto | null {
  return (
    tour.translations.find((item) => item.languageCode === lang) ??
    tour.translations.find((item) => item.languageCode === tour.defaultLanguage) ??
    tour.translations[0] ??
    null
  );
}

function mapTour(tour: PublicTourDto, lang: string): TourDto {
  const translation = selectTranslation(tour, lang);
  return {
    id: tour.id,
    code: tour.code,
    defaultLanguage: tour.defaultLanguage,
    isActive: true,
    estimatedMinutes: tour.estimatedMinutes ?? null,
    name: translation?.name ?? tour.code,
    description: translation?.description ?? null,
  };
}

function mapPoi(stop: PublicTourDto['pois'][number]): PublicPoiDto {
  return {
    id: stop.poiId,
    code: stop.poiCode ?? String(stop.poiId),
    latitude: stop.latitude,
    longitude: stop.longitude,
    radiusMeters: stop.radiusMeters ?? 30,
    priority: stop.orderIndex,
    imageUrl: stop.imageUrl ?? null,
    category: stop.category ?? null,
    name: stop.poiName ?? stop.poiCode ?? `Stop ${stop.orderIndex}`,
    description: stop.poiDescription ?? stop.poiShortDescription ?? '',
    shortDescription: stop.poiShortDescription ?? null,
  };
}

function mapTourDetail(tour: PublicTourDto, lang: string): TourDetailDto {
  return {
    ...mapTour(tour, lang),
    pois: [...tour.pois].sort((a, b) => a.orderIndex - b.orderIndex).map(mapPoi),
  };
}

export const toursApi = {
  async getAll(lang = 'vi'): Promise<TourDto[]> {
    const res = await httpClient.get<ApiResponse<PagedResult<PublicTourDto>>>('/public/tours', {
      params: { page: 1, pageSize: 50, lang },
    });
    return res.data.data.items.map((tour) => mapTour(tour, lang));
  },

  async getById(id: number, lang = 'vi'): Promise<TourDetailDto> {
    const res = await httpClient.get<ApiResponse<PublicTourDto>>(`/public/tours/${id}`, {
      params: { lang },
    });
    return mapTourDetail(res.data.data, lang);
  },
};
