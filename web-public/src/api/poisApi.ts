import { httpClient } from './httpClient';
import type { ApiResponse, PagedResult, PublicPoiDto } from '../types/api';
import { toPublicAssetUrl, toPublicAssetUrls } from '../utils/publicAssetUrl';

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
    return {
      ...res.data.data,
      items: res.data.data.items.map(mapPoiAssets),
    };
  },

  async getById(id: number, lang = 'vi'): Promise<PublicPoiDto> {
    const res = await httpClient.get<ApiResponse<PublicPoiDto>>(`/public/pois/${id}`, {
      params: { lang },
    });
    return mapPoiAssets(res.data.data);
  },

  async search(query: string, lang = 'vi'): Promise<PublicPoiDto[]> {
    const res = await httpClient.get<ApiResponse<PagedResult<PublicPoiDto>>>('/public/pois', {
      params: { search: query, lang, page: 1, pageSize: 20 },
    });
    return res.data.data.items.map(mapPoiAssets);
  },
};

function mapPoiAssets(poi: PublicPoiDto): PublicPoiDto {
  return {
    ...poi,
    imageUrl: toPublicAssetUrl(poi.imageUrl),
    imageUrls: toPublicAssetUrls(poi.imageUrls),
    menuImageUrls: toPublicAssetUrls(poi.menuImageUrls),
    highlightImageUrls: toPublicAssetUrls(poi.highlightImageUrls),
  };
}
