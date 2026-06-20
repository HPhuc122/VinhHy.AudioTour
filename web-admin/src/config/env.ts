const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
const normalizedApiBaseUrl = apiBaseUrl
  ?.replace(/\/+$/, '')
  .replace(/\/api\/v1$/i, '');

export const env = {
  apiBaseUrl: normalizedApiBaseUrl ?? '',
} as const;
