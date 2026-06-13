import { httpClient } from '../../../api/httpClient';
import type { ApiResponse } from '../../../types/api';
import type { LoginRequest, LoginResponse } from './types/auth';

export const authApi = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const res = await httpClient.post<ApiResponse<LoginResponse>>(
      '/auth/login',
      data,
    );
    return res.data.data;
  },

  async refresh(refreshToken: string): Promise<LoginResponse> {
    const res = await httpClient.post<ApiResponse<LoginResponse>>(
      '/auth/refresh',
      { refreshToken },
    );
    return res.data.data;
  },
};
