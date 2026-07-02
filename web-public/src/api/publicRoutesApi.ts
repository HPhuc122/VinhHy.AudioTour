import { httpClient } from './httpClient';
import type { ApiResponse } from '../types/api';

export interface PoiToPoiRouteDto {
  fromPoiId: number;
  toPoiId: number;
  directDistanceMeters: number;
  routeDistanceMeters: number;
  durationSeconds: number;
  latLngs: Array<{ latitude: number; longitude: number }>;
}

export const publicRoutesApi = {
  async getPoiToPoiRoute(
    fromPoiId: number,
    toPoiId: number,
    signal?: AbortSignal,
  ): Promise<PoiToPoiRouteDto> {
    const res = await httpClient.get<ApiResponse<PoiToPoiRouteDto>>('/public/routes/poi-to-poi', {
      params: { fromPoiId, toPoiId },
      signal,
    });

    return res.data.data;
  },
};
