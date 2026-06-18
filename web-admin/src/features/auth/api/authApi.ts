import type { AxiosInstance } from 'axios';
import type { ApiResponse } from '@/types/api';
import type {
  LoginRequest,
  LoginResponseDto,
  RefreshTokenRequest,
  VendorRegisterRequest,
} from '@/types/auth';
import { toApiClientError } from '@/api/apiError';
import { withSkipAuthRefresh } from '@/api/httpClient';

const AUTH_BASE = '/api/v1/auth';

export function createAuthApi(
  httpClient: AxiosInstance,
  options?: { refreshClient?: AxiosInstance },
) {
  const refreshHttp = options?.refreshClient ?? httpClient;

  return {
    async login(request: LoginRequest): Promise<LoginResponseDto> {
      const response = await httpClient.post<ApiResponse<LoginResponseDto>>(
        `${AUTH_BASE}/login`,
        request,
        withSkipAuthRefresh({}),
      );

      return unwrapApiResponse(response.data);
    },

    async refresh(request: RefreshTokenRequest): Promise<LoginResponseDto> {
      const response = await refreshHttp.post<ApiResponse<LoginResponseDto>>(
        `${AUTH_BASE}/refresh`,
        request,
        withSkipAuthRefresh({}),
      );

      return unwrapApiResponse(response.data);
    },

    async registerVendor(request: VendorRegisterRequest): Promise<void> {
      const response = await httpClient.post<ApiResponse<null>>(
        `${AUTH_BASE}/register`,
        request,
        withSkipAuthRefresh({}),
      );

      if (!response.data.success) {
        throw toApiClientError(new Error(response.data.message || 'Dang ky that bai'));
      }
    },
  };
}

function unwrapApiResponse<T>(body: ApiResponse<T>): T {
  if (!body.success || body.data === null) {
    throw toApiClientError(new Error(body.message || 'Request failed'));
  }

  return body.data;
}

export type AuthApi = ReturnType<typeof createAuthApi>;
