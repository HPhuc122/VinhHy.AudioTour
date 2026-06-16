import { httpClient } from '../../../api/httpClient';
import type { LoginRequest, LoginResponse, RegisterRequest } from '../types/auth';

export const authApi = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const res = await httpClient.post('/auth/login', data);
    return res.data.data;
  },

  async register(data: RegisterRequest): Promise<LoginResponse> {
    const res = await httpClient.post('/auth/register', data);
    return res.data.data;
  },

  async refresh(refreshToken: string): Promise<LoginResponse> {
    const res = await httpClient.post('/auth/refresh', { refreshToken });
    return res.data.data;
  },
};
