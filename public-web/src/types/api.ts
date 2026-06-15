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

export interface PoiDto {
  id: number;
  code: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  priority: number;
  isActive: boolean;
  imageUrl: string | null;
  category: string | null;
  name: string;
  description: string;
  shortDescription: string | null;
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
  pois: PoiDto[];
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
