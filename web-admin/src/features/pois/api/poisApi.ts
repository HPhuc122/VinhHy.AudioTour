import type { AxiosInstance } from 'axios';
import { httpClient } from '@/api/httpClient';
import { toApiClientError } from '@/api/apiError';
import type { ApiResponse, PagedResult } from '@/types/api';

const POIS_BASE = '/api/v1/pois';

export interface PoiDto {
  id: number;
  code: string;
  name: string;
  shortDescription?: string | null;
  description?: string | null;
  approvalStatus: number | string;
  lifecycleStatus: number | string;
  userId?: number | null;
  displayName?: string | null;
  isActive: boolean;
  paymentRequired: boolean;
  paymentStatus: number | string;
  activatedAt?: string | null;
  activatedByUserId?: number | null;
  validFrom?: string | null;
  validUntil?: string | null;
  category?: string | null;
  imageUrl?: string | null;
  audioUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  radiusMeters?: number | null;
  priority?: number | null;
  cooldownSeconds?: number | null;
  minDwellSeconds?: number | null;
  imageUrls?: string[];
}

export interface StartPoiPaymentResponse {
  paymentSessionId: number;
  poiId: number;
  provider: string;
  status: string;
  amount: number;
  currency: string;
  expiresAt: string;
}

export interface SimulatePoiPaymentResponse {
  paymentSessionId: number;
  poiId: number;
  status: string;
  poi: PoiDto;
}

export interface PoiListFilter {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  isActive?: boolean | string;
  approvalStatus?: number | string;
  lifecycleStatus?: number | string;
  includeDeleted?: boolean;
}

export function createPoisApi(client: AxiosInstance) {
  return {
    async getPois(filter: PoiListFilter = {}): Promise<PagedResult<PoiDto>> {
      const response = await client.get<ApiResponse<PagedResult<PoiDto>>>(POIS_BASE, {
        params: {
          page: filter.page ?? 1,
          pageSize: filter.pageSize ?? 100,
          search: filter.search || undefined,
          category: filter.category || undefined,
          isActive: filter.isActive,
          approvalStatus: filter.approvalStatus,
          lifecycleStatus: filter.lifecycleStatus,
          includeDeleted: filter.includeDeleted,
        },
      });

      return unwrapApiResponse(response.data);
    },
  };
}

export const poisApi = {
  async getAll(params: PoiListFilter = {}): Promise<PagedResult<PoiDto>> {
    const { page = 1, pageSize = 20, ...rest } = params;
    const response = await httpClient.get<ApiResponse<PagedResult<PoiDto>>>(POIS_BASE, {
      params: { page, pageSize, ...rest },
    });

    return unwrapApiResponse(response.data);
  },

  async create(data: FormData): Promise<PoiDto> {
    const response = await httpClient.post<ApiResponse<PoiDto>>(POIS_BASE, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return unwrapApiResponse(response.data);
  },

  async update(id: number, data: FormData): Promise<PoiDto> {
    const response = await httpClient.put<ApiResponse<PoiDto>>(`${POIS_BASE}/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return unwrapApiResponse(response.data);
  },

  async updateApprovalStatus(id: number, approvalStatus: number): Promise<PoiDto> {
    const response = await httpClient.put<ApiResponse<PoiDto>>(
      `${POIS_BASE}/${id}/approval-status`,
      { approvalStatus },
    );

    return unwrapApiResponse(response.data);
  },

  async approveReview(id: number): Promise<PoiDto> {
    const response = await httpClient.post<ApiResponse<PoiDto>>(`${POIS_BASE}/${id}/approve-review`);
    return unwrapApiResponse(response.data);
  },

  async requestPayment(id: number): Promise<PoiDto> {
    const response = await httpClient.post<ApiResponse<PoiDto>>(`${POIS_BASE}/${id}/request-payment`);
    return unwrapApiResponse(response.data);
  },

  async reject(id: number): Promise<PoiDto> {
    const response = await httpClient.post<ApiResponse<PoiDto>>(`${POIS_BASE}/${id}/reject`);
    return unwrapApiResponse(response.data);
  },

  async markPaid(id: number): Promise<PoiDto> {
    const response = await httpClient.post<ApiResponse<PoiDto>>(`${POIS_BASE}/${id}/mark-paid`);
    return unwrapApiResponse(response.data);
  },

  async waivePayment(id: number): Promise<PoiDto> {
    const response = await httpClient.post<ApiResponse<PoiDto>>(`${POIS_BASE}/${id}/waive-payment`);
    return unwrapApiResponse(response.data);
  },

  async startPayment(id: number): Promise<StartPoiPaymentResponse> {
    const response = await httpClient.post<ApiResponse<StartPoiPaymentResponse>>(
      `${POIS_BASE}/${id}/payment/start`,
    );

    return unwrapApiResponse(response.data);
  },

  async simulateMomoPayment(
    id: number,
    paymentSessionId: number,
    success = true,
  ): Promise<SimulatePoiPaymentResponse> {
    const response = await httpClient.post<ApiResponse<SimulatePoiPaymentResponse>>(
      `${POIS_BASE}/${id}/payment/simulate-momo`,
      { paymentSessionId, success },
    );

    return unwrapApiResponse(response.data);
  },

  async delete(id: number): Promise<void> {
    await httpClient.delete(`${POIS_BASE}/${id}`);
  },

  async restore(id: number): Promise<void> {
    await httpClient.put(`${POIS_BASE}/${id}/restore`);
  },
};

function unwrapApiResponse<T>(body: ApiResponse<T>): T {
  if (!body.success || body.data === null) {
    throw toApiClientError(new Error(body.message || 'Request failed'));
  }

  return body.data;
}

export type PoisApi = ReturnType<typeof createPoisApi>;

export default poisApi;
