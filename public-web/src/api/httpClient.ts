import axios, { type AxiosError } from 'axios';
import { sessionStore } from '../features/auth/services/sessionStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5082';

export const httpClient = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token
httpClient.interceptors.request.use((config) => {
  const token = sessionStore.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto refresh on 401
let isRefreshing = false;
let queue: { resolve: (t: string) => void; reject: (e: unknown) => void }[] = [];

function processQueue(error: unknown, token: string | null) {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  queue = [];
}

httpClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as typeof error.config & { _retry?: boolean };
    if (error.response?.status !== 401 || original?._retry) return Promise.reject(error);

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({
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
      const refreshToken = sessionStore.getRefreshToken();
      if (!refreshToken) throw new Error('No refresh token');
      const { data } = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, { refreshToken });
      sessionStore.setTokens(data.data);
      processQueue(null, data.data.accessToken);
      original!.headers!['Authorization'] = `Bearer ${data.data.accessToken}`;
      return httpClient(original!);
    } catch (err) {
      processQueue(err, null);
      sessionStore.clear();
      window.location.href = '/dang-nhap';
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);
