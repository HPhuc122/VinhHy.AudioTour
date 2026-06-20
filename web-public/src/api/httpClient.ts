import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5082';
const NORMALIZED_BASE_URL = BASE_URL.replace(/\/+$/, '').replace(/\/api\/v1$/i, '');

export const httpClient = axios.create({
  baseURL: `${NORMALIZED_BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});
