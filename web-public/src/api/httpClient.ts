import axios from 'axios';

const BASE_URL = getApiBaseUrl();

export const httpClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!configured) {
    return '/api/v1';
  }

  const normalized = configured.replace(/\/+$/, '');
  return normalized.replace(/\/api\/v1$/i, '') + '/api/v1';
}

httpClient.interceptors.request.use((config) => {
  if (typeof window === 'undefined') {
    return config;
  }

  const storageKey = 'vinhhy_guest_device_id';
  let deviceId = window.localStorage.getItem(storageKey);
  if (!deviceId) {
    deviceId = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(storageKey, deviceId);
  }

  config.headers.set('X-Guest-Device-Id', deviceId);
  return config;
});
