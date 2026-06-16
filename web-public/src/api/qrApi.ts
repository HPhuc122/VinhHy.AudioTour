import { httpClient } from './httpClient';
import { toursApi } from './toursApi';
import type { ApiResponse, QrDto, QrPoiDto, QrResolveResponse, TourDetailDto } from '../types/api';

interface RawQrPoiDto {
  id: number;
  code: string;
  displayName?: string | null;
  latitude: number;
  longitude: number;
  imageUrl?: string | null;
  category?: string | null;
}

interface RawQrResolveResponse {
  qr: QrDto;
  poi?: RawQrPoiDto | null;
  tour?: { id: number } | TourDetailDto | null;
}

function mapPoi(poi: RawQrPoiDto): QrPoiDto {
  return {
    poiId: poi.id,
    poiCode: poi.code,
    name: poi.displayName ?? poi.code,
    description: '',
    shortDescription: null,
    imageUrl: poi.imageUrl ?? null,
    latitude: poi.latitude,
    longitude: poi.longitude,
    audioUrl: null,
  };
}

export const qrApi = {
  async scan(code: string, lang = 'vi'): Promise<QrResolveResponse> {
    const res = await httpClient.get<ApiResponse<RawQrResolveResponse>>(
      `/qr/resolve/${encodeURIComponent(code)}`,
    );
    const result: QrResolveResponse = {
      qr: res.data.data.qr,
      poi: res.data.data.poi ? mapPoi(res.data.data.poi) : null,
      tour: null,
    };

    if (res.data.data.tour?.id) {
      result.tour = await toursApi.getById(res.data.data.tour.id, lang);
    }

    return result;
  },
};
