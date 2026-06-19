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

export function extractApiError(error: unknown): string {
  const clientError = toApiClientError(error);
  if (clientError.errors) {
    const fieldMessages = Object.values(clientError.errors)
      .flat()
      .filter((message) => message.trim().length > 0);
    if (fieldMessages.length > 0) {
      return fieldMessages.join(' ');
    }
  }

  return clientError.message;
}

function isAxiosApiError(
  error: unknown,
): error is AxiosError<ApiResponse<unknown>> {
  return typeof error === 'object' && error !== null && 'isAxiosError' in error;
}
