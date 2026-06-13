import axios from 'axios';
import { env } from '@/config/env';

export const httpClient = axios.create({
  baseURL: env.apiBaseUrl || undefined,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30_000,
});
