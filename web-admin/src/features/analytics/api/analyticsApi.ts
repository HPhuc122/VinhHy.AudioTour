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
  totalSiteVisits: number;
  totalVendorPoiVisits?: number | null;
  /** Number of browsers currently open on the public web (in-memory presence). */
  activeVisitors: number;
}

export interface AnalyticsDailyDto {
  id: number;
  poiId: number;
  poiCode?: string | null;
  date: string;
  totalPlays: number;
  gpsPlays: number;
  qrPlays: number;
  manualPlays: number;
  uniqueDevices: number;
}

export interface AnalyticsSummaryDto {
  totalPlays: number;
  gpsPlays: number;
  qrPlays: number;
  manualPlays: number;
  uniqueDevices: number;
  from?: string | null;
  to?: string | null;
}

export interface AnalyticsQueryFilter {
  from?: string;
  to?: string;
  poiId?: number;
}

export function createAnalyticsApi(httpClient: AxiosInstance) {
  return {
    async getDashboard(): Promise<DashboardStatsDto> {
      const response = await httpClient.get<ApiResponse<DashboardStatsDto>>(
        `${ANALYTICS_BASE}/dashboard`,
      );

      return unwrapApiResponse(response.data);
    },

    async getDaily(filter: AnalyticsQueryFilter = {}): Promise<AnalyticsDailyDto[]> {
      const response = await httpClient.get<ApiResponse<AnalyticsDailyDto[]>>(
        `${ANALYTICS_BASE}/daily`,
        {
          params: {
            from: filter.from,
            to: filter.to,
            poiId: filter.poiId,
          },
        },
      );

      return unwrapApiResponse(response.data);
    },

    async getSummary(filter: AnalyticsQueryFilter = {}): Promise<AnalyticsSummaryDto> {
      const response = await httpClient.get<ApiResponse<AnalyticsSummaryDto>>(
        `${ANALYTICS_BASE}/summary`,
        {
          params: {
            from: filter.from,
            to: filter.to,
            poiId: filter.poiId,
          },
        },
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
