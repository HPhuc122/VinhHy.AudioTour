import { httpClient } from './httpClient';
import type { ApiResponse, TourDetailDto, TourDto } from '../types/api';

export const toursApi = {
  async getAll(lang = 'vi'): Promise<TourDto[]> {
    const res = await httpClient.get<ApiResponse<TourDto[]>>('/tours', {
      params: { lang },
    });
    return res.data.data;
  },

  async getById(id: number, lang = 'vi'): Promise<TourDetailDto> {
    const res = await httpClient.get<ApiResponse<TourDetailDto>>(`/tours/${id}`, {
      params: { lang },
    });
    return res.data.data;
  },
};
