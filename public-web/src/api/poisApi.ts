import { httpClient } from './httpClient';
import type { ApiResponse, PagedResult, PoiDto } from '../types/api';

export const poisApi = {
  async getAll(page = 1, pageSize = 20, lang = 'vi'): Promise<PagedResult<PoiDto>> {
    const res = await httpClient.get<ApiResponse<PagedResult<PoiDto>>>('/pois', {
      params: { page, pageSize, lang },
    });
    return res.data.data;
  },

  async getById(id: number, lang = 'vi'): Promise<PoiDto> {
    const res = await httpClient.get<ApiResponse<PoiDto>>(`/pois/${id}`, {
      params: { lang },
    });
    return res.data.data;
  },

  async search(query: string, lang = 'vi'): Promise<PoiDto[]> {
    const res = await httpClient.get<ApiResponse<PoiDto[]>>('/pois/search', {
      params: { q: query, lang },
    });
    return res.data.data;
  },
};
