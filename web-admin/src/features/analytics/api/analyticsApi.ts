import type { AxiosInstance } from 'axios';
import { toApiClientError } from '@/api/apiError';
import type { ApiResponse } from '@/types/api';

const ANALYTICS_BASE = '/api/v1/analytics';

export interface DashboardStatsDto {
  totalPois: number;
  totalTours: number;
  activeTours: number;
  totalQrCodes: number;
  activeQrCodes: number;
  totalMediaFiles: number;
  totalImages: number;
  totalAudioFiles: number;
  deletedMediaFiles: number;
  pendingImages: number;
  pendingNarrations: number;
  pendingReviewPois: number;
  approvedPois: number;
  pendingPaymentPois: number;
  activePois: number;
  expiredPois: number;
  rejectedPois: number;
  totalTourViews?: number | null;
  totalQrScans: number;
  totalAudioPlays: number;
}

export function createAnalyticsApi(httpClient: AxiosInstance) {
  return {
    async getDashboard(): Promise<DashboardStatsDto> {
      const response = await httpClient.get<ApiResponse<DashboardStatsDto>>(
        `${ANALYTICS_BASE}/dashboard`,
      );

      return unwrapApiResponse(response.data);
    },
  };
}

function unwrapApiResponse<T>(body: ApiResponse<T>): T {
  if (!body.success || body.data === null || typeof body.data === 'undefined') {
    throw toApiClientError(new Error(body.message || 'Thao tác thất bại'));
  }

  return body.data;
}

export type AnalyticsApi = ReturnType<typeof createAnalyticsApi>;
