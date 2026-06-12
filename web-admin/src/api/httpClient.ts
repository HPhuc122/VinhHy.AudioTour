import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { toApiClientError } from '@/api/apiError';
import { tokenStorage } from '@/features/auth/services/tokenStorage';

export interface HttpClientAuthHandlers {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  refreshSession: () => Promise<string>;
  onSessionExpired: () => void;
}

const AUTH_SKIP_HEADER = 'X-Skip-Auth-Refresh';

export function createHttpClient(handlers: HttpClientAuthHandlers): AxiosInstance {
  const client = axios.create({
    baseURL: env.apiBaseUrl || undefined,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30_000,
  });

  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const accessToken = handlers.getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  });

  let refreshPromise: Promise<string> | null = null;

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      if (!originalRequest || originalRequest._retry) {
        return Promise.reject(toApiClientError(error));
      }

      const skipRefresh = originalRequest.headers?.[AUTH_SKIP_HEADER] === '1';
      const status = error.response?.status;

      if (status !== 401 || skipRefresh) {
        return Promise.reject(toApiClientError(error));
      }

      const refreshToken = handlers.getRefreshToken();
      if (!refreshToken) {
        handlers.onSessionExpired();
        return Promise.reject(toApiClientError(error));
      }

      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = handlers.refreshSession().finally(() => {
            refreshPromise = null;
          });
        }

        const newAccessToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        handlers.onSessionExpired();
        return Promise.reject(toApiClientError(refreshError));
      }
    },
  );
  console.log("BASE URL =", env.apiBaseUrl);

  return client;
}

export const httpClient = createHttpClient({
  getAccessToken: () => tokenStorage.getSession()?.accessToken ?? null,
  getRefreshToken: () => tokenStorage.getSession()?.refreshToken ?? null,
  refreshSession: async () => {
    throw new Error('Session refresh is only available inside AuthProvider');
  },
  onSessionExpired: () => {
    tokenStorage.clearSession();
  },
});

export function withSkipAuthRefresh<T extends { headers?: Record<string, unknown> }>(
  config: T,
): T {
  return {
    ...config,
    headers: {
      ...config.headers,
      [AUTH_SKIP_HEADER]: '1',
    },
  };
}
