import { toApiClientError } from '@/api/apiError';
import { httpClient } from '@/api/httpClient';
import type { PublicTourDto } from '@/features/tours/api/toursApi';
import type { ApiResponse } from '@/types/api';

export interface QrDto {
  id: number;
  code: string;
  poiId?: number | null;
  poiCode?: string | null;
  tourId?: number | null;
  tourCode?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface PoiDto {
  id: number;
  code: string;
  displayName?: string | null;
  latitude: number;
  longitude: number;
  imageUrl?: string | null;
  category?: string | null;
}

export interface QrResolveResponse {
  qr: QrDto;
  poi?: PoiDto | null;
  tour?: PublicTourDto | null;
}

export async function resolveQr(code: string): Promise<QrResolveResponse> {
  const response = await httpClient.get<ApiResponse<QrResolveResponse>>(
    `/api/v1/qr/resolve/${encodeURIComponent(code)}`,
  );

  return unwrapApiResponse(response.data);
}

function unwrapApiResponse<T>(body: ApiResponse<T>): T {
  if (!body.success || body.data === null || typeof body.data === 'undefined') {
    throw toApiClientError(new Error(body.message || 'Request failed'));
  }

  return body.data;
}
