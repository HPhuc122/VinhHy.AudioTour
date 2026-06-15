import { httpClient } from './httpClient';
import type { ApiResponse, QrPoiDto } from '../types/api';

export const qrApi = {
  async scan(code: string, lang = 'vi'): Promise<QrPoiDto> {
    const res = await httpClient.get<ApiResponse<QrPoiDto>>(`/qr/scan/${code}`, {
      params: { lang },
    });
    return res.data.data;
  },
};
