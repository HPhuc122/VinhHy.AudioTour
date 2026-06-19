import { httpClient } from './httpClient';
import type { ApiResponse, PagedResult, PublicPoiDto } from '../types/api';

export type { PublicPoiDto as PoiDto };

const CATEGORY_API_MAP: Record<string, string | undefined> = {
  'Tất cả': undefined,
  'Ẩm thực': 'restaurant',
  'Di tích': 'landmark',
  'Phong cảnh': 'landmark',
  'Mua sắm': 'museum',
};

export function mapPublicCategory(label: string): string | undefined {
  return CATEGORY_API_MAP[label];
}

export const poisApi = {
  async getAll(
    page = 1,
    pageSize = 20,
    lang = 'vi',
    category?: string,
  ): Promise<PagedResult<PublicPoiDto>> {
    const res = await httpClient.get<ApiResponse<PagedResult<PublicPoiDto>>>('/public/pois', {
      params: {
        page,
        pageSize,
        lang,
        category: category || undefined,
      },
    });
    return res.data.data;
  },

  async getById(id: number, lang = 'vi'): Promise<PublicPoiDto> {
    const res = await httpClient.get<ApiResponse<PublicPoiDto>>(`/public/pois/${id}`, {
      params: { lang },
    });
    return res.data.data;
  },

  async search(query: string, lang = 'vi'): Promise<PublicPoiDto[]> {
    const res = await httpClient.get<ApiResponse<PagedResult<PublicPoiDto>>>('/public/pois', {
      params: { search: query, lang, page: 1, pageSize: 20 },
    });
    return res.data.data.items;
  },
};
