import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5082';
const NORMALIZED_BASE_URL = BASE_URL.replace(/\/+$/, '').replace(/\/api\/v1$/i, '');

export const httpClient = axios.create({
  baseURL: `${NORMALIZED_BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

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
