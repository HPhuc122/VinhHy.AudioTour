<<<<<<< HEAD
import type { AxiosError } from 'axios';
import type { ApiResponse } from '@/types/api';

export class ApiClientError extends Error {
  readonly statusCode?: number;
  readonly errors?: Record<string, string[]>;

  constructor(message: string, statusCode?: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export function toApiClientError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) {
    return error;
  }

  if (isAxiosApiError(error)) {
    const body = error.response?.data;
    return new ApiClientError(
      body?.message ?? error.message,
      error.response?.status,
      body?.errors,
    );
  }

  if (error instanceof Error) {
    return new ApiClientError(error.message);
  }

  return new ApiClientError('An unexpected error occurred');
}

function isAxiosApiError(
  error: unknown,
): error is AxiosError<ApiResponse<unknown>> {
  return typeof error === 'object' && error !== null && 'isAxiosError' in error;
=======
import { AxiosError } from 'axios';
import type { ApiResponse } from '../types/api';

export function extractApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiResponse<unknown> | undefined;
    if (data?.message) return data.message;
    if (data?.errors) {
      const first = Object.values(data.errors)[0];
      if (first?.[0]) return first[0];
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Đã xảy ra lỗi không xác định';
>>>>>>> e4ee1d5d7a12b0273847fbb5f15746bd22c16aff
}
