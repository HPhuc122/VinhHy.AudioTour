import axios from 'axios';

export class ApiClientError extends Error {
  public readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
  }
}

export function toApiClientError(error: unknown): ApiClientError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as { message?: string } | undefined;
    return new ApiClientError(data?.message || error.message || 'Request failed', status);
  }

  if (error instanceof Error) {
    return new ApiClientError(error.message);
  }

  return new ApiClientError('Request failed');
}
