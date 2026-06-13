import axios, { type AxiosError } from 'axios';
import { tokenStorage } from '../features/auth/services/tokenStorage';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

export const httpClient = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
httpClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 → try refresh once, then logout
let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  pendingQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  pendingQueue = [];
}

httpClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status !== 401 || original?._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            original!.headers!['Authorization'] = `Bearer ${token}`;
            resolve(httpClient(original!));
          },
          reject,
        });
      });
    }

    original!._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) throw new Error('No refresh token');

      const { data } = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, {
        refreshToken,
      });

      tokenStorage.setTokens(data.data);
      processQueue(null, data.data.accessToken);
      original!.headers!['Authorization'] = `Bearer ${data.data.accessToken}`;
      return httpClient(original!);
    } catch (err) {
      processQueue(err, null);
      tokenStorage.clear();
      window.location.href = '/login';
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);
