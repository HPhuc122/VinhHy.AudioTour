import { httpClient } from './httpClient';
import type { ApiResponse } from '../types/api';

export interface PublicPackageDto {
  code: string;
  requiresPayment: boolean;
  priceAmount: number;
  accessDurationMinutes: number;
  publicQrUrl: string;
}

export const publicPackagesApi = {
  async getAll(): Promise<PublicPackageDto[]> {
    const response = await httpClient.get<ApiResponse<PublicPackageDto[]>>('/public/packages');
    return response.data.data;
  },
};
