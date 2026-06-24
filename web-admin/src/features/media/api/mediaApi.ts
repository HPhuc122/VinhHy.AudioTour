import type { AxiosInstance } from 'axios';
import { toApiClientError } from '@/api/apiError';
import { buildCmsMediaStreamUrl } from '@/utils/assetUrl';
import type { ApiResponse, PagedResult } from '@/types/api';

const MEDIA_BASE = '/api/v1/media';
const CMS_MEDIA_BASE = '/api/v1/cms/media';

export type MediaFileType = 'image' | 'audio';
export type MediaFilterType = 'all' | MediaFileType;
export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';
export type ApprovalStatusFilter = 'all' | ApprovalStatus;

export interface MediaFileDto {
  id: number;
  fileName: string;
  originalFileName: string;
  fileType: MediaFileType;
  contentType: string;
  fileSize: number;
  relativePath: string;
  publicUrl?: string | null;
  uploadedAt: string;
  uploadedByUserId?: number | null;
  uploadedByUsername?: string | null;
  poiId?: number | null;
  imageCategory?: 'Menu' | 'Highlight' | null;
  poiCode?: string | null;
  poiName?: string | null;
  approvalStatus: ApprovalStatus;
  submittedAt?: string | null;
  reviewedByUserId?: number | null;
  reviewedByUsername?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  isDeleted: boolean;
}

export interface MediaSearchFilter {
  page?: number;
  pageSize?: number;
  search?: string;
  fileType?: MediaFilterType;
  approvalStatus?: ApprovalStatusFilter;
  poiId?: number;
  includeDeleted?: boolean;
}

export interface UploadMediaRequest {
  file: File;
  poiId?: number;
  imageCategory?: 'Menu' | 'Highlight';
}

export function createMediaApi(httpClient: AxiosInstance) {
  return {
    async searchMedia(filter: MediaSearchFilter = {}): Promise<PagedResult<MediaFileDto>> {
      const response = await httpClient.get<ApiResponse<PagedResult<MediaFileDto>>>(
        `${MEDIA_BASE}/search`,
        {
          params: {
            page: filter.page ?? 1,
            pageSize: filter.pageSize ?? 20,
            search: filter.search || undefined,
            fileType:
              filter.fileType && filter.fileType !== 'all' ? filter.fileType : undefined,
            approvalStatus:
              filter.approvalStatus && filter.approvalStatus !== 'all'
                ? filter.approvalStatus
                : undefined,
            poiId: filter.poiId,
            includeDeleted: filter.includeDeleted,
          },
        },
      );

      return unwrapApiResponse(response.data);
    },

    async getMediaByPoi(poiId: number, filter: MediaSearchFilter = {}): Promise<PagedResult<MediaFileDto>> {
      const response = await httpClient.get<ApiResponse<PagedResult<MediaFileDto>>>(
        `${MEDIA_BASE}/by-poi/${poiId}`,
        {
          params: {
            page: filter.page ?? 1,
            pageSize: filter.pageSize ?? 100,
            approvalStatus:
              filter.approvalStatus && filter.approvalStatus !== 'all'
                ? filter.approvalStatus
                : undefined,
          },
        },
      );

      return unwrapApiResponse(response.data);
    },

    async uploadMedia(request: UploadMediaRequest): Promise<MediaFileDto> {
      const form = new FormData();
      form.append('file', request.file);
      if (request.poiId) {
        form.append('poiId', String(request.poiId));
      }
      if (request.imageCategory) {
        form.append('imageCategory', request.imageCategory);
      }

      const response = await httpClient.post<ApiResponse<MediaFileDto>>(
        `${MEDIA_BASE}/upload`,
        form,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      return unwrapApiResponse(response.data);
    },

    async deleteMedia(id: number): Promise<void> {
      const response = await httpClient.delete<ApiResponse<null>>(`${MEDIA_BASE}/${id}`);
      unwrapApiResponse(response.data, true);
    },

    async restoreMedia(id: number): Promise<void> {
      const response = await httpClient.post<ApiResponse<null>>(`${MEDIA_BASE}/${id}/restore`);
      unwrapApiResponse(response.data, true);
    },

    async approveMedia(id: number): Promise<MediaFileDto> {
      const response = await httpClient.post<ApiResponse<MediaFileDto>>(
        `${MEDIA_BASE}/${id}/approve`,
      );

      return unwrapApiResponse(response.data);
    },

    async rejectMedia(id: number, reason: string): Promise<MediaFileDto> {
      const response = await httpClient.post<ApiResponse<MediaFileDto>>(
        `${MEDIA_BASE}/${id}/reject`,
        { reason },
      );

      return unwrapApiResponse(response.data);
    },
  };
}

export function getMediaUrl(media: MediaFileDto): string {
  if (media.publicUrl?.includes('/api/v1/cms/media/')) {
    return media.publicUrl;
  }

  return buildCmsMediaStreamUrl(media.id);
}

export async function fetchMediaImageBlob(
  client: AxiosInstance,
  mediaFileId: number,
): Promise<Blob> {
  const response = await client.get<Blob>(
    `${CMS_MEDIA_BASE}/images/${mediaFileId}/stream`,
    { responseType: 'blob' },
  );

  return response.data;
}

export async function fetchPoiAssetBlob(
  client: AxiosInstance,
  poiId: number,
  relativePath: string,
): Promise<Blob> {
  const response = await client.get<Blob>(
    `${CMS_MEDIA_BASE}/poi-assets/stream`,
    {
      params: {
        poiId,
        relativePath: relativePath.replace(/\\/g, '/').replace(/^\/+/, ''),
      },
      responseType: 'blob',
    },
  );

  return response.data;
}

function unwrapApiResponse<T>(body: ApiResponse<T>, allowNull = false): T {
  if (!body.success || (!allowNull && (body.data === null || typeof body.data === 'undefined'))) {
    throw toApiClientError(new Error(body.message || 'Thao tác thất bại'));
  }

  return body.data as T;
}

export type MediaApi = ReturnType<typeof createMediaApi>;
