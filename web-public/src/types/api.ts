export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface PublicPoiDto {
  id: number;
  code: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  priority: number;
  imageUrl: string | null;
  imageUrls?: string[];
  category: string | null;
  name: string;
  description: string;
  shortDescription: string | null;
  cooldownSeconds?: number;
  minDwellSeconds?: number;
}

/** @deprecated Use PublicPoiDto — kept for gradual migration in UI components */
export type PoiDto = PublicPoiDto;

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
  radiusMeters: number;
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

export interface TourDto {
  id: number;
  code: string;
  defaultLanguage: string;
  isActive: boolean;
  estimatedMinutes: number | null;
  name: string;
  description: string | null;
}

export interface TourDetailDto extends TourDto {
  pois: PublicPoiDto[];
}

export interface QrDto {
  id: number;
  code: string;
  poiId?: number | null;
  poiCode?: string | null;
  tourId?: number | null;
  tourCode?: string | null;
  isActive: boolean;
  requiresPayment: boolean;
  priceAmount: number;
  accessDurationMinutes: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface QrPoiDto {
  poiId: number;
  poiCode: string;
  name: string;
  description: string;
  shortDescription: string | null;
  imageUrl: string | null;
  latitude: number;
  longitude: number;
  audioUrl: string | null;
}

export interface QrResolveResponse {
  qr: QrDto;
  poi?: QrPoiDto | null;
  tour?: TourDetailDto | null;
}
