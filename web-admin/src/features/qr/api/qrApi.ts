import type { AxiosInstance } from 'axios';
import { toApiClientError } from '@/api/apiError';
import type { ApiResponse } from '@/types/api';

const QR_BASE = '/api/v1/qr';

export interface QrDto {
  id: number;
  code: string;
  name: string;
  qrKind: QrKind;
  publicUrl: string;
  poiId?: number | null;
  poiCode?: string | null;
  tourId?: number | null;
  tourCode?: string | null;
  isActive: boolean;
  requiresPayment: boolean;
  priceAmount: number;
  accessDurationMinutes: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type QrKind = 'Poi' | 'Tour' | 'AudioPackage';

export interface CreateQrRequest {
  name: string;
  qrKind: QrKind;
  poiId?: number | null;
  tourId?: number | null;
  isActive: boolean;
  requiresPayment?: boolean;
  priceAmount?: number;
  accessDurationMinutes?: number;
}

export interface UpdateQrRequest {
  name?: string;
  qrKind?: QrKind;
  poiId?: number | null;
  tourId?: number | null;
  isActive?: boolean;
  requiresPayment?: boolean;
  priceAmount?: number;
  accessDurationMinutes?: number;
}

export type QrFormValues = CreateQrRequest;

export function createQrApi(httpClient: AxiosInstance) {
  return {
    async getQrs(): Promise<QrDto[]> {
      const response = await httpClient.get<ApiResponse<QrDto[]>>(QR_BASE);
      return unwrapApiResponse(response.data);
    },

    async getQr(id: number): Promise<QrDto> {
      const response = await httpClient.get<ApiResponse<QrDto>>(`${QR_BASE}/${id}`);
      return unwrapApiResponse(response.data);
    },

    async createQr(request: CreateQrRequest): Promise<QrDto> {
      const response = await httpClient.post<ApiResponse<QrDto>>(QR_BASE, request);
      return unwrapApiResponse(response.data);
    },

    async updateQr(id: number, request: UpdateQrRequest): Promise<QrDto> {
      const response = await httpClient.put<ApiResponse<QrDto>>(`${QR_BASE}/${id}`, request);
      return unwrapApiResponse(response.data);
    },

    async deleteQr(id: number): Promise<void> {
      const response = await httpClient.delete<ApiResponse<null>>(`${QR_BASE}/${id}`);
      unwrapApiResponse(response.data, true);
    },
  };
}

function unwrapApiResponse<T>(body: ApiResponse<T>, allowNull = false): T {
  if (!body.success || (!allowNull && (body.data === null || typeof body.data === 'undefined'))) {
    throw toApiClientError(new Error(body.message || 'Thao tác thất bại'));
  }

  return body.data as T;
}

export type QrApi = ReturnType<typeof createQrApi>;
